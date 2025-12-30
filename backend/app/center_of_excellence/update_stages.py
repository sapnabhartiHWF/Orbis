from flask import request, jsonify, current_app
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required
from app.center_of_excellence.process_registration import process_registration_bp, format_datetime_for_json, get_db_schema
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

@process_registration_bp.route('/api/process-registration/<int:process_id>', methods=['PUT'])
@token_required
def update_process_registration(user_id, user_name, process_id):
    """
    Update an existing process registration.
    Calls santova.UpdateProcessRegistration stored procedure.
    """
    conn = None
    cursor = None
    
    try:
        DBSCHEMA = get_db_schema()
        data = request.get_json()
        
        # Extract parameters
        title = data.get('Title')
        description = data.get('Description')
        priority = data.get('Priority')
        expected_roi = data.get('ExpectedROI')
        stakeholder = data.get('Stakeholder')
        tag = data.get('Tag')
        sampledata_path = data.get('SampledataPath')
        mime_type = data.get('MimeType')
        sop_doc = data.get('SopDoc')
        sop_mimetype = data.get('SopMimetype')
        department = data.get('Department')
        
        # Validate required fields
        if not title:
            return jsonify({"success": False, "message": "Title is required"}), 400
        
        # Construct full file paths if filenames are provided
        # Use a consistent path structure: process_registration/filename (relative path, no 'uploads/' prefix)
        import os
        from werkzeug.utils import secure_filename
        PROCESS_REGISTRATION_FOLDER = "process_registration"
        
        if sampledata_path:
            # If it's already a full path with 'uploads/' or 'process_registration/', use it
            # Otherwise, if it's just a filename, construct the relative path
            if not os.path.isabs(sampledata_path):
                if not sampledata_path.startswith('uploads/') and not sampledata_path.startswith('process_registration/'):
                    # It's just a filename, construct the relative path (without 'uploads/' prefix)
                    sampledata_path = os.path.join(PROCESS_REGISTRATION_FOLDER, secure_filename(sampledata_path)).replace('\\', '/')
                elif sampledata_path.startswith('uploads/'):
                    # Remove 'uploads/' prefix to make it relative
                    sampledata_path = sampledata_path.replace('uploads/', '', 1).lstrip('/')
        
        if sop_doc:
            # If it's already a full path with 'uploads/' or 'process_registration/', use it
            # Otherwise, if it's just a filename, construct the relative path
            # CRITICAL: Preserve file extension
            if not os.path.isabs(sop_doc):
                if not sop_doc.startswith('uploads/') and not sop_doc.startswith('process_registration/'):
                    # It's just a filename, secure it and construct relative path (preserves extension)
                    filename_with_ext = secure_filename(sop_doc)
                    if '.' not in filename_with_ext:
                        current_app.logger.warning(f"SOP doc filename missing extension: {sop_doc}")
                    sop_doc = f"process_registration/{filename_with_ext}"
                elif sop_doc.startswith('uploads/'):
                    # Remove 'uploads/' prefix to make it relative (preserves extension)
                    sop_doc = sop_doc.replace('uploads/', '', 1).lstrip('/')
                    # Ensure it starts with process_registration/
                    if not sop_doc.startswith('process_registration/'):
                        filename_with_ext = os.path.basename(sop_doc)
                        sop_doc = f"process_registration/{filename_with_ext}"
                
                # Final validation: ensure path has extension
                if sop_doc and '.' not in os.path.basename(sop_doc):
                    current_app.logger.error(f"SOP doc path stored without extension: {sop_doc}")
        
        conn = connect_to_database()
        cursor = conn.cursor()
        
        # Execute stored procedure
        cursor.execute(
            f"EXEC {DBSCHEMA}.UpdateProcessRegistration "
            "@P_id = %s, @Title = %s, @Description = %s, @Priority = %s, "
            "@ExpectedROI = %s, @Stakeholder = %s, @Tag = %s, "
            "@SampledataPath = %s, @MimeType = %s, @SopDoc = %s, "
            "@SopMimetype = %s, @Department = %s, @LoggedInUserId = %s",
            (process_id, title, description, priority, expected_roi, stakeholder, tag,
             sampledata_path, mime_type, sop_doc, sop_mimetype, department, user_id)
        )
        
        result = cursor.fetchall()
        
        # Check if ApprovalStage exists, if not create it, then set ApprovalNeedsReview = 1
        cursor.execute(
            f"SELECT TOP 1 A_id FROM {DBSCHEMA}.ApprovalStage "
            "WHERE process_id = %s AND IsDeleted = 0",
            (process_id,)
        )
        approval_exists = cursor.fetchone()
        
        if not approval_exists:
            # Create ApprovalStage record if it doesn't exist
            cursor.execute(
                f"EXEC {DBSCHEMA}.InsertApprovalStage "
                "@ProcessId = %s, @BusinessOwnerApproval = 0, @RPA_Approval = 0, "
                "@BO_ApprovalNote = NULL, @RPA_ApprovalNote = NULL, @LoggedInUserId = %s",
                (process_id, user_id)
            )
        
        # Now set ApprovalNeedsReview = 1 (whether we just created it or it already existed)
        cursor.execute(
            f"UPDATE {DBSCHEMA}.ApprovalStage "
            "SET ApprovalNeedsReview = 1 "
            "WHERE process_id = %s AND IsDeleted = 0",
            (process_id,)
        )
        rows_updated = cursor.rowcount
        
        conn.commit()
        
        # Format result as dictionary
        if result and cursor.description:
            columns = [column[0] for column in cursor.description]
            process_dict = dict(zip(columns, result[0]))
            # Convert datetime objects to ISO format strings for consistent timezone handling
            process_dict = format_datetime_for_json(process_dict)
            return jsonify({
                "success": True, 
                "process": process_dict
            }), 200
        else:
            # Even if no result, the update might have succeeded
            # Return success with a message
            return jsonify({
                "success": True, 
                "message": "Process registration updated successfully"
            }), 200
            
    except Exception as e:
        if conn:
            conn.rollback()
        pass
        # Check if error is about record not found
        error_message = str(e)
        if "not found" in error_message.lower() or "does not exist" in error_message.lower():
            return jsonify({"success": False, "message": "Process registration not found"}), 404
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@process_registration_bp.route('/api/initial-triage/<int:process_id>', methods=['PUT'])
@token_required
def update_initalTriage_stages(user_id, user_name, process_id):
    """
    Update an existing initial triage stage.
    Calls santova.UpdateInitialTriageStage stored procedure.
    Note: First gets T_id from process_id, then updates using T_id.
    """
    conn = None
    cursor = None
    
    try:
        DBSCHEMA = get_db_schema()
        data = request.get_json()
        
        # Extract parameters
        t_id = data.get('T_id')  # T_id can be provided in body, or we'll get it from process_id
        is_rule_based = data.get('IsRuleBased')
        is_stable = data.get('IsStable')
        systems_involved = data.get('SystemsInvolved')
        blockers = data.get('Blockers')
        estimated_automation_percent = data.get('EstimatedAutomationPercent')
        
        conn = connect_to_database()
        cursor = conn.cursor()
        
        # If T_id is not provided, get it from process_id
        if not t_id:
            cursor.execute(
                f"SELECT TOP 1 T_id FROM {DBSCHEMA}.InitialTriageStage WHERE process_id = %s AND IsDeleted = 0 ORDER BY T_id DESC",
                (process_id,)
            )
            t_id_result = cursor.fetchone()
            if not t_id_result:
                return jsonify({"success": False, "message": "Initial triage stage not found for this process"}), 404
            t_id = t_id_result[0]
        
        # Execute stored procedure - Note: SP name is UpdateInitialTriageStage (not UpdateInitialTriage)
        cursor.execute(
            f"EXEC {DBSCHEMA}.UpdateInitialTriageStage "
            "@T_id = %s, @process_id = %s, @is_rule_based = %s, @is_stable = %s, "
            "@systems_involved = %s, @blockers = %s, @estimated_automation_percent = %s, @LoggedInUserId = %s",
            (t_id, process_id, is_rule_based, is_stable, systems_involved, blockers, estimated_automation_percent, user_id)
        )
        
        result = cursor.fetchall()
        
        # Check if ApprovalStage exists, if not create it, then set ApprovalNeedsReview = 1
        cursor.execute(
            f"SELECT TOP 1 A_id FROM {DBSCHEMA}.ApprovalStage "
            "WHERE process_id = %s AND IsDeleted = 0",
            (process_id,)
        )
        approval_exists = cursor.fetchone()
        
        if not approval_exists:
            # Create ApprovalStage record if it doesn't exist
            cursor.execute(
                f"EXEC {DBSCHEMA}.InsertApprovalStage "
                "@ProcessId = %s, @BusinessOwnerApproval = 0, @RPA_Approval = 0, "
                "@BO_ApprovalNote = NULL, @RPA_ApprovalNote = NULL, @LoggedInUserId = %s",
                (process_id, user_id)
            )
        
        # Now set ApprovalNeedsReview = 1 (whether we just created it or it already existed)
        cursor.execute(
            f"UPDATE {DBSCHEMA}.ApprovalStage "
            "SET ApprovalNeedsReview = 1 "
            "WHERE process_id = %s AND IsDeleted = 0",
            (process_id,)
        )
        
        conn.commit()
        
        # Format result as dictionary
        if result and cursor.description:
            columns = [column[0] for column in cursor.description]
            triage_dict = dict(zip(columns, result[0]))
            # Convert datetime objects to ISO format strings for consistent timezone handling
            triage_dict = format_datetime_for_json(triage_dict)
            return jsonify({
                "success": True, 
                "triage": triage_dict
            }), 200
        else:
            # Even if no result, the update might have succeeded
            # Return success with a message
            return jsonify({
                "success": True, 
                "message": "Initial triage stage updated successfully"
            }), 200
            
    except Exception as e:
        if conn:
            conn.rollback()
        pass
        # Check if error is about record not found
        error_message = str(e)
        if "not found" in error_message.lower() or "does not exist" in error_message.lower():
            return jsonify({"success": False, "message": "Initial triage stage not found"}), 404
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@process_registration_bp.route('/api/system-integration/<int:process_id>', methods=['PUT'])
@token_required
def update_systemIntegration_stages(user_id, user_name, process_id):
    """
    Update an existing system integration stage.
    Calls santova.UpdateSystemIntegration stored procedure.
    Note: First gets sy_Id from process_id, then updates using sy_Id.
    """
    conn = None
    cursor = None
    
    try:
        DBSCHEMA = get_db_schema()
        data = request.get_json()
        
        # Extract parameters - SP expects: @sy_Id, @credentials, @process_id, @notes, @LoggedInUserId
        sy_id = data.get('sy_Id') or data.get('Sy_Id') or data.get('SI_id')  # Accept multiple variations
        credentials = data.get('Credentials')
        notes = data.get('Notes')
        
        conn = connect_to_database()   
        cursor = conn.cursor()
        
        # If sy_Id is not provided, get it from process_id
        # Table name is SystemIntegration (not SystemIntegrationStage), column is sy_Id (not SI_id)
        if not sy_id:
            cursor.execute(
                f"SELECT TOP 1 sy_Id FROM {DBSCHEMA}.SystemIntegration WHERE process_id = %s AND IsDeleted = 0 ORDER BY sy_Id DESC",
                (process_id,)
            )
            sy_id_result = cursor.fetchone()
            if not sy_id_result:
                return jsonify({"success": False, "message": "System integration stage not found for this process"}), 404
            sy_id = sy_id_result[0]
        
        # Execute stored procedure
        cursor.execute(
            f"EXEC {DBSCHEMA}.UpdateSystemIntegration "
            "@sy_Id = %s, @credentials = %s, @process_id = %s, @notes = %s, @LoggedInUserId = %s",
            (sy_id, credentials, process_id, notes, user_id)
        )
        
        result = cursor.fetchall()
        
        # Check if ApprovalStage exists, if not create it, then set ApprovalNeedsReview = 1
        cursor.execute(
            f"SELECT TOP 1 A_id FROM {DBSCHEMA}.ApprovalStage "
            "WHERE process_id = %s AND IsDeleted = 0",
            (process_id,)
        )
        approval_exists = cursor.fetchone()
        
        if not approval_exists:
            # Create ApprovalStage record if it doesn't exist
            cursor.execute(
                f"EXEC {DBSCHEMA}.InsertApprovalStage "
                "@ProcessId = %s, @BusinessOwnerApproval = 0, @RPA_Approval = 0, "
                "@BO_ApprovalNote = NULL, @RPA_ApprovalNote = NULL, @LoggedInUserId = %s",
                (process_id, user_id)
            )
        
        # Now set ApprovalNeedsReview = 1 (whether we just created it or it already existed)
        cursor.execute(
            f"UPDATE {DBSCHEMA}.ApprovalStage "
            "SET ApprovalNeedsReview = 1 "
            "WHERE process_id = %s AND IsDeleted = 0",
            (process_id,)
        )
        
        conn.commit()
        
        # Format result as dictionary
        # Check if cursor.description exists (it might be None if SP raised an error)
        if result and cursor.description:
            try:
                columns = [column[0] for column in cursor.description]
                integration_dict = dict(zip(columns, result[0]))
                # Convert datetime objects to ISO format strings for consistent timezone handling
                integration_dict = format_datetime_for_json(integration_dict)
                return jsonify({
                    "success": True, 
                    "integration": integration_dict
                }), 200
            except (TypeError, AttributeError) as e:
                pass
                # If we can't process the result, but the SP executed, return success
                return jsonify({
                    "success": True, 
                    "message": "System integration stage updated successfully"
                }), 200
        else:
            # Even if no result, the update might have succeeded
            # Return success with a message
            return jsonify({
                "success": True, 
                "message": "System integration stage updated successfully"
            }), 200
            
    except Exception as e:
        if conn:
            conn.rollback()
        pass
        # Check if error is about record not found (from RAISERROR in SP)
        error_message = str(e)
        if ("not found" in error_message.lower() or 
            "does not exist" in error_message.lower() or 
            "SystemIntegration record not found" in error_message):
            return jsonify({"success": False, "message": "System integration stage not found"}), 404
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@process_registration_bp.route('/api/to-be-design/<int:process_id>', methods=['PUT'])
@token_required
def update_toBeDesign_stages(user_id, user_name, process_id):
    """
    Update an existing to be design stage.
    Files must be uploaded via multipart/form-data.
    File paths are created ONLY by save_uploaded_file() - never from frontend JSON/form data.
    If no new files are uploaded, existing paths are kept from database.
    """
    conn = None
    cursor = None
    
    try:
        DBSCHEMA = get_db_schema()
        
        # 🔹 Use multipart/form-data for files, form data for other fields
        d_id = request.form.get('D_id') or request.form.get('D_Id') or request.form.get('DId')
        credentials = request.form.get('Credentials')
        virtual_machine = request.form.get('VirtualMachine')
        workflow_download_count = request.form.get('WorkflowDownloadCount')
        exception_download_count = request.form.get('ExceptionDownloadCount')
        logging_info = request.form.get('LoggingRequirements') or request.form.get('LoggingInfo')
        
        # ✅ Files come from request.files ONLY
        workflow_file_upload = request.files.get('WorkflowFile')
        exception_file_upload = request.files.get('ExceptionFile')
        
        from app.file_storage import save_uploaded_file
        
        workflow_file_name = None
        workflow_file_path = None
        exception_file_name = None
        exception_file_path = None
        
        # ✅ Process workflow file upload
        if workflow_file_upload:
            try:
                workflow_data = save_uploaded_file(
                    workflow_file_upload,
                    f"to_be_design/{process_id}"
                )
                workflow_file_name = workflow_data["file_name"]
                workflow_file_path = workflow_data["relative_path"].replace("\\", "/")  # Normalize path separators
                
                # Validate that path includes filename
                if not workflow_file_path or "/" not in workflow_file_path or "." not in os.path.basename(workflow_file_path):
                    raise ValueError(f"Invalid workflow file path generated: {workflow_file_path}")
                
                current_app.logger.info(f"Workflow file saved: name={workflow_file_name}, path={workflow_file_path}")
            except Exception as e:
                current_app.logger.error(f"Error saving workflow file: {str(e)}")
                return jsonify({"success": False, "message": f"Failed to save workflow file: {str(e)}"}), 500
        
        # ✅ Process exception file upload
        if exception_file_upload:
            try:
                exception_data = save_uploaded_file(
                    exception_file_upload,
                    f"to_be_design/{process_id}"
                )
                exception_file_name = exception_data["file_name"]
                exception_file_path = exception_data["relative_path"].replace("\\", "/")  # Normalize path separators
                
                # Validate that path includes filename
                if not exception_file_path or "/" not in exception_file_path or "." not in os.path.basename(exception_file_path):
                    raise ValueError(f"Invalid exception file path generated: {exception_file_path}")
                
                current_app.logger.info(f"Exception file saved: name={exception_file_name}, path={exception_file_path}")
            except Exception as e:
                current_app.logger.error(f"Error saving exception file: {str(e)}")
                return jsonify({"success": False, "message": f"Failed to save exception file: {str(e)}"}), 500
        
        # Normalize optional fields
        credentials = credentials.strip() if credentials and credentials.strip() else None
        virtual_machine = virtual_machine.strip() if virtual_machine and virtual_machine.strip() else None
        logging_info = logging_info.strip() if logging_info and logging_info.strip() else None
        
        conn = connect_to_database()
        cursor = conn.cursor()
        
        # If D_id is not provided, get it from process_id
        # Table name is ToBeDesign, column is D_id
        if not d_id:
            cursor.execute(
                f"SELECT TOP 1 D_id FROM {DBSCHEMA}.ToBeDesign WHERE process_id = %s AND IsDeleted = 0 ORDER BY D_id DESC",
                (process_id,)
            )
            d_id_result = cursor.fetchone()
            if not d_id_result:
                return jsonify({"success": False, "message": "To-be design stage not found for this process"}), 404
            d_id = d_id_result[0]
        
        # Log values before sending to stored procedure
        current_app.logger.info(
            f"UpdateToBeDesign - D_id: {d_id}, process_id: {process_id}, "
            f"WorkflowFile: {workflow_file_name}, WorkflowFilePath: {workflow_file_path}, "
            f"ExceptionFile: {exception_file_name}, ExceptionFilePath: {exception_file_path}"
        )
        
        # Execute stored procedure
        # Note: If no new files uploaded, workflow_file_name/path and exception_file_name/path are None
        # The stored procedure should handle NULL to mean "don't update these fields"
        cursor.execute(
            f"EXEC {DBSCHEMA}.UpdateToBeDesign "
            "@D_id = %s, @process_id = %s, @WorkflowFile = %s, @WorkflowFilePath = %s, "
            "@ExceptionFile = %s, @ExceptionFilePath = %s, @Credentials = %s, "
            "@VirtualMachine = %s, @WorkflowDownloadCount = %s, @ExceptionDownloadCount = %s, "
            "@LoggingInfo = %s, @LoggedInUserId = %s",
            (d_id, process_id, workflow_file_name, workflow_file_path, exception_file_name,
             exception_file_path, credentials, virtual_machine, workflow_download_count,
             exception_download_count, logging_info, user_id)
        )
        
        result = cursor.fetchall()
        
        # 🔴 CRITICAL FIX: ALWAYS update paths directly to ensure correct values are stored
        if d_id and (workflow_file_path or exception_file_path):
            update_fields = []
            update_params = []
            
            if workflow_file_path:
                # Validate path format: must be to_be_design/{process_id}/filename.ext
                expected_prefix = f"to_be_design/{process_id}/"
                if not workflow_file_path.startswith(expected_prefix):
                    current_app.logger.error(f"Invalid workflow path format: {workflow_file_path}, expected to start with {expected_prefix}")
                if "." not in os.path.basename(workflow_file_path):
                    current_app.logger.error(f"Workflow path missing filename extension: {workflow_file_path}")
                
                update_fields.append("WorkflowFilePath = %s")
                update_params.append(workflow_file_path)
                current_app.logger.info(f"Setting WorkflowFilePath = {workflow_file_path} for D_id {d_id}")
            
            if exception_file_path:
                # Validate path format: must be to_be_design/{process_id}/filename.ext
                expected_prefix = f"to_be_design/{process_id}/"
                if not exception_file_path.startswith(expected_prefix):
                    current_app.logger.error(f"Invalid exception path format: {exception_file_path}, expected to start with {expected_prefix}")
                if "." not in os.path.basename(exception_file_path):
                    current_app.logger.error(f"Exception path missing filename extension: {exception_file_path}")
                
                update_fields.append("ExceptionFilePath = %s")
                update_params.append(exception_file_path)
                current_app.logger.info(f"Setting ExceptionFilePath = {exception_file_path} for D_id {d_id}")
            
            if update_fields:
                update_params.append(d_id)
                try:
                    cursor.execute(
                        f"UPDATE {DBSCHEMA}.ToBeDesign SET {', '.join(update_fields)} WHERE D_id = %s",
                        tuple(update_params)
                    )
                    rows_affected = cursor.rowcount
                    current_app.logger.info(f"Updated {rows_affected} row(s) with paths for D_id {d_id}")
                    if rows_affected == 0:
                        current_app.logger.error(f"WARNING: No rows updated for D_id {d_id}!")
                except Exception as e:
                    current_app.logger.error(f"Error updating paths: {str(e)}")
                    raise
        
        # Check if ApprovalStage exists, if not create it, then set ApprovalNeedsReview = 1
        cursor.execute(
            f"SELECT TOP 1 A_id FROM {DBSCHEMA}.ApprovalStage "
            "WHERE process_id = %s AND IsDeleted = 0",
            (process_id,)
        )
        approval_exists = cursor.fetchone()
        
        if not approval_exists:
            # Create ApprovalStage record if it doesn't exist
            cursor.execute(
                f"EXEC {DBSCHEMA}.InsertApprovalStage "
                "@ProcessId = %s, @BusinessOwnerApproval = 0, @RPA_Approval = 0, "
                "@BO_ApprovalNote = NULL, @RPA_ApprovalNote = NULL, @LoggedInUserId = %s",
                (process_id, user_id)
            )
        
        # Now set ApprovalNeedsReview = 1 (whether we just created it or it already existed)
        cursor.execute(
            f"UPDATE {DBSCHEMA}.ApprovalStage "
            "SET ApprovalNeedsReview = 1 "
            "WHERE process_id = %s AND IsDeleted = 0",
            (process_id,)
        )
        
        conn.commit()
        
        # Format result as dictionary
        if result and cursor.description:
            columns = [column[0] for column in cursor.description]
            design_dict = dict(zip(columns, result[0]))
            # Convert datetime objects to ISO format strings for consistent timezone handling
            design_dict = format_datetime_for_json(design_dict)
            return jsonify({
                "success": True, 
                "design": design_dict
            }), 200
        else:
            # Even if no result, the update might have succeeded
            # Return success with a message
            return jsonify({
                "success": True, 
                "message": "To-be design stage updated successfully"
            }), 200
            
    except Exception as e:
        if conn:
            conn.rollback()
        pass
        # Check if error is about record not found
        error_message = str(e)
        if "not found" in error_message.lower() or "does not exist" in error_message.lower():
            return jsonify({"success": False, "message": "To-be design stage not found"}), 404
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@process_registration_bp.route('/api/approval-stage/<int:process_id>', methods=['PUT'])
@token_required
def update_approval_stage(user_id, user_name, process_id):
    """
    Update an existing approval stage and (when fully approved) move to the next stage.
    Calls:
      - santova.UpdateApprovalStage   → updates approval data
      - santova.SubmitStageAndMoveNext (when both approvals are completed) → moves stage forward
    Note: First gets A_id from process_id, then updates using A_id.
    """
    conn = None
    cursor = None
    
    try:            
        DBSCHEMA = get_db_schema()
        data = request.get_json()
        
        a_id = data.get('A_id') or data.get('A_Id') or data.get('AId') or data.get('ApprovalId')
        business_owner_approval = data.get('BusinessOwnerApproval')
        bo_approval_note = data.get('BO_ApprovalNote')
        bo_approval_status = data.get('BO_approval_status')
        rpa_approval = data.get('RPA_Approval')
        rpa_approval_note = data.get('RPA_ApprovalNote')
        rpa_approval_status = data.get('RPA_approval_status')
        
        conn = connect_to_database()
        cursor = conn.cursor()
        
        if not a_id:
            cursor.execute(
                f"SELECT TOP 1 A_id FROM {DBSCHEMA}.ApprovalStage WHERE process_id = %s AND IsDeleted = 0 ORDER BY A_id DESC",
                (process_id,)
            )
            a_id_result = cursor.fetchone()
            if not a_id_result:
                return jsonify({"success": False, "message": "Approval stage not found for this process"}), 404
            a_id = a_id_result[0]
        
        # CRITICAL: Fetch current approval values to preserve the one not being updated
        cursor.execute(
            f"SELECT BusinessOwnerApproval, RPA_Approval, ApprovalNeedsReview, BO_ApprovalNote, RPA_ApprovalNote FROM {DBSCHEMA}.ApprovalStage WHERE A_id = %s AND IsDeleted = 0",
            (a_id,)
        )
        current_approval_result = cursor.fetchone()
        current_bo_approval = None
        current_rpa_approval = None
        prev_approval_needs_review = 0
        current_bo_note = None
        current_rpa_note = None
        
        if current_approval_result:
            current_bo_approval = current_approval_result[0]
            current_rpa_approval = current_approval_result[1]
            prev_approval_needs_review = current_approval_result[2] if current_approval_result[2] is not None else 0
            current_bo_note = current_approval_result[3] if len(current_approval_result) > 3 else None
            current_rpa_note = current_approval_result[4] if len(current_approval_result) > 4 else None
        
        # Only update the approval that was explicitly provided
        # CRITICAL: Pass NULL to stored procedure for fields we don't want to update
        # The SP checks "IF @BusinessOwnerApproval IS NOT NULL" so NULL means "don't update"
        if business_owner_approval is not None:
            final_bo_approval = business_owner_approval
            final_bo_note = bo_approval_note if bo_approval_note is not None else current_bo_note
        else:
            final_bo_approval = None  # Pass NULL so SP doesn't update this field
            final_bo_note = None  # Pass NULL so SP doesn't update this field
        
        if rpa_approval is not None:
            final_rpa_approval = rpa_approval
            final_rpa_note = rpa_approval_note if rpa_approval_note is not None else current_rpa_note
        else:
            final_rpa_approval = None  # Pass NULL so SP doesn't update this field
            final_rpa_note = None  # Pass NULL so SP doesn't update this field
        
        # Use stored procedure - it correctly handles NULL values
        # The SP checks "IF @BusinessOwnerApproval IS NOT NULL" before updating
        # So passing NULL means "don't update this field"
        # CRITICAL: Ensure we're passing actual None (which becomes SQL NULL), not the current value
        
        # Build parameters - use None (SQL NULL) for fields we don't want to update
        sp_params = (
            a_id,
            process_id,
            final_bo_approval,  # None if not updating BO (becomes SQL NULL)
            final_bo_note,  # None if not updating BO (becomes SQL NULL)
            bo_approval_status if bo_approval_status is not None else None,
            final_rpa_approval,  # None if not updating RPA (becomes SQL NULL)
            final_rpa_note,  # None if not updating RPA (becomes SQL NULL)
            rpa_approval_status if rpa_approval_status is not None else None,
            user_id,
        )
        
        
        cursor.execute(
            f"EXEC {DBSCHEMA}.UpdateApprovalStage "
            "@A_id = %s, @process_id = %s, "
            "@BusinessOwnerApproval = %s, @BO_ApprovalNote = %s, @BO_approval_status = %s, "
            "@RPA_Approval = %s, @RPA_ApprovalNote = %s, @RPA_approval_status = %s, "
            "@LoggedInUserId = %s",
            sp_params
        )
        result = cursor.fetchall()
        
        # Format result as dictionary
        if result and cursor.description:
            columns = [column[0] for column in cursor.description]
            approval_dict = dict(zip(columns, result[0]))
            # Convert datetime objects to ISO format strings for consistent timezone handling
            approval_dict = format_datetime_for_json(approval_dict)
            
            # CRITICAL: Verify the stored procedure didn't incorrectly update both approvals
            # If we only updated one, ensure the other one matches what we intended
            bo_value_after = approval_dict.get('BusinessOwnerApproval')
            rpa_value_after = approval_dict.get('RPA_Approval')
            
            
            correction_needed = False
            
            # If we only updated BO, verify RPA wasn't changed
            if business_owner_approval is not None and rpa_approval is None:
                # Normalize boolean values for comparison
                rpa_after_bool = bool(rpa_value_after) if rpa_value_after is not None else False
                rpa_current_bool = bool(current_rpa_approval) if current_rpa_approval is not None else False
                
                if rpa_after_bool != rpa_current_bool:
                    # Correct it back
                    cursor.execute(
                        f"UPDATE {DBSCHEMA}.ApprovalStage "
                        "SET RPA_Approval = %s "
                        "WHERE A_id = %s AND IsDeleted = 0",
                        (current_rpa_approval, a_id)
                    )
                    approval_dict['RPA_Approval'] = current_rpa_approval
                    rpa_value_after = current_rpa_approval
                    correction_needed = True
            
            # If we only updated RPA, verify BO wasn't changed
            if rpa_approval is not None and business_owner_approval is None:
                # Normalize boolean values for comparison
                bo_after_bool = bool(bo_value_after) if bo_value_after is not None else False
                bo_current_bool = bool(current_bo_approval) if current_bo_approval is not None else False
                
                if bo_after_bool != bo_current_bool:
                    # Correct it back
                    cursor.execute(
                        f"UPDATE {DBSCHEMA}.ApprovalStage "
                        "SET BusinessOwnerApproval = %s "
                        "WHERE A_id = %s AND IsDeleted = 0",
                        (current_bo_approval, a_id)
                    )
                    approval_dict['BusinessOwnerApproval'] = current_bo_approval
                    bo_value_after = current_bo_approval
                    correction_needed = True
            
            # Check if both approvals are completed (similar to insert_approval_stage logic)
            bo_approved = (bo_value_after == 1 or bo_value_after is True or bo_value_after == "1" or str(bo_value_after) == "1")
            rpa_approved = (rpa_value_after == 1 or rpa_value_after is True or rpa_value_after == "1" or str(rpa_value_after) == "1")
            both_completed = bo_approved and rpa_approved

            # --- ADD THIS BLOCK ---
            # Always reset downstream stages after Approval update
            cursor.execute(
                f"SELECT StageOrder FROM {DBSCHEMA}.StageMaster WHERE StageName = %s",
                ("Approval",)
            )
            approval_order_row = cursor.fetchone()
            if approval_order_row:
                approval_order = approval_order_row[0]
                cursor.execute(
                    f"UPDATE {DBSCHEMA}.StageTracking SET Status = 'Pending' "
                    f"WHERE process_id = %s AND StageOrder > %s",
                    (process_id, approval_order)
                )
            # --- END BLOCK ---

            # If both approvals are completed, move to the next stage using SubmitStageAndMoveNext
            if both_completed:
                try:
                    cursor.execute(
                        f"EXEC {DBSCHEMA}.SubmitStageAndMoveNext "
                        "@ProcessId = %s, @CurrentStageName = %s, @LoggedInUserId = %s",
                        (process_id, 'Approval', user_id)
                    )
                    move_result = cursor.fetchall()

                    if move_result:
                        # SP returns: FromStage, ToStage, Message
                        # We don't have column names here, so map by position
                        from_stage = move_result[0][0] if len(move_result[0]) > 0 else None
                        to_stage = move_result[0][1] if len(move_result[0]) > 1 else None
                        message = move_result[0][2] if len(move_result[0]) > 2 else "Stage moved successfully"
                        stage_transition = {
                            "fromStage": from_stage,
                            "toStage": to_stage,
                            "message": message,
                        }
                except Exception as move_error:
                    # Log the error but don't fail the approval update
                    # The approval was successfully recorded, stage transition can be handled separately
                    error_msg = str(move_error)
                    current_app.logger.warning(
                        f"Stage transition failed for process {process_id} after both approvals completed: {error_msg}"
                    )
                    # Don't set stage_transition, approval update still succeeds

            # Check if ApprovalNeedsReview flag is set (indicates previous stages were updated)
            approval_needs_review = approval_dict.get('ApprovalNeedsReview')
            needs_review = (approval_needs_review == 1 or approval_needs_review is True or 
                          approval_needs_review == "1" or str(approval_needs_review) == "1")
            
            # CRITICAL: Preserve ApprovalNeedsReview = 1 if it was set before AND not both approvals are completed
            # This ensures the flag remains true until both approvals are done, even if SP resets it
            if prev_approval_needs_review == 1 and not both_completed:
                # Restore ApprovalNeedsReview = 1 if it was set before and not both are completed
                cursor.execute(
                    f"UPDATE {DBSCHEMA}.ApprovalStage "
                    "SET ApprovalNeedsReview = 1 "
                    "WHERE A_id = %s AND IsDeleted = 0",
                    (a_id,)
                )
                approval_dict['ApprovalNeedsReview'] = 1
                needs_review = True

            # Commit after all operations (including ApprovalNeedsReview restoration)
            conn.commit()
            
            # Show notification only if ApprovalNeedsReview = 1
            notification_message = None
            if needs_review:
                # Find which stage was updated to include in the notification
                updated_stage_name = get_updated_stage_name(cursor, DBSCHEMA, process_id)
                notification_message = get_approval_review_notification(updated_stage_name)
            
            response_data = {
                "success": True,
                "approval": approval_dict,
                "bothApprovalsCompleted": both_completed,
                "boStatus": "Approved" if bo_approved else "Pending",
                "rpaStatus": "Approved" if rpa_approved else "Pending",
                "stageTransition": stage_transition,
            }
            
            # Only include message if ApprovalNeedsReview is set
            if notification_message:
                response_data["message"] = notification_message
            
            return jsonify(response_data), 200
        else:
            conn.commit()
            return jsonify({"success": False, "message": "Failed to update approval stage"}), 500
            
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error updating approval stage: {e}")
        # Check if error is about record not found
        error_message = str(e)
        if "not found" in error_message.lower() or "does not exist" in error_message.lower():
            return jsonify({"success": False, "message": "Approval stage not found"}), 404
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@process_registration_bp.route('/api/stage/submit-and-next', methods=['POST'])
@token_required
def submit_stage_and_move_next(user_id, user_name):
    """
    Generic endpoint for button-only stages to update StageTracking and move to next stage.
    Uses santova.SubmitStageAndMoveNext stored procedure.

    Expected JSON body:
    {
        "ProcessId": 123,
        "CurrentStageName": "Development" | "UAT" | "Go-Live" | "Hypercare" | "Handover" | "Approval" | ...
    }
    """
    conn = None
    cursor = None

    try:
        DBSCHEMA = get_db_schema()
        data = request.get_json()

        process_id = data.get('ProcessId')
        current_stage_name = data.get('CurrentStageName')

        # Validate required fields
        if process_id is None:
            return jsonify({"success": False, "message": "ProcessId is required"}), 400
        if not current_stage_name:
            return jsonify({"success": False, "message": "CurrentStageName is required"}), 400

        conn = connect_to_database()
        cursor = conn.cursor()

        # Execute stored procedure
        cursor.execute(
            f"EXEC {DBSCHEMA}.SubmitStageAndMoveNext "
            "@ProcessId = %s, @CurrentStageName = %s, @LoggedInUserId = %s",
            (process_id, current_stage_name, user_id)
        )

        result = cursor.fetchall()
        conn.commit()

        # SP returns: FromStage, ToStage, Message
        from_stage = None
        to_stage = None
        message = "Stage moved successfully"

        if result and len(result[0]) > 0:
            row = result[0]
            if len(row) > 0:
                from_stage = row[0]
            if len(row) > 1:
                to_stage = row[1]
            if len(row) > 2 and row[2]:
                message = row[2]

        return jsonify({
            "success": True,
            "fromStage": from_stage,
            "toStage": to_stage,
            "message": message,
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error submitting stage and moving next: {e}")
        error_message = str(e)
        # Bubble up SP validation errors (e.g., approvals not completed)
        return jsonify({"success": False, "message": error_message}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()