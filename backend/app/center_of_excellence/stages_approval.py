from flask import Blueprint, request, jsonify, current_app
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required
from app.utils.db_schema import get_db_schema
from app.center_of_excellence.process_stages import (
    process_stages_bp, 
    format_datetime_for_json,
    get_user,
    role_check,
    get_role_id,
    ROLE_RPA_LEAD,
    ROLE_OWNER
)

# ══════════════════════════════════════════════
# APPROVAL ENDPOINTS  (RPA Lead only)
# ══════════════════════════════════════════════

@process_stages_bp.route('/api/stage/approve', methods=['POST'])
@token_required
def approve_stage():
    user_id, role = get_user(request)

    if role not in [ROLE_RPA_LEAD, ROLE_OWNER]:
        return jsonify({"success": False, "message": "Access Denied"}), 403

    conn = cursor = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Request body is required"}), 400

        process_id = data.get("ProcessId") or data.get("processId")
        stage_id   = data.get("StageId")   or data.get("stageId")

        if not process_id or not stage_id:
            return jsonify({"success": False, "message": "ProcessId and StageId are required"}), 400

        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        cursor = conn.cursor()

        # ── Validate: check this stage's ApproverRoleId and process ownership ──
        cursor.execute(
            f"""
            SELECT SM.ApproverRoleId, PR.CreatedBy
            FROM {DBSCHEMA}.StageMaster SM
            CROSS JOIN {DBSCHEMA}.ProcessRegistration PR
            WHERE SM.StageId = %s
              AND PR.P_id    = %s
              AND PR.IsDeleted = 0
            """,
            (stage_id, process_id)
        )
        validation = cursor.fetchone()

        if not validation:
            return jsonify({"success": False, "message": "Stage or process not found"}), 404

        approver_role_id, created_by = validation[0], validation[1]
        role_id = get_role_id(role)

        # RPA Lead can only approve stages designated for RoleId 14
        if role == ROLE_RPA_LEAD and approver_role_id != 14:
            return jsonify({
                "success": False,
                "message": "Access Denied: This stage is not approved by Automation Lead."
            }), 403

        # Owner can only approve stages designated for RoleId 15
        # AND only for processes they created
        if role == ROLE_OWNER:
            if approver_role_id != 15:
                return jsonify({
                    "success": False,
                    "message": "Access Denied: This stage is not approved by Owner."
                }), 403
            if created_by != user_id:
                return jsonify({
                    "success": False,
                    "message": "Access Denied: You can only approve your own processes."
                }), 403

        # ── All checks passed — execute approval ──
        cursor.execute(
            f"EXEC {DBSCHEMA}.ApproveStage @ProcessId=%s, @StageId=%s, @ApprovedBy=%s",
            (process_id, stage_id, user_id)
        )
        result = cursor.fetchall()
        conn.commit()

        if not result:
            return jsonify({"success": True, "message": "Stage approved successfully."}), 200

        columns = [col[0] for col in cursor.description]
        row = format_datetime_for_json(dict(zip(columns, result[0])))
        return jsonify({
            "success": True,
            "message": row.pop("StatusMessage", "Stage approved successfully."),
            "data": row
        }), 200

    except Exception as e:
        if conn: conn.rollback()
        current_app.logger.error(f"Error in approve_stage: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@process_stages_bp.route('/api/stage/reject', methods=['POST'])
@token_required
def reject_stage():
    user_id, role = get_user(request)

    if role not in [ROLE_RPA_LEAD, ROLE_OWNER]:
        return jsonify({"success": False, "message": "Access Denied"}), 403

    conn = cursor = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Request body is required"}), 400

        process_id       = data.get("ProcessId")       or data.get("processId")
        stage_id         = data.get("StageId")         or data.get("stageId")
        rejection_reason = data.get("RejectionReason") or data.get("rejectionReason", "")

        if not process_id or not stage_id:
            return jsonify({"success": False, "message": "ProcessId and StageId are required"}), 400
        if not rejection_reason or not rejection_reason.strip():
            return jsonify({"success": False, "message": "RejectionReason is required"}), 400

        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        cursor = conn.cursor()

        # ── Same validation as approve ──
        cursor.execute(
            f"""
            SELECT SM.ApproverRoleId, PR.CreatedBy
            FROM {DBSCHEMA}.StageMaster SM
            CROSS JOIN {DBSCHEMA}.ProcessRegistration PR
            WHERE SM.StageId = %s
              AND PR.P_id    = %s
              AND PR.IsDeleted = 0
            """,
            (stage_id, process_id)
        )
        validation = cursor.fetchone()

        if not validation:
            return jsonify({"success": False, "message": "Stage or process not found"}), 404

        approver_role_id, created_by = validation[0], validation[1]

        if role == ROLE_RPA_LEAD and approver_role_id != 14:
            return jsonify({
                "success": False,
                "message": "Access Denied: This stage is not rejected by Automation Lead."
            }), 403

        if role == ROLE_OWNER:
            if approver_role_id != 15:
                return jsonify({
                    "success": False,
                    "message": "Access Denied: This stage is not rejected by Owner."
                }), 403
            if created_by != user_id:
                return jsonify({
                    "success": False,
                    "message": "Access Denied: You can only reject your own processes."
                }), 403

        # ── All checks passed — execute rejection ──
        cursor.execute(
            f"EXEC {DBSCHEMA}.RejectStage "
            "@ProcessId=%s, @StageId=%s, @RejectedBy=%s, @Reason=%s",
            (process_id, stage_id, user_id, rejection_reason.strip())
        )
        result = cursor.fetchall()
        conn.commit()

        if not result:
            return jsonify({"success": True, "message": "Stage rejected. Submitter can now revise and resubmit."}), 200

        columns = [col[0] for col in cursor.description]
        row = format_datetime_for_json(dict(zip(columns, result[0])))
        return jsonify({
            "success": True,
            "message": row.pop("StatusMessage", "Stage rejected successfully."),
            "data": row
        }), 200

    except Exception as e:
        if conn: conn.rollback()
        current_app.logger.error(f"Error in reject_stage: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@process_stages_bp.route('/api/initial-triage/reject', methods=['POST'])
@token_required
def reject_initial_triage():
    user_id, role = get_user(request)

    if role not in [ROLE_RPA_LEAD, ROLE_OWNER]:
        return jsonify({"success": False, "message": "Access Denied"}), 403

    conn = cursor = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Request body is required"}), 400

        process_id = data.get("ProcessId") or data.get("processId")
        rejection_reason = data.get("RejectionReason") or data.get("rejectionReason", "")

        if not process_id:
            return jsonify({"success": False, "message": "ProcessId is required"}), 400

        if not rejection_reason or not rejection_reason.strip():
            return jsonify({"success": False, "message": "RejectionReason is required"}), 400

        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500

        cursor = conn.cursor()

        # Validate process exists and not deleted
        cursor.execute(
            f"""
            SELECT P_id
            FROM {DBSCHEMA}.ProcessRegistration
            WHERE P_id = %s AND IsDeleted = 0
            """,
            (process_id,)
        )
        if not cursor.fetchone():
            return jsonify({"success": False, "message": "Process not found"}), 404

        # Call SP
        cursor.execute(
            f"EXEC {DBSCHEMA}.RejectInitialTriage "
            "@ProcessId=%s, @RejectedBy=%s, @RejectionReason=%s",
            (process_id, user_id, rejection_reason.strip())
        )

        result = cursor.fetchall()
        conn.commit()

        message = "Process rejected at Initial Triage."
        if result and cursor.description:
            columns = [col[0] for col in cursor.description]
            row = dict(zip(columns, result[0]))
            message = row.get("Message", message)

        return jsonify({
            "success": True,
            "message": message
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()
        current_app.logger.error(f"Error in reject_initial_triage: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# ══════════════════════════════════════════════
# READ-ONLY ENDPOINTS
# ══════════════════════════════════════════════

@process_stages_bp.route('/api/get-current-stage/<int:process_id>', methods=['GET'])
@token_required
def get_current_stage(process_id):  # ✅ removed erroneous `current_user` arg
    """Get current stage of a process."""
    conn = None
    cursor = None

    try:
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500

        cursor = conn.cursor()
        cursor.execute(
            f"EXEC {DBSCHEMA}.GetCurrentStage @ProcessId=%s",
            (process_id,)
        )

        result = cursor.fetchone()

        if not result:
            return jsonify({"success": False, "message": "Process not found"}), 404

        columns = [column[0] for column in cursor.description]
        current_stage = format_datetime_for_json(dict(zip(columns, result)))

        return jsonify({"success": True, "currentStage": current_stage}), 200

    except Exception as e:
        current_app.logger.error(f"Error in get_current_stage: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@process_stages_bp.route('/api/get-stage-timeline/<int:process_id>', methods=['GET'])
@token_required
def get_stage_timeline(process_id):  # ✅ removed erroneous `current_user` arg
    """Get complete stage history timeline."""
    conn = None
    cursor = None

    try:
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500

        cursor = conn.cursor()
        cursor.execute(
            f"EXEC {DBSCHEMA}.GetStageTimeline @ProcessId=%s",
            (process_id,)
        )

        timeline_result = cursor.fetchall()
        columns = [column[0] for column in cursor.description]
        timeline = [format_datetime_for_json(dict(zip(columns, row))) for row in timeline_result]

        return jsonify({
            "success": True,
            "timeline": timeline,
            "totalStages": len(timeline)
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error in get_stage_timeline: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@process_stages_bp.route('/api/get-pending-approvals', methods=['GET'])
@token_required
def get_pending_approvals():
    user_id, role = get_user(request)

    # Only RPA Lead and Owner can see approvals
    if role not in [ROLE_RPA_LEAD, ROLE_OWNER]:
        return jsonify({"success": False, "message": "Access Denied"}), 403

    role_id = get_role_id(role)

    conn = cursor = None
    try:
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        cursor = conn.cursor()

        cursor.execute(
            f"EXEC {DBSCHEMA}.GetPendingApprovals @LoggedInUserId=%s, @RoleId=%s",
            (user_id, role_id)
        )
        result = cursor.fetchall()
        columns = [col[0] for col in cursor.description]
        approvals = [format_datetime_for_json(dict(zip(columns, row))) for row in result]

        return jsonify({
            "success": True,
            "count": len(approvals),
            "approvals": approvals
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error in get_pending_approvals: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@process_stages_bp.route('/api/stages', methods=['GET'])
@token_required
def get_all_stages():
    """Get all active stages from StageMaster."""
    conn = None
    cursor = None

    try:
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500

        cursor = conn.cursor()
        cursor.execute(
            f"""
            SELECT
                StageId,
                StageName,
                SequenceOrder,
                NextStageId,
                IsApprovalRequired,
                IsActive
            FROM {DBSCHEMA}.StageMaster
            WHERE IsActive = 1
            ORDER BY SequenceOrder
            """
        )

        rows = cursor.fetchall()
        stages = [
            {
                'stageId':          row[0],
                'stageName':        row[1],
                'sequenceOrder':    row[2],
                'nextStageId':      row[3],
                'requiresApproval': bool(row[4]) if row[4] is not None else False,
                'isActive':         bool(row[5])
            }
            for row in rows
        ]

        return jsonify({'success': True, 'stages': stages}), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching stages: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'message': f'Failed to fetch stages: {str(e)}'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()