from flask import Blueprint, request, jsonify, current_app
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required
from app.file_management.ftp_utils import get_ftp_manager
from app.utils.db_schema import get_db_schema
from datetime import datetime, timezone
import os
from werkzeug.utils import secure_filename

process_stages_bp = Blueprint('process_stages_bp', __name__)

# ──────────────────────────────────────────────
# ROLE CONSTANTS (must match Role.Title in DB)
# ──────────────────────────────────────────────
ROLE_OWNER       = "Owner"
ROLE_AUTO_ENG    = "Automation Engineer"
ROLE_RPA_LEAD    = "Automation Lead"
ROLE_QA_ENG   = "QA Engineer"

ROLE_ID_MAP = {
    ROLE_OWNER:    15,
    ROLE_RPA_LEAD: 14,
    ROLE_AUTO_ENG: 3,
    ROLE_QA_ENG:   16,
}

ASSIGNABLE_ROLE_IDS = (3, 16)

def get_role_id(role_name: str) -> int | None:
    return ROLE_ID_MAP.get(role_name)
    
# ──────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────

def format_datetime_for_json(obj):
    if isinstance(obj, dict):
        return {k: format_datetime_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [format_datetime_for_json(i) for i in obj]
    elif isinstance(obj, datetime):
        if obj.tzinfo is None:
            return obj.isoformat() + 'Z'
        return obj.astimezone(timezone.utc).isoformat().replace('+00:00', 'Z')
    return obj


def get_user(req):
    """Return (user_id, role_name) from JWT token."""
    user_id   = req.user.get("UserId") or req.user.get("userId")
    role_name = req.user.get("RoleName") or req.user.get("roleName") or ""
    return user_id, role_name


def role_check(actual_role: str, allowed_roles: list):
    """Return 403 response if role not allowed, else None."""
    if actual_role not in allowed_roles:
        return jsonify({
            "success": False,
            "message": f"Access Denied: Only {' or '.join(allowed_roles)} can perform this action."
        }), 403
    return None


# ══════════════════════════════════════════════
# FILE UPLOAD
# ══════════════════════════════════════════════

@process_stages_bp.route('/api/process-registration/upload-file', methods=['POST'])
@token_required
def upload_process_registration_file():
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "No file provided"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "message": "No file selected"}), 400

    file_type = request.form.get('fileType', '').strip().lower()

    try:
        UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
        PROCESS_FOLDER = os.path.join(UPLOAD_FOLDER, "process_registration")
        os.makedirs(PROCESS_FOLDER, exist_ok=True)

        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        name, ext = os.path.splitext(filename)
        unique_filename = f"{name}_{timestamp}{ext}"
        file_path = os.path.join(PROCESS_FOLDER, unique_filename)

        file.seek(0)
        file.save(file_path)

        if not os.path.exists(file_path):
            return jsonify({"success": False, "message": "File save failed"}), 500

        file_size = os.path.getsize(file_path)
        if file_size == 0:
            try: os.remove(file_path)
            except: pass
            return jsonify({"success": False, "message": "Uploaded file is empty"}), 400

        mime_type = file.content_type or 'application/octet-stream'
        relative_path = os.path.join("process_registration", unique_filename).replace('\\', '/')

        DBSCHEMA = get_db_schema()
        ftp_manager = get_ftp_manager(DBSCHEMA)
        if ftp_manager:
            try:
                ftp_manager.upload_file(
                    local_file_path=file_path,
                    remote_directory="/process_registration",
                    remote_filename=unique_filename
                )
            except Exception as ftp_error:
                current_app.logger.error(f"FTP upload error: {str(ftp_error)}")

        return jsonify({
            "success": True,
            "filename": unique_filename,
            "filePath": relative_path,
            "mimeType": mime_type,
            "fileSize": file_size,
            "fileType": file_type or None
        }), 200

    except Exception as e:
        current_app.logger.error(f"File upload error: {str(e)}")
        return jsonify({"success": False, "message": f"File upload failed: {str(e)}"}), 500


# ══════════════════════════════════════════════
# 1. PROCESS REGISTRATION  (Owner only)
# ══════════════════════════════════════════════

@process_stages_bp.route('/api/process-registration', methods=['POST'])
@token_required
def insert_process_registration():
    user_id, role = get_user(request)
    denied = role_check(role, [ROLE_OWNER])
    if denied: return denied

    conn = cursor = None
    try:
        DBSCHEMA = get_db_schema()
        data = request.get_json()
        conn = connect_to_database()
        cursor = conn.cursor()

        cursor.execute(
            f"EXEC {DBSCHEMA}.InsertProcessRegistration "
            "@Title=%s, @Description=%s, @Priority=%s, "
            "@ExpectedROI=%s, @Stakeholder=%s, @Tag=%s, "
            "@SampledataPath=%s, @MimeType=%s, "
            "@SopDoc=%s, @SopMimetype=%s, "
            "@Department=%s, @CreatedBy=%s",
            (
                data.get("Title"), data.get("Description"), data.get("Priority"),
                data.get("ExpectedROI"), data.get("Stakeholder"), data.get("Tag"),
                data.get("SampledataPath"), data.get("MimeType"),
                data.get("SopDoc"), data.get("SopMimetype"),
                data.get("Department"), user_id
            )
        )
        result = cursor.fetchone()
        conn.commit()

        return jsonify({
            "success": True,
            "ProcessId": result[0] if result else None,
            "message": "Process registered and moved to Initial Triage."
        }), 200

    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# ══════════════════════════════════════════════
# 2. INITIAL TRIAGE  (Automation Engineer only)
# ══════════════════════════════════════════════

@process_stages_bp.route('/api/initial-triage', methods=['POST'])
@token_required
def insert_initial_triage():
    user_id, role = get_user(request)
    denied = role_check(role, [ROLE_RPA_LEAD])
    if denied: 
        return denied

    conn = cursor = None
    try:
        DBSCHEMA = get_db_schema()
        data = request.get_json()
        process_id = data.get("ProcessId")

        conn = connect_to_database()
        cursor = conn.cursor()

        # 🔹 STEP 1 — Check overall status
        cursor.execute(
            f"""
            SELECT OverallStatus, CurrentStageId
            FROM {DBSCHEMA}.ProcessRegistration
            WHERE P_id = %s
            """,
            (process_id,)
        )

        result = cursor.fetchone()

        if not result:
            return jsonify({"success": False, "message": "Process not found"}), 404

        overall_status, current_stage_id = result

        if overall_status not in ("Active", "Rejected"):
            return jsonify({
                "success": False,
                "message": "Process cannot be modified in current state."
            }), 400

        # 🔹 STEP 3 — Call stored procedure
        cursor.execute(
            f"EXEC {DBSCHEMA}.InsertInitialTriage "
            "@ProcessId=%s, @IsRuleBased=%s, @IsStable=%s, "
            "@SystemsInvolved=%s, @Blockers=%s, "
            "@EstimatedAutomationPercent=%s, "
            "@ExceptionsManageable=%s, "
            "@ComplianceRisk=%s, @ComplianceRiskSummary=%s, "
            "@LoggedInUserId=%s, "
            "@AnalysisDesignDuration=%s, @DevelopmentDuration=%s, "
            "@TestingDuration=%s, @DeploymentDuration=%s, "
            "@TrainingGoLiveDuration=%s",
            (
                process_id,
                data.get("IsRuleBased"),
                data.get("IsStable"),
                data.get("SystemsInvolved"),
                data.get("Blockers"),
                data.get("EstimatedAutomationPercent"),
                data.get("AreExceptionsManageable"),
                data.get("ComplianceRisk"),
                data.get("ComplianceRiskSummary"),
                user_id,
                data.get("AnalysisDesignDuration"),
                data.get("DevelopmentDuration"),
                data.get("TestingDuration"),
                data.get("DeploymentDuration"),
                data.get("TrainingGoLiveDuration"),
            )
        )

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Initial Triage submitted. Awaiting approval."
        }), 200

    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# ══════════════════════════════════════════════
# 3. DETAILED ANALYSIS  (Automation Engineer only)
# ══════════════════════════════════════════════

@process_stages_bp.route('/api/detailed-analysis', methods=['POST'])
@token_required
def insert_detailed_analysis():
    user_id, role = get_user(request)
    denied = role_check(role, [ROLE_AUTO_ENG])
    if denied: return denied

    conn = cursor = None
    try:
        DBSCHEMA = get_db_schema()
        data = request.get_json()
        conn = connect_to_database()
        cursor = conn.cursor()

        cursor.execute(
            f"EXEC {DBSCHEMA}.InsertDetailedAnalysis "
            "@ProcessId=%s, @PddPath=%s, @MimeType=%s, @LoggedInUserId=%s",
            (data.get("ProcessId"), data.get("PddPath"), data.get("MimeType"), user_id)
        )
        conn.commit()
        return jsonify({"success": True, "message": "Detailed Analysis submitted. Awaiting approval."}), 200

    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# ══════════════════════════════════════════════
# 4. TECHNICAL ASSESSMENT  (Automation Engineer only)
# ══════════════════════════════════════════════

@process_stages_bp.route('/api/technical-assessment', methods=['POST'])
@token_required
def insert_technical_assessment():
    user_id, role = get_user(request)
    denied = role_check(role, [ROLE_AUTO_ENG])
    if denied: return denied

    conn = cursor = None
    try:
        DBSCHEMA = get_db_schema()
        data = request.get_json()
        conn = connect_to_database()
        cursor = conn.cursor()

        cursor.execute(
            f"EXEC {DBSCHEMA}.InsertTechnicalAssessment "
            "@ProcessId=%s, @InfrastructureReady=%s, @BotHostingType=%s, "
            "@CredentialVaultRequired=%s, @ExternalSystemDependencies=%s, "
            "@LicensingImpact=%s, @RiskLevel=%s, @TechnicalComments=%s, "
            "@RpaTool=%s, @BotType=%s, @TargetEnvironment=%s, @OrchestratorUrl=%s, "
            "@LoggedInUserId=%s",
            (
                data.get("ProcessId"),
                data.get("InfrastructureReady"),
                data.get("BotHostingType"),
                data.get("CredentialVaultRequired"),
                data.get("ExternalSystemDependencies"),
                data.get("LicensingImpact"),
                data.get("RiskLevel"),
                data.get("TechnicalComments"),
                data.get("RpaTool"),
                data.get("BotType"),
                data.get("TargetEnvironment"),
                data.get("OrchestratorUrl"),
                user_id
            )
        )
        conn.commit()
        return jsonify({"success": True, "message": "Technical Assessment submitted successfully."}), 200

    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# ══════════════════════════════════════════════
# 5. BUSINESS CASE  (Automation Engineer only)
# ══════════════════════════════════════════════

@process_stages_bp.route('/api/business-case', methods=['POST'])
@token_required
def insert_business_case():
    user_id, role = get_user(request)
    denied = role_check(role, [ROLE_RPA_LEAD]) 
    if denied: return denied

    conn = cursor = None
    try:
        DBSCHEMA = get_db_schema()
        data = request.get_json()
        conn = connect_to_database()
        cursor = conn.cursor()

        cursor.execute(
            f"EXEC {DBSCHEMA}.InsertBusinessCase "
            "@ProcessId=%s, "
            "@AnnualProcessCost=%s, @WeeklyHoursSpent=%s, @PeopleInvolved=%s, "
            "@ImplementationCost=%s, @EfficiencyGainPercent=%s, @ErrorReductionPercent=%s, "
            "@LoggedInUserId=%s",
            (
                data.get("ProcessId"),
                data.get("AnnualProcessCost"),
                data.get("WeeklyHoursSpent"),
                data.get("PeopleInvolved"),
                data.get("ImplementationCost"),
                data.get("EfficiencyGainPercent"),
                data.get("ErrorReductionPercent"),
                user_id
            )
        )

        # Fetch calculated values returned by SP
        row = cursor.fetchone()
        conn.commit()

        calculated = {}
        if row:
            columns = [col[0] for col in cursor.description]
            calculated = dict(zip(columns, row))

        return jsonify({
            "success"  : True,
            "message"  : "Business Case submitted. Awaiting approval.",
            "data"     : calculated  # BC_id, FteSavings, CostSavings, PaybackMonths, RoiPercent, FiveYearNetValue
        }), 200

    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# ══════════════════════════════════════════════
# 6a. DEVELOPMENT — START  (status stays In Progress)
# ══════════════════════════════════════════════

@process_stages_bp.route("/api/stage/development/start", methods=["POST"])
@token_required
def start_development():
    user_id, role = get_user(request)
    denied = role_check(role, [ROLE_AUTO_ENG])
    if denied: return denied

    data = request.get_json(silent=True) or {}
    process_id = data.get("processId")
    if not process_id:
        return jsonify({"success": False, "message": "processId is required."}), 400

    conn = cursor = None
    try:
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        cursor = conn.cursor()

        cursor.execute(
            f"EXEC {DBSCHEMA}.StartDevelopmentStage @ProcessId=%s, @LoggedInUserId=%s",
            (int(process_id), int(user_id))
        )

        row = cursor.fetchone()
        if not row:
            return jsonify({"success": False, "message": "No response from stored procedure."}), 500

        columns = [col[0] for col in cursor.description]
        result = dict(zip(columns, row))

        if not result.get("success"):
            return jsonify({"success": False, "message": result.get("message", "Failed to start development.")}), 400

        conn.commit()
        return jsonify({
            "success": True,
            "message": result.get("message", "Development started."),
            "data": {
                "processId": result.get("processId"),
                "startedAt": result.get("startedAt").isoformat() if result.get("startedAt") else None,
            }
        }), 200

    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# ══════════════════════════════════════════════
# 6b. DEVELOPMENT — COMPLETE  (Completed → opens QA)
# ══════════════════════════════════════════════

@process_stages_bp.route("/api/stage/development/complete", methods=["POST"])
@token_required
def complete_development():
    user_id, role = get_user(request)
    denied = role_check(role, [ROLE_AUTO_ENG])
    if denied: return denied

    data = request.get_json(silent=True) or {}
    process_id = data.get("processId")
    if not process_id:
        return jsonify({"success": False, "message": "processId is required."}), 400

    conn = cursor = None
    try:
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        cursor = conn.cursor()

        cursor.execute(
            f"EXEC {DBSCHEMA}.CompleteDevelopmentStage @ProcessId=%s, @LoggedInUserId=%s",
            (int(process_id), int(user_id))
        )

        row = cursor.fetchone()
        if not row:
            return jsonify({"success": False, "message": "No response from stored procedure."}), 500

        columns = [col[0] for col in cursor.description]
        result = dict(zip(columns, row))

        if not result.get("success"):
            return jsonify({"success": False, "message": result.get("message", "Failed to complete development.")}), 400

        conn.commit()

        def fmt(val):
            if val is None: return None
            if isinstance(val, datetime): return val.isoformat()
            return str(val)

        return jsonify({
            "success": True,
            "message": result.get("message", "Development completed. Process moved to QA."),
            "data": {
                "processId":    result.get("processId"),
                "startedAt":    fmt(result.get("startedAt")),
                "completedAt":  fmt(result.get("completedAt")),
                "durationDays": result.get("durationDays"),
            }
        }), 200

    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# ══════════════════════════════════════════════
# 6c. DEVELOPMENT — GET  
# ══════════════════════════════════════════════

@process_stages_bp.route("/api/stage/development/<int:process_id>", methods=["GET"])
@token_required
def get_development_stage(current_user, process_id):
    conn   = None
    cursor = None
    try:
        from db import get_connection
        conn   = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                ds.Dev_id,
                ds.ProcessId,
                ds.development_start_date,
                ds.development_end_date,
                ds.createdAt,
                ds.updatedAt,
                st.status AS stage_status,
                DATEDIFF(DAY,
                    ds.development_start_date,
                    ISNULL(ds.development_end_date, GETDATE())
                ) AS durationDays
            FROM ICAT.DevelopmentStage ds
            LEFT JOIN ICAT.StageTracking st ON st.ProcessId = ds.ProcessId
            LEFT JOIN ICAT.StageMaster   sm ON st.StageId   = sm.StageId
                AND sm.StageName = 'Development'
            WHERE ds.ProcessId = ?
        """, (process_id,))

        row = cursor.fetchone()
        if not row:
            return jsonify({"success": True, "data": None}), 200

        columns = [col[0] for col in cursor.description]
        result  = dict(zip(columns, row))

        # Format datetimes
        for key in ["development_start_date", "development_end_date", "createdAt", "updatedAt"]:
            if result.get(key) and isinstance(result[key], datetime):
                result[key] = result[key].isoformat()

        return jsonify({"success": True, "data": result}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if cursor: cursor.close()
        if conn:   conn.close()

# ══════════════════════════════════════════════
# 7. QA STAGE  (Automation Engineer only)
# ══════════════════════════════════════════════

# ── Start QA ─────────────────────────────
@process_stages_bp.route('/api/stage/qa/start', methods=['POST'])
@token_required
def start_qa_stage():
    user_id, role = get_user(request)
    denied = role_check(role, [ROLE_AUTO_ENG])
    if denied: return denied
    conn = cursor = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Request body is required"}), 400
        process_id = data.get("processId")
        if not process_id:
            return jsonify({"success": False, "message": "processId is required"}), 400

        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        cursor = conn.cursor()

        cursor.execute(
            f"EXEC {DBSCHEMA}.StartQAStage @ProcessId=%s, @LoggedInUserId=%s",
            (process_id, user_id)
        )
        result = cursor.fetchall()
        conn.commit()

        row = {}
        if result:
            columns = [col[0] for col in cursor.description]
            row = format_datetime_for_json(dict(zip(columns, result[0])))

        return jsonify({
            "success": True,
            "message": row.pop("StatusMessage", "QA Started successfully"),
            "data": {
                "processId": process_id,
                "startedAt": row.get("startedAt"),
                "qaStartDate": str(row.get("qa_start_date", "")) if row.get("qa_start_date") else None,
            }
        }), 201

    except Exception as e:
        if conn: conn.rollback()
        current_app.logger.error(f"Error in start_qa_stage: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# ── Complete QA (form submit with test data) ───────────────────
@process_stages_bp.route('/api/stage/qa/complete', methods=['POST'])
@token_required
def complete_qa_stage():
    user_id, role = get_user(request)
    denied = role_check(role, [ROLE_AUTO_ENG])
    if denied: return denied
    conn = cursor = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Request body is required"}), 400
        process_id = data.get("processId")
        if not process_id:
            return jsonify({"success": False, "message": "processId is required"}), 400

        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        cursor = conn.cursor()

        cursor.execute(
            f"""EXEC {DBSCHEMA}.CompleteQAStage
                @ProcessId=%s,
                @TotalTestCases=%s, @PassedTestCases=%s, @FailedTestCases=%s,
                @CriticalDefects=%s, @QAStatus=%s, @QAComments=%s,
                @LoggedInUserId=%s
            """,
            (
                process_id,
                data.get("totalTestCases"),
                data.get("passedTestCases"),
                data.get("failedTestCases"),
                data.get("criticalDefects"),
                data.get("qaStatus"),
                data.get("qaComments"),
                user_id,
            )
        )
        result = cursor.fetchall()
        conn.commit()

        row = {}
        if result:
            columns = [col[0] for col in cursor.description]
            row = format_datetime_for_json(dict(zip(columns, result[0])))

        return jsonify({
            "success": True,
            "message": row.pop("StatusMessage", "QA Completed successfully"),
            "data": {
                "processId": process_id,
                "qaStartDate":  str(row.get("qa_start_date",  "")) if row.get("qa_start_date")  else None,
                "qaEndDate":    str(row.get("qa_end_date",    "")) if row.get("qa_end_date")    else None,
                "durationDays": row.get("DurationDays"),
                "passRate":     row.get("PassRate"),
                "qaStatus":     row.get("qa_status"),
            }
        }), 201

    except Exception as e:
        if conn: conn.rollback()
        current_app.logger.error(f"Error in complete_qa_stage: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@process_stages_bp.route('/api/stage/qa/<int:process_id>', methods=['GET'])
@token_required
def get_qa_stage(process_id):
    conn = cursor = None
    try:
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        cursor = conn.cursor()

        cursor.execute(
            f"SELECT TOP 1 * FROM {DBSCHEMA}.QAStage "
            "WHERE process_id=%s AND IsDeleted=0 ORDER BY createdAt DESC",
            (process_id,)
        )
        result = cursor.fetchall()
        if not result:
            return jsonify({"success": True, "hasData": False, "data": None}), 200

        columns = [col[0] for col in cursor.description]
        row = format_datetime_for_json(dict(zip(columns, result[0])))
        return jsonify({"success": True, "hasData": True, "data": row}), 200

    except Exception as e:
        current_app.logger.error(f"Error in get_qa_stage: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# ══════════════════════════════════════════════
# 8. UAT STAGE  (Owner only)
# ══════════════════════════════════════════════

# ── Start UAT (one-click, no date) ────────────────────────────
@process_stages_bp.route('/api/stage/uat/start', methods=['POST'])
@token_required
def start_uat_stage():
    user_id, role = get_user(request)
    denied = role_check(role, [ROLE_OWNER])
    if denied: return denied
    conn = cursor = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Request body is required"}), 400
        process_id = data.get("processId")
        if not process_id:
            return jsonify({"success": False, "message": "processId is required"}), 400

        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        cursor = conn.cursor()

        cursor.execute(
            f"EXEC {DBSCHEMA}.StartUATStage @ProcessId=%s, @LoggedInUserId=%s",
            (process_id, user_id)
        )
        result = cursor.fetchall()
        conn.commit()

        row = {}
        if result:
            columns = [col[0] for col in cursor.description]
            row = format_datetime_for_json(dict(zip(columns, result[0])))

        return jsonify({
            "success": True,
            "message": row.pop("StatusMessage", "UAT Started successfully"),
            "data": {
                "processId": process_id,
                "startedAt": row.get("startedAt"),
                "uatStartDate": str(row.get("uat_start_date", "")) if row.get("uat_start_date") else None,
            }
        }), 201

    except Exception as e:
        if conn: conn.rollback()
        current_app.logger.error(f"Error in start_uat_stage: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# ── Complete UAT (form submit) ────────────────────────────────
@process_stages_bp.route('/api/stage/uat/complete', methods=['POST'])
@token_required
def complete_uat_stage():
    user_id, role = get_user(request)
    denied = role_check(role, [ROLE_OWNER])
    if denied: return denied
    conn = cursor = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Request body is required"}), 400
        process_id = data.get("processId")
        if not process_id:
            return jsonify({"success": False, "message": "processId is required"}), 400

        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        cursor = conn.cursor()

        cursor.execute(
            f"""EXEC {DBSCHEMA}.CompleteUATStage
                @ProcessId=%s,
                @TestResult=%s, @DefectsFound=%s, @UATComments=%s,
                @LoggedInUserId=%s
            """,
            (
                process_id,
                data.get("testResult"),
                data.get("defectsFound"),
                data.get("uatComments"),
                user_id,
            )
        )
        result = cursor.fetchall()
        conn.commit()

        row = {}
        if result:
            columns = [col[0] for col in cursor.description]
            row = format_datetime_for_json(dict(zip(columns, result[0])))

        return jsonify({
            "success": True,
            "message": row.pop("StatusMessage", "UAT Completed successfully"),
            "data": {
                "processId": process_id,
                "uatStartDate":  str(row.get("uat_start_date",  "")) if row.get("uat_start_date")  else None,
                "uatEndDate":    str(row.get("uat_end_date",    "")) if row.get("uat_end_date")    else None,
                "durationDays":  row.get("DurationDays"),
                "testResult":    row.get("test_result"),
            }
        }), 201

    except Exception as e:
        if conn: conn.rollback()
        current_app.logger.error(f"Error in complete_uat_stage: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@process_stages_bp.route('/api/stage/uat/<int:process_id>', methods=['GET'])
@token_required
def get_uat_stage(process_id):
    conn = cursor = None
    try:
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        cursor = conn.cursor()

        cursor.execute(
            f"SELECT TOP 1 * FROM {DBSCHEMA}.UATStage "
            "WHERE process_id=%s AND IsDeleted=0 ORDER BY createdAt DESC",
            (process_id,)
        )
        result = cursor.fetchall()
        if not result:
            return jsonify({"success": True, "hasData": False, "data": None}), 200

        columns = [col[0] for col in cursor.description]
        row = format_datetime_for_json(dict(zip(columns, result[0])))
        return jsonify({"success": True, "hasData": True, "data": row}), 200

    except Exception as e:
        current_app.logger.error(f"Error in get_uat_stage: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# ══════════════════════════════════════════════
# 9. GOLIVE STAGE  (Automation Engineer only)
# ══════════════════════════════════════════════

@process_stages_bp.route('/api/stage/golive', methods=['POST'])
@token_required
def insert_golive_stage():
    user_id, role = get_user(request)
    denied = role_check(role, [ROLE_AUTO_ENG])
    if denied: return denied

    conn = cursor = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Request body is required"}), 400
        process_id = data.get("processId")
        if not process_id:
            return jsonify({"success": False, "message": "processId is required"}), 400

        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        cursor = conn.cursor()

        cursor.execute(
            f"""EXEC {DBSCHEMA}.InsertGoLiveStage
                @ProcessId=%s, @DeploymentDate=%s, @DeploymentEnvironment=%s,
                @BotVersion=%s, @DeploymentNotes=%s, @LoggedInUserId=%s
            """,
            (
                process_id,
                data.get("deploymentDate"), data.get("deploymentEnvironment"),
                data.get("botVersion"), data.get("deploymentNotes"),
                user_id,
            )
        )
        result = cursor.fetchall()
        conn.commit()

        if not result:
            return jsonify({"success": True, "message": "GoLive stage saved and sent for approval."}), 201

        columns = [col[0] for col in cursor.description]
        row = format_datetime_for_json(dict(zip(columns, result[0])))
        return jsonify({
            "success": True,
            "message": row.pop("StatusMessage", "GoLive stage saved and sent for approval"),
            "data": row
        }), 201

    except Exception as e:
        if conn: conn.rollback()
        current_app.logger.error(f"Error in insert_golive_stage: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@process_stages_bp.route('/api/stage/golive/<int:process_id>', methods=['GET'])
@token_required
def get_golive_stage(process_id):
    conn = cursor = None
    try:
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        cursor = conn.cursor()

        cursor.execute(
            f"SELECT TOP 1 * FROM {DBSCHEMA}.GoLive "
            "WHERE process_id=%s AND IsDeleted=0 ORDER BY createdAt DESC",
            (process_id,)
        )
        result = cursor.fetchall()
        if not result:
            return jsonify({"success": True, "hasData": False, "data": None}), 200

        columns = [col[0] for col in cursor.description]
        row = format_datetime_for_json(dict(zip(columns, result[0])))
        return jsonify({"success": True, "hasData": True, "data": row}), 200

    except Exception as e:
        current_app.logger.error(f"Error in get_golive_stage: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# ══════════════════════════════════════════════
# 10. HYPERCARE STAGE  (Automation Engineer only)
# ══════════════════════════════════════════════

# ── Start Hypercare (one-click) ───────────────────────────────
@process_stages_bp.route('/api/stage/hypercare/start', methods=['POST'])
@token_required
def start_hypercare_stage():
    user_id, role = get_user(request)
    denied = role_check(role, [ROLE_AUTO_ENG])
    if denied: return denied
    conn = cursor = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Request body is required"}), 400
        process_id = data.get("processId")
        if not process_id:
            return jsonify({"success": False, "message": "processId is required"}), 400

        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        cursor = conn.cursor()

        cursor.execute(
            f"EXEC {DBSCHEMA}.StartHypercareStage @ProcessId=%s, @LoggedInUserId=%s",
            (process_id, user_id)
        )
        result = cursor.fetchall()
        conn.commit()

        row = {}
        if result:
            columns = [col[0] for col in cursor.description]
            row = format_datetime_for_json(dict(zip(columns, result[0])))

        return jsonify({
            "success": True,
            "message": row.pop("StatusMessage", "Hypercare Started successfully"),
            "data": {
                "processId": process_id,
                "startedAt": row.get("startedAt"),
                "hypercareStartDate": str(row.get("hypercare_start_date", "")) if row.get("hypercare_start_date") else None,
            }
        }), 201

    except Exception as e:
        if conn: conn.rollback()
        current_app.logger.error(f"Error in start_hypercare_stage: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# ── Complete Hypercare (form submit) ──────────────────────────
@process_stages_bp.route('/api/stage/hypercare/complete', methods=['POST'])
@token_required
def complete_hypercare_stage():
    user_id, role = get_user(request)
    denied = role_check(role, [ROLE_AUTO_ENG])
    if denied: return denied
    conn = cursor = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Request body is required"}), 400
        process_id = data.get("processId")
        if not process_id:
            return jsonify({"success": False, "message": "processId is required"}), 400

        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        cursor = conn.cursor()

        cursor.execute(
            f"""EXEC {DBSCHEMA}.CompleteHypercareStage
                @ProcessId=%s,
                @IncidentsReported=%s, @IncidentsResolved=%s,
                @BotAvailabilityPercent=%s, @AvgHandlingTime=%s,
                @SlaBreachers=%s, @Escalations=%s,
                @HypercareOutcome=%s, @HypercareNotes=%s,
                @LoggedInUserId=%s
            """,
            (
                process_id,
                data.get("incidentsReported"),
                data.get("incidentsResolved"),
                data.get("botAvailabilityPercent"),
                data.get("avgHandlingTime"),
                data.get("slaBreachers"),
                data.get("escalations"),
                data.get("hypercareOutcome"),
                data.get("hypercareNotes"),
                user_id,
            )
        )
        result = cursor.fetchall()
        conn.commit()

        row = {}
        if result:
            columns = [col[0] for col in cursor.description]
            row = format_datetime_for_json(dict(zip(columns, result[0])))

        return jsonify({
            "success": True,
            "message": row.pop("StatusMessage", "Hypercare Completed successfully"),
            "data": {
                "processId":             process_id,
                "hypercareStartDate":    str(row.get("hypercare_start_date", "")) if row.get("hypercare_start_date") else None,
                "hypercareEndDate":      str(row.get("hypercare_end_date",   "")) if row.get("hypercare_end_date")   else None,
                "durationDays":          row.get("DurationDays"),
                "hypercareOutcome":      row.get("hypercare_outcome"),
                "botAvailability":       row.get("bot_availability_percent"),
            }
        }), 201

    except Exception as e:
        if conn: conn.rollback()
        current_app.logger.error(f"Error in complete_hypercare_stage: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# ── Submit Handover ───────────────────────────────────────────
@process_stages_bp.route('/api/stage/handover', methods=['POST'])
@token_required
def insert_handover_stage():
    user_id, role = get_user(request)
    denied = role_check(role, [ROLE_AUTO_ENG])
    if denied: return denied
    conn = cursor = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Request body is required"}), 400
        process_id = data.get("processId")
        if not process_id:
            return jsonify({"success": False, "message": "processId is required"}), 400

        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        cursor = conn.cursor()

        cursor.execute(
            f"""EXEC {DBSCHEMA}.InsertHandoverStage
                @ProcessId=%s,
                @BauContactName=%s, @BauTeamName=%s,
                @SupportModel=%s, @BotDocumentationPath=%s, @BotDocMimeType=%s,
                @KnownLimitations=%s, @EscalationPath=%s,
                @SlaAgreed=%s, @TrainingCompleted=%s,
                @HandoverNotes=%s, @LoggedInUserId=%s
            """,
            (
                process_id,
                data.get("bauContactName"),
                data.get("bauTeamName"),
                data.get("supportModel"),
                data.get("botDocumentationPath"),
                data.get("botDocMimeType"),
                data.get("knownLimitations"),
                data.get("escalationPath"),
                data.get("slaAgreed"),
                1 if data.get("trainingCompleted") else 0,
                data.get("handoverNotes"),
                user_id,
            )
        )
        result = cursor.fetchall()
        conn.commit()

        row = {}
        if result:
            columns = [col[0] for col in cursor.description]
            row = format_datetime_for_json(dict(zip(columns, result[0])))

        return jsonify({
            "success": True,
            "message": row.pop("StatusMessage", "Handover submitted successfully"),
            "data": {"processId": process_id}
        }), 201

    except Exception as e:
        if conn: conn.rollback()
        current_app.logger.error(f"Error in insert_handover_stage: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# ── Get Handover data ─────────────────────────────────────────
@process_stages_bp.route('/api/stage/handover/<int:process_id>', methods=['GET'])
@token_required
def get_handover_stage(process_id):
    conn = cursor = None
    try:
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        cursor = conn.cursor()

        cursor.execute(
            f"SELECT TOP 1 * FROM {DBSCHEMA}.HandoverStage "
            "WHERE process_id=%s AND IsDeleted=0 ORDER BY createdAt DESC",
            (process_id,)
        )
        result = cursor.fetchall()
        if not result:
            return jsonify({"success": True, "hasData": False, "data": None}), 200

        columns = [col[0] for col in cursor.description]
        row = format_datetime_for_json(dict(zip(columns, result[0])))
        return jsonify({"success": True, "hasData": True, "data": row}), 200

    except Exception as e:
        current_app.logger.error(f"Error in get_handover_stage: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# ── Download handover runbook ─────────────────────────────────
@process_stages_bp.route('/api/download-handover-doc/<int:process_id>', methods=['GET'])
@token_required
def download_handover_doc(process_id):
    conn = cursor = None
    try:
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        cursor = conn.cursor()

        cursor.execute(
            f"SELECT TOP 1 bot_documentation_path, bot_doc_mime_type "
            f"FROM {DBSCHEMA}.HandoverStage "
            "WHERE process_id=%s AND IsDeleted=0 ORDER BY createdAt DESC",
            (process_id,)
        )
        result = cursor.fetchone()
        if not result or not result[0]:
            return jsonify({"success": False, "message": "No document found"}), 404

        file_path, mime_type = result
        if not os.path.exists(file_path):
            return jsonify({"success": False, "message": "File not found on server"}), 404

        filename = os.path.basename(file_path)
        return send_file(
            file_path,
            mimetype=mime_type or "application/octet-stream",
            as_attachment=True,
            download_name=filename
        )

    except Exception as e:
        current_app.logger.error(f"Error in download_handover_doc: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

# ══════════════════════════════════════════════
# STAGE TRACKING  (everyone can view)
# ══════════════════════════════════════════════

@process_stages_bp.route('/api/stage-tracking/<int:process_id>', methods=['GET'])
@token_required
def get_stage_tracking(process_id):
    conn = cursor = None
    try:
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        cursor = conn.cursor()

        cursor.execute(
            f"""
            SELECT
                ST.ST_id,
                ST.process_id,
                ST.StageId,
                SM.StageName,
                SM.SequenceOrder,
                SM.IsApprovalRequired,
                ST.status,
                ST.movedBy,
                ST.movedAt,
                SAL.approval_status,
                SAL.approved_by,
                SAL.approved_at,
                SAL.rejected_by,
                SAL.rejected_at,
                SAL.rejection_reason
            FROM {DBSCHEMA}.StageTracking ST
            JOIN {DBSCHEMA}.StageMaster SM
                ON ST.StageId = SM.StageId
            LEFT JOIN {DBSCHEMA}.StageApprovalLog SAL
                ON ST.process_id = SAL.process_id
                AND ST.StageId   = SAL.stage_id
            WHERE ST.process_id = %s
            ORDER BY SM.SequenceOrder ASC
            """,
            (process_id,)
        )

        result = cursor.fetchall()
        if not result:
            return jsonify({"success": False, "message": "No stage tracking found for this process"}), 404

        columns = [col[0] for col in cursor.description]
        stages = [format_datetime_for_json(dict(zip(columns, row))) for row in result]

        return jsonify({"success": True, "process_id": process_id, "stages": stages}), 200

    except Exception as e:
        current_app.logger.error(f"Error in get_stage_tracking: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# ══════════════════════════════════════════════
# READ-ONLY ENDPOINTS  (everyone can view)
# ══════════════════════════════════════════════

@process_stages_bp.route('/api/get-all-processes', methods=['GET'])
@token_required
def get_all_processes():
    user_id, _ = get_user(request)
    conn = cursor = None
    try:
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        cursor = conn.cursor()

        try:
            cursor.execute(f"EXEC {DBSCHEMA}.GetAllProcessSummary @UserId=%s", (user_id,))
        except Exception:
            cursor.execute(f"EXEC {DBSCHEMA}.GetAllProcessSummary")

        result = cursor.fetchall()
        columns = [col[0] for col in cursor.description]
        processes = [format_datetime_for_json(dict(zip(columns, row))) for row in result]

        return jsonify({"success": True, "processes": processes, "count": len(processes)}), 200

    except Exception as e:
        current_app.logger.error(f"Error in get_all_processes: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@process_stages_bp.route('/api/get-process-complete-detail/<int:process_id>', methods=['GET'])
@token_required
def get_process_complete_detail(process_id):
    """Combined API endpoint that returns process detail, business case, and technical assessment in one response"""
    user_id, _ = get_user(request)
    conn = cursor = None
    try:
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        cursor = conn.cursor()

        # Initialize response structure
        response_data = {
            "success": True,
            "process": None,
            "businessCase": {
                "hasData": False,
                "data": None
            },
            "technicalAssessment": {
                "hasData": False,
                "data": None
            }
        }

        # 1. Fetch process detail
        try:
            try:
                cursor.execute(
                    f"EXEC {DBSCHEMA}.GetAllProcessSummary @ProcessId=%s, @UserId=%s",
                    (process_id, user_id)
                )
            except Exception:
                cursor.execute(
                    f"EXEC {DBSCHEMA}.GetAllProcessSummary @ProcessId=%s",
                    (process_id,)
                )

            result = cursor.fetchall()
            if result:
                columns = [col[0] for col in cursor.description]
                process_dict = format_datetime_for_json(dict(zip(columns, result[0])))
                response_data["process"] = process_dict
            else:
                return jsonify({"success": False, "message": "Process not found"}), 404
        except Exception as e:
            current_app.logger.error(f"Error fetching process detail: {str(e)}", exc_info=True)
            return jsonify({"success": False, "message": f"Error fetching process detail: {str(e)}"}), 500

        # 2. Fetch business case
        try:
            cursor.execute(f"EXEC {DBSCHEMA}.GetBusinessCase @ProcessId=%s", (process_id,))
            result = cursor.fetchall()

            if result:
                columns = [col[0] for col in cursor.description]
                data = format_datetime_for_json(dict(zip(columns, result[0])))
                response_data["businessCase"] = {
                    "hasData": True,
                    "data": data
                }
            else:
                response_data["businessCase"] = {
                    "hasData": False,
                    "data": None
                }
        except Exception as e:
            current_app.logger.error(f"Error fetching business case: {str(e)}", exc_info=True)
            # Continue even if business case fails
            response_data["businessCase"] = {
                "hasData": False,
                "data": None
            }

        # 3. Fetch technical assessment
        try:
            cursor.execute(f"EXEC {DBSCHEMA}.GetTechnicalAssessment @ProcessId=%s", (process_id,))
            result = cursor.fetchall()

            if result:
                columns = [col[0] for col in cursor.description]
                data = format_datetime_for_json(dict(zip(columns, result[0])))

                # Exclude ID fields from hasData check
                exclude_keys = {'DA_id', 'TA_id'}
                has_data = any(
                    v is not None
                    for k, v in data.items()
                    if k not in exclude_keys
                )

                response_data["technicalAssessment"] = {
                    "hasData": has_data,
                    "data": data
                }
            else:
                response_data["technicalAssessment"] = {
                    "hasData": False,
                    "data": None
                }

        except Exception as e:
            current_app.logger.error(f"Error fetching technical assessment: {str(e)}", exc_info=True)
            response_data["technicalAssessment"] = {
                "hasData": False,
                "data": None
            }

        return jsonify(response_data), 200

    except Exception as e:
        current_app.logger.error(f"Error in get_process_complete_detail: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()