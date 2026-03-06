from flask import request, jsonify, current_app
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required
from app.utils.db_schema import get_db_schema
from app.center_of_excellence.process_stages import (
    process_stages_bp,
    get_user,
    role_check,
    ROLE_RPA_LEAD,
    ROLE_OWNER,
)

# ══════════════════════════════════════════════
# UPDATE PROCESS REGISTRATION (Owner only - after rejection)
# ══════════════════════════════════════════════

@process_stages_bp.route('/api/process-registration/resubmit', methods=['POST'])
@token_required
def update_process_registration_resubmit():
    user_id, role = get_user(request)
    denied = role_check(role, [ROLE_OWNER])
    if denied: return denied

    conn = cursor = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Request body is required"}), 400

        process_id = data.get("ProcessId") or data.get("processId")
        title = data.get("Title")

        if not process_id:
            return jsonify({"success": False, "message": "ProcessId is required"}), 400
        if not title:
            return jsonify({"success": False, "message": "Title is required"}), 400

        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        cursor = conn.cursor()

        cursor.execute(
            f"EXEC {DBSCHEMA}.UpdateProcessRegistration "
            "@ProcessId=%s, @ResubmittedBy=%s, @Title=%s, @Description=%s, "
            "@Priority=%s, @ExpectedROI=%s, @Stakeholder=%s, @Tag=%s, "
            "@SampledataPath=%s, @MimeType=%s, @SopDoc=%s, @SopMimetype=%s, @Department=%s",
            (
                process_id, user_id,
                title,
                data.get("Description"),
                data.get("Priority"),
                data.get("ExpectedROI"),
                data.get("Stakeholder"),
                data.get("Tag"),
                data.get("SampledataPath"),
                data.get("MimeType"),
                data.get("SopDoc"),
                data.get("SopMimetype"),
                data.get("Department"),
            )
        )
        result = cursor.fetchall()
        conn.commit()

        message = "Process updated successfully. Lead can now re-review."
        if result and cursor.description:
            columns = [col[0] for col in cursor.description]
            row = dict(zip(columns, result[0]))
            message = row.get("Message", message)

        return jsonify({"success": True, "message": message}), 200

    except Exception as e:
        if conn: conn.rollback()
        current_app.logger.error(f"Error in update_process_registration_resubmit: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# ══════════════════════════════════════════════
# UPDATE INITIAL TRIAGE (Automation Lead only - after owner resubmit)
# ══════════════════════════════════════════════

@process_stages_bp.route('/api/initial-triage/resubmit/<int:process_id>', methods=['PUT'])
@token_required
def update_initial_triage_resubmit(process_id):
    user_id, role = get_user(request)
    denied = role_check(role, [ROLE_RPA_LEAD])
    if denied: return denied

    conn = cursor = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Request body is required"}), 400

        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        cursor = conn.cursor()

        cursor.execute(
            f"EXEC {DBSCHEMA}.UpdateInitialTriageStage "
            "@ProcessId=%s, @IsRuleBased=%s, @IsStable=%s, "
            "@SystemsInvolved=%s, @Blockers=%s, "
            "@EstimatedAutomationPercent=%s, @ExceptionsManageable=%s, "
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
        result = cursor.fetchall()
        conn.commit()

        return jsonify({
            "success": True,
            "message": "Initial Triage updated. Ready for approval."
        }), 200

    except Exception as e:
        if conn: conn.rollback()
        current_app.logger.error(f"Error in update_initial_triage_resubmit: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()