from flask import Blueprint, request, jsonify, current_app
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required
from app.utils.db_schema import get_db_schema
from app.center_of_excellence.process_stages import process_stages_bp, format_datetime_for_json


@process_stages_bp.route('/api/stage/approve', methods=['POST'])
@token_required
def approve_stage():
    """
    Approve a process stage and move it forward.
    Calls ICAT.sp_ApproveStage stored procedure.
    """
    user_id = request.user.get("UserId")
    conn = None
    cursor = None

    try:
        DBSCHEMA = get_db_schema()
        data = request.get_json()

        # Validate required fields
        if not data:
            return jsonify({"success": False, "message": "Request body is required"}), 400
        
        process_id = data.get("ProcessId")
        stage_id = data.get("StageId")

        if process_id is None:
            return jsonify({"success": False, "message": "ProcessId is required"}), 400
        
        if stage_id is None:
            return jsonify({"success": False, "message": "StageId is required"}), 400

        conn = connect_to_database()
        cursor = conn.cursor()

        cursor.execute(
            f"EXEC {DBSCHEMA}.ApproveStage "
            "@ProcessId=%s, @StageId=%s, @ApprovedBy=%s",
            (
                process_id,
                stage_id,
                user_id
            )
        )

        # Check if stored procedure returned a resultset
        result = None
        try:
            if cursor.description:
                result = cursor.fetchall()
        except Exception as fetch_error:
            # No resultset returned, which is fine for some stored procedures
            current_app.logger.debug(f"No resultset from ApproveStage: {fetch_error}")
            result = None

        conn.commit()

        # Check if stored procedure returned any error messages
        if result:
            # Check for error messages in the result
            error_message = None
            for row in result:
                if isinstance(row, (list, tuple)) and len(row) > 0:
                    msg = str(row[0]) if row[0] else None
                    if msg and ("error" in msg.lower() or "failed" in msg.lower() or "denied" in msg.lower()):
                        error_message = msg
                        break
            
            if error_message:
                return jsonify({
                    "success": False,
                    "message": error_message
                }), 400

        return jsonify({
            "success": True,
            "message": "Stage approved and moved forward."
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()
        error_message = str(e)
        current_app.logger.error(f"Error approving stage: {error_message}", exc_info=True)
        
        # Check for specific error types
        if "not in Pending status" in error_message or "Cannot approve" in error_message:
            return jsonify({
                "success": False,
                "message": "Stage is not in Pending status. Cannot approve."
            }), 400
        elif "Access Denied" in error_message or "denied" in error_message.lower():
            return jsonify({
                "success": False,
                "message": "Access Denied: You do not have permission to approve this stage."
            }), 403
        
        return jsonify({
            "success": False,
            "message": error_message
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@process_stages_bp.route('/api/stage/reject', methods=['POST'])
@token_required
def reject_stage():
    """
    Reject a process stage with a rejection reason.
    Calls ICAT.sp_RejectStage stored procedure.
    """
    user_id = request.user.get("UserId")
    conn = None
    cursor = None

    try:
        DBSCHEMA = get_db_schema()
        data = request.get_json()

        # Validate required fields
        if not data:
            return jsonify({"success": False, "message": "Request body is required"}), 400
        
        process_id = data.get("ProcessId")
        stage_id = data.get("StageId")
        rejection_reason = data.get("RejectionReason")

        if process_id is None:
            return jsonify({"success": False, "message": "ProcessId is required"}), 400
        
        if stage_id is None:
            return jsonify({"success": False, "message": "StageId is required"}), 400

        conn = connect_to_database()
        cursor = conn.cursor()

        cursor.execute(
            f"EXEC {DBSCHEMA}.RejectStage "
            "@ProcessId=%s, @StageId=%s, "
            "@RejectedBy=%s, @RejectionReason=%s",
            (
                process_id,
                stage_id,
                user_id,
                rejection_reason if rejection_reason else None
            )
        )

        # Check if stored procedure returned a resultset
        result = None
        try:
            if cursor.description:
                result = cursor.fetchall()
        except Exception as fetch_error:
            # No resultset returned, which is fine for some stored procedures
            current_app.logger.debug(f"No resultset from RejectStage: {fetch_error}")
            result = None

        conn.commit()

        # Check if stored procedure returned any error messages
        if result:
            # Check for error messages in the result
            error_message = None
            for row in result:
                if isinstance(row, (list, tuple)) and len(row) > 0:
                    msg = str(row[0]) if row[0] else None
                    if msg and ("error" in msg.lower() or "failed" in msg.lower() or "denied" in msg.lower()):
                        error_message = msg
                        break
            
            if error_message:
                return jsonify({
                    "success": False,
                    "message": error_message
                }), 400

        return jsonify({
            "success": True,
            "message": "Stage rejected."
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()
        error_message = str(e)
        current_app.logger.error(f"Error rejecting stage: {error_message}", exc_info=True)
        
        # Check for specific error types
        if "not in Pending status" in error_message or "Cannot reject" in error_message:
            return jsonify({
                "success": False,
                "message": "Stage is not in Pending status. Cannot reject."
            }), 400
        elif "Access Denied" in error_message or "denied" in error_message.lower():
            return jsonify({
                "success": False,
                "message": "Access Denied: You do not have permission to reject this stage."
            }), 403
        
        return jsonify({
            "success": False,
            "message": error_message
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@process_stages_bp.route('/api/get-current-stage/<int:process_id>', methods=['GET'])
@token_required
def get_current_stage(current_user, process_id):
    """Get current stage of a process"""
    conn = None
    cursor = None
    
    try:
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        cursor.execute(
            f"EXEC {DBSCHEMA}.GetCurrentStage @ProcessId = ?",
            (process_id,)
        )
        
        result = cursor.fetchone()
        
        if not result:
            return jsonify({"success": False, "message": "Process not found"}), 404
        
        columns = [column[0] for column in cursor.description]
        current_stage = dict(zip(columns, result))
        current_stage = format_datetime_for_json(current_stage)
        
        return jsonify({
            "success": True,
            "currentStage": current_stage
        }), 200
            
    except Exception as e:
        current_app.logger.error(f"Error in get_current_stage: {str(e)}")
        return jsonify({"success": False, "message": "An error occurred"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@process_stages_bp.route('/api/get-stage-timeline/<int:process_id>', methods=['GET'])
@token_required
def get_stage_timeline(current_user, process_id):
    """Get complete stage history timeline"""
    conn = None
    cursor = None
    
    try:
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        cursor.execute(
            f"EXEC {DBSCHEMA}.GetStageTimeline @ProcessId = ?",
            (process_id,)
        )
        
        timeline_result = cursor.fetchall()
        columns = [column[0] for column in cursor.description]
        
        timeline = []
        for row in timeline_result:
            stage_dict = dict(zip(columns, row))
            stage_dict = format_datetime_for_json(stage_dict)
            timeline.append(stage_dict)
        
        return jsonify({
            "success": True,
            "timeline": timeline,
            "totalStages": len(timeline)
        }), 200
            
    except Exception as e:
        current_app.logger.error(f"Error in get_stage_timeline: {str(e)}")
        return jsonify({"success": False, "message": "An error occurred"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@process_stages_bp.route('/api/get-pending-approvals', methods=['GET'])
@token_required
def get_pending_approvals():
    """Get all processes pending approval"""
    conn = None
    cursor = None
    
    try:
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            current_app.logger.error("Database connection failed")
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        cursor.execute(f"EXEC {DBSCHEMA}.GetPendingApprovals")
        
        approvals_result = cursor.fetchall()
        
        # Check if we have results
        if not approvals_result:
            return jsonify({
                "success": True,
                "approvals": [],
                "count": 0
            }), 200
        
        columns = [column[0] for column in cursor.description]
        
        approvals = []
        for row in approvals_result:
            approval_dict = dict(zip(columns, row))
            
            # Format datetime fields
            approval_dict = format_datetime_for_json(approval_dict)
            
            # Ensure numeric fields are properly typed
            if 'process_id' in approval_dict and approval_dict['process_id'] is not None:
                approval_dict['process_id'] = int(approval_dict['process_id'])
            
            if 'ExpectedROI' in approval_dict and approval_dict['ExpectedROI'] is not None:
                approval_dict['ExpectedROI'] = float(approval_dict['ExpectedROI'])
            
            if 'SequenceOrder' in approval_dict and approval_dict['SequenceOrder'] is not None:
                approval_dict['SequenceOrder'] = int(approval_dict['SequenceOrder'])
            
            approvals.append(approval_dict)
        
        return jsonify({
            "success": True,
            "approvals": approvals,
            "count": len(approvals)
        }), 200
            
    except Exception as e:
        current_app.logger.error(f"Error in get_pending_approvals: {str(e)}", exc_info=True)
        return jsonify({
            "success": False, 
            "message": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@process_stages_bp.route('/api/stages', methods=['GET'])
@token_required
def get_all_stages():
    """Get all stages from StageMaster table - SIMPLE VERSION"""
    conn = None
    cursor = None
    
    try:
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Query ONLY what exists in your table
        query = f"""
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
        
        cursor.execute(query)
        rows = cursor.fetchall()
        
        stages = []
        for row in rows:
            stages.append({
                'stageId': row[0],
                'stageName': row[1],
                'sequenceOrder': row[2],
                'nextStageId': row[3],
                'requiresApproval': bool(row[4]) if row[4] is not None else False,
                'isActive': bool(row[5])
            })
        
        return jsonify({
            'success': True,
            'stages': stages
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching stages: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'Failed to fetch stages: {str(e)}'
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
