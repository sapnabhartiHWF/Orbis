from flask import request, jsonify, current_app
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required
from app.center_of_excellence.process_stages import (
    process_stages_bp,
    format_datetime_for_json,
    get_db_schema,
    get_user,
    role_check,
    ROLE_OWNER,
    ROLE_AUTO_ENG,
    ROLE_RPA_LEAD,
)
import os

def get_updated_stage_name(cursor, DBSCHEMA, process_id):
    """
    Find which previous stage was most recently updated by checking UpdatedAt timestamps.
    Checks: Process Registration, Initial Triage, System Integration, To-Be Design.
    
    Args:
        cursor: Database cursor
        DBSCHEMA: Database schema name
        process_id: Process ID to check
    
    Returns:
        str: Name of the most recently updated stage, or None if not found
    """
    try:
        updated_stages = []
        
        # Check Process Registration
        cursor.execute(
            f"SELECT TOP 1 UpdatedAt FROM {DBSCHEMA}.ProcessRegistration "
            "WHERE P_id = %s AND IsDeleted = 0 ORDER BY UpdatedAt DESC",
            (process_id,)
        )
        pr_result = cursor.fetchone()
        if pr_result and pr_result[0]:
            updated_stages.append(("Process Registration", pr_result[0]))
        
        # Check Initial Triage
        cursor.execute(
            f"SELECT TOP 1 UpdatedAt FROM {DBSCHEMA}.InitialTriageStage "
            "WHERE process_id = %s AND IsDeleted = 0 ORDER BY UpdatedAt DESC",
            (process_id,)
        )
        it_result = cursor.fetchone()
        if it_result and it_result[0]:
            updated_stages.append(("Initial Triage", it_result[0]))
        
        # Check System Integration
        cursor.execute(
            f"SELECT TOP 1 UpdatedAt FROM {DBSCHEMA}.SystemIntegration "
            "WHERE process_id = %s AND IsDeleted = 0 ORDER BY UpdatedAt DESC",
            (process_id,)
        )
        si_result = cursor.fetchone()
        if si_result and si_result[0]:
            updated_stages.append(("System Integration", si_result[0]))
        
        # Check To-Be Design
        cursor.execute(
            f"SELECT TOP 1 UpdatedAt FROM {DBSCHEMA}.ToBeDesign "
            "WHERE process_id = %s AND IsDeleted = 0 ORDER BY UpdatedAt DESC",
            (process_id,)
        )
        tbd_result = cursor.fetchone()
        if tbd_result and tbd_result[0]:
            updated_stages.append(("To-Be Design", tbd_result[0]))
        
        # Return the most recently updated stage
        if updated_stages:
            # Sort by UpdatedAt descending and return the first one
            updated_stages.sort(key=lambda x: x[1], reverse=True)
            return updated_stages[0][0]
        
        return None
    except Exception as e:
        pass
        return None

def get_approval_review_notification(stage_name=None):
    """
    Generate notification message for approval stage when previous stages are updated.
    This message is shown to approvers to notify them that data in previous stages has changed.
    
    Args:
        stage_name: Name of the stage that was updated (optional)
    
    Returns:
        str: Notification message
    """
    if stage_name:
        return (
            f"Data has been updated in {stage_name}. Please review the updated data and approve again."
        )
    else:
        return (
            "Data has been updated in previous stages. Please review the updated data and approve again."
        )

@process_stages_bp.route('/api/process-registration/<int:process_id>', methods=['PUT'])
@token_required
def update_process_registration(process_id):
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
            f"EXEC {DBSCHEMA}.UpdateProcessRegistration "
            "@P_id=%s, @Title=%s, @Description=%s, @Priority=%s, "
            "@ExpectedROI=%s, @Stakeholder=%s, @Tag=%s, "
            "@SampledataPath=%s, @MimeType=%s, "
            "@SopDoc=%s, @SopMimetype=%s, "
            "@Department=%s, @LoggedInUserId=%s",
            (
                process_id,
                data.get("Title"), data.get("Description"), data.get("Priority"),
                data.get("ExpectedROI"), data.get("Stakeholder"), data.get("Tag"),
                data.get("SampledataPath"), data.get("MimeType"),
                data.get("SopDoc"), data.get("SopMimetype"),
                data.get("Department"), user_id
            )
        )
        result = cursor.fetchall()
        conn.commit()

        row = {}
        if result and cursor.description:
            columns = [col[0] for col in cursor.description]
            row = format_datetime_for_json(dict(zip(columns, result[0])))

        return jsonify({
            "success": True,
            "message": "Process registration updated successfully.",
            "data": row
        }), 200

    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@process_stages_bp.route('/api/initial-triage/<int:process_id>', methods=['PUT'])
@token_required
def update_initial_triage(process_id):
    user_id, role = get_user(request)

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
            "@ProcessId=%s, @UpdatedBy=%s, "
            "@IsRuleBased=%s, @IsStable=%s, @AreExceptionsManageable=%s, "
            "@ComplianceRisk=%s, @ComplianceRiskSummary=%s, "
            "@SystemsInvolved=%s, @Blockers=%s, "
            "@EstimatedAutomationPercent=%s, "
            "@AnalysisDesignDuration=%s, @DevelopmentDuration=%s, "
            "@TestingDuration=%s, @DeploymentDuration=%s, "
            "@TrainingGoLiveDuration=%s",
            (
                process_id,
                user_id,
                data.get("IsRuleBased"),
                data.get("IsStable"),
                data.get("AreExceptionsManageable"),
                data.get("ComplianceRisk"),
                data.get("ComplianceRiskSummary"),
                data.get("SystemsInvolved"),
                data.get("Blockers"),
                data.get("EstimatedAutomationPercent"),
                data.get("AnalysisDesignDuration"),
                data.get("DevelopmentDuration"),
                data.get("TestingDuration"),
                data.get("DeploymentDuration"),
                data.get("TrainingGoLiveDuration"),
            )
        )

        result = cursor.fetchall()
        conn.commit()

        message = "Initial Triage updated successfully."
        if result and cursor.description:
            columns = [col[0] for col in cursor.description]
            row = dict(zip(columns, result[0]))
            message = row.get("Message", message)

        return jsonify({"success": True, "message": message}), 200

    except Exception as e:
        if conn: conn.rollback()
        current_app.logger.error(f"Error in update_initial_triage: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@process_stages_bp.route('/api/detailed-analysis/<int:process_id>', methods=['PUT'])
@token_required
def update_detailed_analysis(process_id):
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
            f"EXEC {DBSCHEMA}.UpdateDetailedAnalysis "
            "@ProcessId=%s, @PddPath=%s, @MimeType=%s, @LoggedInUserId=%s",
            (process_id, data.get("PddPath"), data.get("MimeType"), user_id)
        )
        conn.commit()
        return jsonify({
            "success": True,
            "message": "Detailed Analysis resubmitted. Awaiting approval."
        }), 200

    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@process_stages_bp.route('/api/business-case/<int:process_id>', methods=['PUT'])
@token_required
def update_business_case(process_id):
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
            f"EXEC {DBSCHEMA}.UpdateBusinessCase "
            "@ProcessId=%s, "
            "@AnnualProcessCost=%s, @WeeklyHoursSpent=%s, @PeopleInvolved=%s, "
            "@ImplementationCost=%s, @EfficiencyGainPercent=%s, @ErrorReductionPercent=%s, "
            "@LoggedInUserId=%s",
            (
                process_id,
                data.get("AnnualProcessCost"),
                data.get("WeeklyHoursSpent"),
                data.get("PeopleInvolved"),
                data.get("ImplementationCost"),
                data.get("EfficiencyGainPercent"),
                data.get("ErrorReductionPercent"),
                user_id
            )
        )
        row = cursor.fetchone()
        conn.commit()

        calculated = {}
        if row and cursor.description:
            columns = [col[0] for col in cursor.description]
            calculated = dict(zip(columns, row))

        return jsonify({
            "success": True,
            "message": "Business Case resubmitted. Awaiting approval.",
            "data": calculated
        }), 200

    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@process_stages_bp.route('/api/stage/handover/<int:process_id>', methods=['PUT'])
@token_required
def update_handover_stage(process_id):
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
            f"""EXEC {DBSCHEMA}.UpdateHandoverStage
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
            "message": row.pop("StatusMessage", "Handover resubmitted. Awaiting approval."),
            "data": {"processId": process_id}
        }), 200

    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()