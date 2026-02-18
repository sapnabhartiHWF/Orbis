from flask import Blueprint, request, jsonify, current_app
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required
from app.file_management.ftp_utils import get_ftp_manager
from app.utils.db_schema import get_db_schema  # ✅ Import common utility
from datetime import datetime, timezone
import os
from werkzeug.utils import secure_filename
import concurrent.futures
import threading

process_stages_bp = Blueprint('process_stages_bp', __name__)

def format_datetime_for_json(obj):
    """
    Recursively convert datetime objects to ISO format strings with UTC timezone.
    This ensures consistent date/time handling across timezones.
    SQL Server GETDATE() returns server local time, but we'll format as UTC for consistency.
    """
    if isinstance(obj, dict):
        return {key: format_datetime_for_json(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [format_datetime_for_json(item) for item in obj]
    elif isinstance(obj, datetime):
        # Convert datetime to ISO format string
        # If datetime has no timezone info, assume it's UTC (from SQL Server GETDATE())
        if obj.tzinfo is None:
            # SQL Server GETDATE() returns server local time, but we'll treat as UTC
            # Format as ISO string with Z suffix to indicate UTC
            return obj.isoformat() + 'Z'
        else:
            # Convert to UTC and format
            return obj.astimezone(timezone.utc).isoformat().replace('+00:00', 'Z')
    else:
        return obj


@process_stages_bp.route('/api/process-registration/upload-file', methods=['POST'])
@token_required
def upload_process_registration_file():
    """
    Upload a file for process registration (SampleData or SOP Document).
    Supports both multipart/form-data and JSON with file type specification.
    Saves file to uploads/process_registration/ folder.
    """
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "No file provided"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "message": "No file selected"}), 400
    
    # Get file type from form data (optional - helps identify file purpose)
    file_type = request.form.get('fileType', '').strip().lower()  # 'sampledata' or 'sopdoc'
    
    try:
        # Create process_registration folder if it doesn't exist
        UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
        PROCESS_REGISTRATION_FOLDER = os.path.join(UPLOAD_FOLDER, "process_registration")
        os.makedirs(PROCESS_REGISTRATION_FOLDER, exist_ok=True)
        
        # Secure the filename and save
        filename = secure_filename(file.filename)
        # Add timestamp to avoid filename conflicts
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        name, ext = os.path.splitext(filename)
        unique_filename = f"{name}_{timestamp}{ext}"
        
        file_path = os.path.join(PROCESS_REGISTRATION_FOLDER, unique_filename)
        
        # Ensure file stream is at the beginning
        file.seek(0)
        
        # Save file
        file.save(file_path)
        
        # Verify file was saved
        if not os.path.exists(file_path):
            return jsonify({"success": False, "message": "File save failed - file does not exist after save"}), 500
        
        # Get file size and verify it's not empty
        file_size = os.path.getsize(file_path)
        if file_size == 0:
            # Try to remove the empty file
            try:
                os.remove(file_path)
            except:
                pass
            return jsonify({"success": False, "message": "File upload failed - uploaded file is empty (0 bytes). Please check the file and try again."}), 400
        
        mime_type = file.content_type or 'application/octet-stream'
        
        # Return relative path (process_registration/filename) for database storage
        relative_path = os.path.join("process_registration", unique_filename).replace('\\', '/')
        
        # Upload to FTP if configured
        DBSCHEMA = get_db_schema()
        ftp_manager = get_ftp_manager(DBSCHEMA)
        ftp_upload_success = False
        if ftp_manager:
            try:
                ftp_upload_success, ftp_msg = ftp_manager.upload_file(
                    local_file_path=file_path,
                    remote_directory="/process_registration",
                    remote_filename=unique_filename
                )
                if not ftp_upload_success:
                    current_app.logger.warning(f"FTP upload failed for {unique_filename}: {ftp_msg}")
            except Exception as ftp_error:
                current_app.logger.error(f"FTP upload error for {unique_filename}: {str(ftp_error)}")
                # Don't fail the upload if FTP fails - local file is saved
        
        return jsonify({
            "success": True,
            "filename": unique_filename,
            "filePath": relative_path,
            "mimeType": mime_type,
            "fileSize": file_size,
            "fileType": file_type if file_type else None
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"File upload error: {str(e)}")
        return jsonify({"success": False, "message": f"File upload failed: {str(e)}"}), 500

@process_stages_bp.route('/api/process-registration', methods=['POST'])
@token_required
def insert_process_registration():
    user_id = request.user.get("UserId")
    conn = None
    cursor = None

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
                data.get("Title"),
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
                user_id
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


@process_stages_bp.route('/api/initial-triage', methods=['POST'])
@token_required
def insert_initial_triage():
    user_id = request.user.get("UserId")
    conn = None
    cursor = None

    try:
        DBSCHEMA = get_db_schema()
        data = request.get_json()

        conn = connect_to_database()
        cursor = conn.cursor()

        cursor.execute(
            f"EXEC {DBSCHEMA}.InsertInitialTriage "
            "@ProcessId=%s, @IsRuleBased=%s, @IsStable=%s, "
            "@SystemsInvolved=%s, @Blockers=%s, "
            "@EstimatedAutomationPercent=%s, "
            "@ExceptionsManageable=%s, "
            "@ComplianceRisk=%s, @ComplianceRiskSummary=%s, "
            "@LoggedInUserId=%s",
            (
                data.get("ProcessId"),
                data.get("IsRuleBased"),
                data.get("IsStable"),
                data.get("SystemsInvolved"),
                data.get("Blockers"),
                data.get("EstimatedAutomationPercent"),
                data.get("AreExceptionsManageable"),
                data.get("ComplianceRisk"),
                data.get("ComplianceRiskSummary"),
                user_id
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

@process_stages_bp.route('/api/detailed-analysis', methods=['POST'])
@token_required
def insert_detailed_analysis():
    user_id = request.user.get("UserId")
    conn = None
    cursor = None

    try:
        DBSCHEMA = get_db_schema()
        data = request.get_json()

        conn = connect_to_database()
        cursor = conn.cursor()

        cursor.execute(
            f"EXEC {DBSCHEMA}.InsertDetailedAnalysis "
            "@ProcessId=%s, @PddPath=%s, @MimeType=%s, @LoggedInUserId=%s",
            (
                data.get("ProcessId"),
                data.get("PddPath"),
                data.get("MimeType"),
                user_id
            )
        )

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Detailed Analysis submitted. Awaiting approval."
        }), 200

    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@process_stages_bp.route('/api/technical-assessment', methods=['POST'])
@token_required
def insert_technical_assessment():
    user_id = request.user.get("UserId")
    conn = None
    cursor = None

    try:
        DBSCHEMA = get_db_schema()
        data = request.get_json()

        conn = connect_to_database()
        cursor = conn.cursor()

        cursor.execute(
            f"EXEC {DBSCHEMA}.InsertTechnicalAssessment "
            "@ProcessId=%s, "
            "@InfrastructureReady=%s, "
            "@BotHostingType=%s, "
            "@CredentialVaultRequired=%s, "
            "@ExternalSystemDependencies=%s, "
            "@LicensingImpact=%s, "
            "@RiskLevel=%s, "
            "@TechnicalComments=%s, "
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
                user_id
            )
        )

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Technical Assessment submitted successfully. Awaiting approval."
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@process_stages_bp.route('/api/business-case', methods=['POST'])
@token_required
def insert_business_case():
    user_id = request.user.get("UserId")
    conn = None
    cursor = None

    try:
        DBSCHEMA = get_db_schema()
        data = request.get_json()

        conn = connect_to_database()
        cursor = conn.cursor()

        cursor.execute(
            f"EXEC {DBSCHEMA}.InsertBusinessCase "
            "@ProcessId=%s, @FteSavings=%s, @CostSavings=%s, "
            "@ImplementationCost=%s, @PaybackMonths=%s, "
            "@RoiPercent=%s, @LoggedInUserId=%s",
            (
                data.get("ProcessId"),
                data.get("FteSavings"),
                data.get("CostSavings"),
                data.get("ImplementationCost"),
                data.get("PaybackMonths"),
                data.get("RoiPercent"),
                user_id
            )
        )

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Business Case submitted. Awaiting approval."
        }), 200

    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()



# @process_stages_bp.route('/api/uat-stage', methods=['POST'])
# @token_required
# def insert_uat_stage():
#     user_id = request.user.get("UserId")
#     # user_name = request.user.get("UserName")
#     """
#     Track User Acceptance Testing (HWF) stage status.
#     Calls ICAT.InsertUATStage stored procedure.
#     """
#     conn = None
#     cursor = None
    
#     try:
#         DBSCHEMA = get_db_schema()
#         data = request.get_json()
        
#         # Extract parameters
#         process_id = data.get('ProcessId')
        
#         # Validate required fields
#         if process_id is None:
#             return jsonify({"success": False, "message": "ProcessId is required"}), 400
        
#         conn = connect_to_database()
#         cursor = conn.cursor()
        
#         # Execute stored procedure
#         cursor.execute(
#             f"EXEC {DBSCHEMA}.InsertUATStage "
#             "@ProcessId = %s, @LoggedInUserId = %s",
#             (process_id, user_id)
#         )
        
#         result = cursor.fetchall()
#         conn.commit()
        
#         # Get message from stored procedure result
#         if result:
#             message = result[0][0] if result[0] else 'Process is now in the User Acceptance Testing (HWF) phase.'
#             return jsonify({"success": True, "message": message}), 200
#         else:
#             return jsonify({"success": True, "message": "Process is now in the User Acceptance Testing (HWF) phase."}), 200
            
#     except Exception as e:
#         if conn:
#             conn.rollback()
#         print(f"Error tracking UAT stage: {e}")
#         return jsonify({"success": False, "message": str(e)}), 500
#     finally:
#         if cursor:
#             cursor.close()
#         if conn:
#             conn.close()


# @process_stages_bp.route('/api/go-live-stage', methods=['POST'])
# @token_required
# def insert_go_live_stage():
#     user_id = request.user.get("UserId")
#     # user_name = request.user.get("UserName")
#     """
#     Track Go-Live & Deployment (HWF) stage status.
#     Calls ICAT.InsertGoLiveStage stored procedure.
#     """
#     conn = None
#     cursor = None
    
#     try:
#         DBSCHEMA = get_db_schema()
#         data = request.get_json()
        
#         # Extract parameters
#         process_id = data.get('ProcessId')
        
#         # Validate required fields
#         if process_id is None:
#             return jsonify({"success": False, "message": "ProcessId is required"}), 400
        
#         conn = connect_to_database()
#         cursor = conn.cursor()
        
#         # Execute stored procedure
#         cursor.execute(
#             f"EXEC {DBSCHEMA}.InsertGoLiveStage "
#             "@ProcessId = %s, @LoggedInUserId = %s",
#             (process_id, user_id)
#         )
        
#         result = cursor.fetchall()
#         conn.commit()
        
#         # Get message from stored procedure result
#         if result:
#             message = result[0][0] if result[0] else 'Process is now in the Go-Live & Deployment (HWF) phase.'
#             return jsonify({"success": True, "message": message}), 200
#         else:
#             return jsonify({"success": True, "message": "Process is now in the Go-Live & Deployment (HWF) phase."}), 200
            
#     except Exception as e:
#         if conn:
#             conn.rollback()
#         print(f"Error tracking Go-Live stage: {e}")
#         return jsonify({"success": False, "message": str(e)}), 500
#     finally:
#         if cursor:
#             cursor.close()
#         if conn:
#             conn.close()


# @process_stages_bp.route('/api/hypercare-stage', methods=['POST'])
# @token_required
# def insert_hypercare_stage():
#     user_id = request.user.get("UserId")
#     # user_name = request.user.get("UserName")
#     """
#     Track Hypercare & Stabilization (HWF) stage status.
#     Calls ICAT.InsertHypercareStage stored procedure.
#     """
#     conn = None
#     cursor = None
    
#     try:
#         DBSCHEMA = get_db_schema()
#         data = request.get_json()
        
#         # Extract parameters
#         process_id = data.get('ProcessId')
        
#         # Validate required fields
#         if process_id is None:
#             return jsonify({"success": False, "message": "ProcessId is required"}), 400
        
#         conn = connect_to_database()
#         cursor = conn.cursor()
        
#         # Execute stored procedure
#         cursor.execute(
#             f"EXEC {DBSCHEMA}.InsertHypercareStage "
#             "@ProcessId = %s, @LoggedInUserId = %s",
#             (process_id, user_id)
#         )
        
#         result = cursor.fetchall()
#         conn.commit()
        
#         # Get message from stored procedure result
#         if result:
#             message = result[0][0] if result[0] else 'Process is now in the Hypercare & Stabilization (HWF) phase.'
#             return jsonify({"success": True, "message": message}), 200
#         else:
#             return jsonify({"success": True, "message": "Process is now in the Hypercare & Stabilization (HWF) phase."}), 200
            
#     except Exception as e:
#         if conn:
#             conn.rollback()
#         print(f"Error tracking Hypercare stage: {e}")
#         return jsonify({"success": False, "message": str(e)}), 500
#     finally:
#         if cursor:
#             cursor.close()
#         if conn:
#             conn.close()


# @process_stages_bp.route('/api/handover-stage', methods=['POST'])
# @token_required
# def insert_handover_stage():
#     user_id = request.user.get("UserId")
#     # user_name = request.user.get("UserName")
#     """
#     Track Handover to BAU Support stage status.
#     Calls ICAT.InsertHandoverToBAUStage stored procedure.
#     """
#     conn = None
#     cursor = None
    
#     try:
#         DBSCHEMA = get_db_schema()
#         data = request.get_json()
        
#         # Extract parameters
#         process_id = data.get('ProcessId')
        
#         # Validate required fields
#         if process_id is None:
#             return jsonify({"success": False, "message": "ProcessId is required"}), 400
        
#         conn = connect_to_database()
#         cursor = conn.cursor()
        
#         # Execute stored procedure
#         cursor.execute(
#             f"EXEC {DBSCHEMA}.InsertHandoverToBAUStage "
#             "@ProcessId = %s, @LoggedInUserId = %s",
#             (process_id, user_id)
#         )
        
#         result = cursor.fetchall()
#         conn.commit()
        
#         # Get message from stored procedure result
#         if result:
#             message = result[0][0] if result[0] else 'Process is now in the Handover to BAU Support phase.'
#             return jsonify({"success": True, "message": message}), 200
#         else:
#             return jsonify({"success": True, "message": "Process is now in the Handover to BAU Support phase."}), 200
            
#     except Exception as e:
#         if conn:
#             conn.rollback()
#         print(f"Error tracking Handover stage: {e}")
#         return jsonify({"success": False, "message": str(e)}), 500
#     finally:
#         if cursor:
#             cursor.close()
#         if conn:
#             conn.close()


# @process_stages_bp.route('/api/development-stage', methods=['POST'])
# @token_required
# def insert_development_stage():
#     user_id = request.user.get("UserId")
#     # user_name = request.user.get("UserName")
#     """
#     Track Development stage status.
#     Calls ICAT.InsertDevelopmentStage stored procedure.
#     """
#     conn = None
#     cursor = None
    
#     try:
#         DBSCHEMA = get_db_schema()
#         data = request.get_json()
        
#         # Extract parameters
#         process_id = data.get('ProcessId')
        
#         # Validate required fields
#         if process_id is None:
#             return jsonify({"success": False, "message": "ProcessId is required"}), 400
        
#         conn = connect_to_database()
#         cursor = conn.cursor()
        
#         # Execute stored procedure
#         cursor.execute(
#             f"EXEC {DBSCHEMA}.InsertDevelopmentStage "
#             "@ProcessId = %s, @LoggedInUserId = %s",
#             (process_id, user_id)
#         )
        
#         result = cursor.fetchall()
#         conn.commit()
        
#         # Get message from stored procedure result
#         if result:
#             message = result[0][0] if result[0] else 'Process is now in the Development phase.'
#             return jsonify({"success": True, "message": message}), 200
#         else:
#             return jsonify({"success": True, "message": "Process is now in the Development phase."}), 200
            
#     except Exception as e:
#         if conn:
#             conn.rollback()
#         print(f"Error tracking Development stage: {e}")
#         return jsonify({"success": False, "message": str(e)}), 500
#     finally:
#         if cursor:
#             cursor.close()
#         if conn:
#             conn.close()

# Get stage tracking
@process_stages_bp.route('/api/stage-tracking/<int:process_id>', methods=['GET'])
@token_required
def get_stage_tracking(process_id):
    """
    Get complete stage timeline for a process
    (including approval info if applicable).
    """
    conn = None
    cursor = None

    try:
        DBSCHEMA = get_db_schema()

        conn = connect_to_database()
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
                AND ST.StageId = SAL.stage_id
            WHERE ST.process_id = %s
            ORDER BY SM.SequenceOrder ASC
            """,
            (process_id,)
        )

        result = cursor.fetchall()

        if result:
            columns = [column[0] for column in cursor.description]
            stages = [dict(zip(columns, row)) for row in result]

            stages = [format_datetime_for_json(stage) for stage in stages]

            return jsonify({
                "success": True,
                "process_id": process_id,
                "stages": stages
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "No stage tracking found for this process"
            }), 404

    except Exception as e:
        error_message = str(e)
        print(f"Error getting stage tracking: {error_message}")
        return jsonify({
            "success": False,
            "message": error_message
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()



# def _execute_stored_procedure(DBSCHEMA, sp_name, process_id, conn=None):
#     """
#     Helper function to execute a stored procedure in a separate connection.
#     Used for parallel execution of stored procedures.
#     """
#     local_conn = None
#     try:
#         if conn is None:
#             local_conn = connect_to_database()
#             if not local_conn:
#                 return None
#             conn = local_conn
        
#         cursor = conn.cursor()
#         cursor.execute(
#             f"EXEC {DBSCHEMA}.{sp_name} @ProcessId = %s",
#             (process_id,)
#         )
#         result = cursor.fetchall()
#         columns = [column[0] for column in cursor.description] if cursor.description else []
#         cursor.close()
        
#         if result:
#             data = dict(zip(columns, result[0]))
#             return format_datetime_for_json(data)
#         return None
#     except Exception as e:
#         current_app.logger.error(f"Error executing {sp_name}: {str(e)}")
#         return None
#     finally:
#         if local_conn:
#             local_conn.close()

@process_stages_bp.route('/api/get-all-processes', methods=['GET'])
@token_required
def get_all_processes():
    """Get all processes for card display"""
    conn = None
    cursor = None
    
    try:
        # Get UserId from request.user (set by token_required decorator)
        user_id = request.user.get('UserId')
        
        if not user_id:
            return jsonify({"success": False, "message": "User ID not found"}), 401
        
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Try with UserId parameter first, fallback to without if it fails
        try:
            cursor.execute(f"EXEC {DBSCHEMA}.GetAllProcessSummary @UserId=%s", (user_id,))
        except Exception as sp_error:
            # If stored procedure doesn't accept @UserId, try without it
            current_app.logger.warning(f"GetAllProcessSummary with @UserId failed, trying without: {str(sp_error)}")
            cursor.execute(f"EXEC {DBSCHEMA}.GetAllProcessSummary")
        
        processes_result = cursor.fetchall()
        columns = [column[0] for column in cursor.description]
        
        processes = []
        for row in processes_result:
            process_dict = dict(zip(columns, row))
            process_dict = format_datetime_for_json(process_dict)
            processes.append(process_dict)
        
        return jsonify({
            "success": True,
            "processes": processes,
            "count": len(processes)
        }), 200
            
    except Exception as e:
        current_app.logger.error(f"Error in get_all_processes: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@process_stages_bp.route('/api/get-process-detail/<int:process_id>', methods=['GET'])
@token_required
def get_process_detail(process_id):
    """Get process registration details only"""
    conn = None
    cursor = None
    
    try:
        # Get UserId from request.user (set by token_required decorator)
        user_id = request.user.get('UserId')
        
        if not user_id:
            return jsonify({"success": False, "message": "User ID not found"}), 401
        
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Try with UserId parameter first, fallback to without if it fails
        try:
            cursor.execute(
                f"EXEC {DBSCHEMA}.GetAllProcessSummary @ProcessId=%s, @UserId=%s",
                (process_id, user_id)
            )
        except Exception as sp_error:
            # If stored procedure doesn't accept @UserId, try without it
            current_app.logger.warning(f"GetAllProcessSummary with @UserId failed, trying without: {str(sp_error)}")
            cursor.execute(
                f"EXEC {DBSCHEMA}.GetAllProcessSummary @ProcessId=%s",
                (process_id,)
            )
        process_result = cursor.fetchall()
        
        if not process_result:
            return jsonify({"success": False, "message": "Process not found"}), 404
        
        columns = [column[0] for column in cursor.description]
        process_dict = dict(zip(columns, process_result[0]))
        process_dict = format_datetime_for_json(process_dict)
        
        return jsonify({
            "success": True,
            "process": process_dict
        }), 200
            
    except Exception as e:
        current_app.logger.error(f"Error in get_process_detail: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@process_stages_bp.route('/api/get-business-case/<int:process_id>', methods=['GET'])
@token_required
def get_business_case(process_id):
    """Get business case data for a process"""
    conn = None
    cursor = None
    
    try:
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        cursor.execute(
            f"EXEC {DBSCHEMA}.GetBusinessCase @ProcessId=%s",
            (process_id,)
        )
        
        result = cursor.fetchall()
        
        if not result:
            return jsonify({
                "success": True,
                "hasData": False,
                "businessCase": None,
                "message": "No business case data found for this process"
            }), 200
        
        columns = [column[0] for column in cursor.description]
        business_case_dict = dict(zip(columns, result[0]))
        business_case_dict = format_datetime_for_json(business_case_dict)
        
        return jsonify({
            "success": True,
            "hasData": True,
            "businessCase": business_case_dict
        }), 200
            
    except Exception as e:
        current_app.logger.error(f"Error in get_business_case: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@process_stages_bp.route('/api/get-technical-assessment/<int:process_id>', methods=['GET'])
@token_required
def get_technical_assessment(process_id):
    """Get technical assessment and detailed analysis data for a process"""
    conn = None
    cursor = None
    
    try:
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        cursor.execute(
            f"EXEC {DBSCHEMA}.GetTechnicalAssessment @ProcessId=%s",
            (process_id,)
        )
        
        result = cursor.fetchall()
        
        if not result:
            return jsonify({
                "success": True,
                "hasData": False,
                "technicalAssessment": None,
                "message": "No technical assessment data found for this process"
            }), 200
        
        columns = [column[0] for column in cursor.description]
        tech_assessment_dict = dict(zip(columns, result[0]))
        tech_assessment_dict = format_datetime_for_json(tech_assessment_dict)
        
        # Check if there's any meaningful data (not all NULL)
        has_data = False
        for key, value in tech_assessment_dict.items():
            if value is not None and key not in ['DA_id', 'TA_id']:
                has_data = True
                break
        
        return jsonify({
            "success": True,
            "hasData": has_data,
            "technicalAssessment": tech_assessment_dict
        }), 200
            
    except Exception as e:
        current_app.logger.error(f"Error in get_technical_assessment: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

