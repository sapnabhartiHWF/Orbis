from flask import Blueprint, request, jsonify, current_app
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required
from app.file_management.ftp_utils import get_ftp_manager
from datetime import datetime, timezone
import os
from werkzeug.utils import secure_filename

process_registration_bp = Blueprint('process_registration_bp', __name__)

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


def get_db_schema():
    """Get DBSCHEMA based on Origin header"""
    host = request.headers.get("Origin") or request.headers.get("Referer") or ""
    DBSCHEMA = "santova"
    
    # Check for ICAT schema - support multiple possible origins
    icat_origins = [
        "https://orbis-icat.alphalogix.tech",
        "http://orbis-icat.alphalogix.tech",
        "orbis-icat.alphalogix.tech",
        "icat.alphalogix.tech"
    ]
    
    # Check if host contains any ICAT identifier
    if host:
        host_lower = host.lower()
        # Check for exact match or contains ICAT
        if any(icat_origin.lower() in host_lower for icat_origin in icat_origins) or "icat" in host_lower:
            DBSCHEMA = "ICAT"
    else:
        pass
    
    return DBSCHEMA


@process_registration_bp.route('/api/process-registration/upload-file', methods=['POST'])
@token_required
def upload_process_registration_file(user_id, user_name):
    """
    Upload a file for process registration (SampleData or SOP Document).
    Saves file to uploads/process_registration/ folder.
    """
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "No file provided"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "message": "No file selected"}), 400
    
    try:
        from werkzeug.utils import secure_filename
        import os
        
        # Create process_registration folder if it doesn't exist
        UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
        PROCESS_REGISTRATION_FOLDER = os.path.join(UPLOAD_FOLDER, "process_registration")
        os.makedirs(PROCESS_REGISTRATION_FOLDER, exist_ok=True)
        
        # Secure the filename and save
        filename = secure_filename(file.filename)
        # Add timestamp to avoid filename conflicts
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        name, ext = os.path.splitext(filename)
        unique_filename = f"{name}_{timestamp}{ext}"
        
        file_path = os.path.join(PROCESS_REGISTRATION_FOLDER, unique_filename)
        
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
                pass
            except Exception as ftp_error:
                pass
        
        return jsonify({
            "success": True,
            "filename": unique_filename,
            "filePath": relative_path,
            "mimeType": mime_type,
            "fileSize": file_size
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": f"File upload failed: {str(e)}"}), 500


@process_registration_bp.route('/api/to-be-design/upload-file', methods=['POST'])
@token_required
def upload_to_be_design_file(user_id, user_name):
    """
    Upload a file for TO-BE Design stage (Workflow Diagram or Exception Handling Plan).
    Saves file to uploads/to_be_design/ folder.
    """
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "No file provided"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "message": "No file selected"}), 400
    
    try:
        from werkzeug.utils import secure_filename
        import os
        
        # Create to_be_design folder if it doesn't exist
        UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
        TO_BE_DESIGN_FOLDER = os.path.join(UPLOAD_FOLDER, "to_be_design")
        os.makedirs(TO_BE_DESIGN_FOLDER, exist_ok=True)
        
        # Secure the filename and save
        filename = secure_filename(file.filename)
        # Add timestamp to avoid filename conflicts
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        name, ext = os.path.splitext(filename)
        unique_filename = f"{name}_{timestamp}{ext}"
        
        file_path = os.path.join(TO_BE_DESIGN_FOLDER, unique_filename)
        
        # Ensure file stream is at the beginning
        file.seek(0)
        
        # Save file
        file.save(file_path)
        
        # Flush to ensure data is written to disk
        import sys
        sys.stdout.flush()
        
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
        
        # Return relative path (to_be_design/filename) for database storage
        relative_path = os.path.join("to_be_design", unique_filename).replace('\\', '/')
        
        # Upload to FTP if configured
        DBSCHEMA = get_db_schema()
        ftp_manager = get_ftp_manager(DBSCHEMA)
        ftp_upload_success = False
        if ftp_manager:
            try:
                ftp_upload_success, ftp_msg = ftp_manager.upload_file(
                    local_file_path=file_path,
                    remote_directory="/to_be_design",
                    remote_filename=unique_filename
                )
                pass
            except Exception as ftp_error:
                pass
        
        return jsonify({
            "success": True,
            "filename": unique_filename,
            "filePath": relative_path,
            "mimeType": mime_type,
            "fileSize": file_size
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": f"File upload failed: {str(e)}"}), 500


@process_registration_bp.route('/api/process-registration', methods=['POST'])
@token_required
def insert_process_registration(user_id, user_name):
    """
    Insert a new process registration.
    Calls santova.InsertProcessRegistration stored procedure.
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
        department = data.get('Department')  # ✅ NEW PARAMETER
        
        # Validate required fields
        if not title:
            return jsonify({"success": False, "message": "Title is required"}), 400
        
        # Clean and validate file paths - preserve file extension
        # Convert empty strings to None for proper NULL handling in database
        if sampledata_path:
            sampledata_path = str(sampledata_path).strip()
            if not sampledata_path or sampledata_path == '':
                sampledata_path = None
            else:
                # Clean malformed paths while preserving file extension
                if ' ' in sampledata_path:
                    parts = sampledata_path.split()
                    for part in parts:
                        if part.startswith('process_registration/'):
                            sampledata_path = part
                            break
                    else:
                        first_part = parts[0] if parts else sampledata_path
                        # Preserve extension when constructing path
                        if '/' not in first_part:
                            # If it's just a filename, secure it and add to path
                            sampledata_path = f"process_registration/{secure_filename(first_part)}"
                        else:
                            # If it's already a path, use it as-is (should have extension)
                            sampledata_path = first_part
                
                # Ensure proper format - preserve extension
                if not sampledata_path.startswith('process_registration/'):
                    if sampledata_path.startswith('uploads/'):
                        sampledata_path = sampledata_path.replace('uploads/', '', 1).lstrip('/')
                    else:
                        # Extract filename with extension, secure it, and rebuild path
                        filename_with_ext = os.path.basename(sampledata_path) if '/' in sampledata_path else sampledata_path
                        # Ensure filename has extension
                        if '.' not in filename_with_ext:
                            current_app.logger.warning(f"Sample data path missing extension: {sampledata_path}")
                        sampledata_path = f"process_registration/{secure_filename(filename_with_ext)}"
                
                # Final validation: ensure path has extension
                if sampledata_path and '.' not in os.path.basename(sampledata_path):
                    current_app.logger.error(f"Sample data path stored without extension: {sampledata_path}")
        else:
            sampledata_path = None
        
        if sop_doc:
            original_sop_doc = sop_doc  # Keep original for logging
            sop_doc = str(sop_doc).strip()
            if not sop_doc or sop_doc == '':
                sop_doc = None
            else:
                # Clean malformed paths while preserving file extension
                if ' ' in sop_doc:
                    parts = sop_doc.split()
                    for part in parts:
                        if part.startswith('process_registration/'):
                            sop_doc = part
                            break
                    else:
                        first_part = parts[0] if parts else sop_doc
                        # Preserve extension when constructing path
                        if '/' not in first_part:
                            # If it's just a filename, secure it and add to path
                            sop_doc = f"process_registration/{secure_filename(first_part)}"
                        else:
                            # If it's already a path, use it as-is (should have extension)
                            sop_doc = first_part
                
                # Ensure proper format - preserve extension
                if not sop_doc.startswith('process_registration/'):
                    if sop_doc.startswith('uploads/'):
                        sop_doc = sop_doc.replace('uploads/', '', 1).lstrip('/')
                        # Ensure it starts with process_registration/
                        if not sop_doc.startswith('process_registration/'):
                            filename_with_ext = os.path.basename(sop_doc)
                            sop_doc = f"process_registration/{filename_with_ext}"
                    else:
                        # Extract filename with extension, secure it, and rebuild path
                        filename_with_ext = os.path.basename(sop_doc) if '/' in sop_doc else sop_doc
                        # Ensure filename has extension
                        if '.' not in filename_with_ext:
                            current_app.logger.warning(f"SOP doc path missing extension. Original: {original_sop_doc}, Processed: {sop_doc}")
                        sop_doc = f"process_registration/{secure_filename(filename_with_ext)}"
                
                # Final validation: ensure path has extension
                final_basename = os.path.basename(sop_doc)
                if sop_doc and '.' not in final_basename:
                    current_app.logger.error(f"CRITICAL: SOP doc path stored without extension! Original: {original_sop_doc}, Final: {sop_doc}")
                else:
                    current_app.logger.info(f"SOP doc path stored with extension: {sop_doc} (extension: {final_basename.split('.')[-1] if '.' in final_basename else 'NONE'})")
        else:
            sop_doc = None
        
        # Convert empty strings to None for MIME types
        mime_type = mime_type if mime_type and str(mime_type).strip() else None
        sop_mimetype = sop_mimetype if sop_mimetype and str(sop_mimetype).strip() else None
        
        conn = connect_to_database()
        cursor = conn.cursor()
        
        # Prepare parameters - ensure None for NULL values
        params = (
            title,
            description if description else None,
            priority if priority else None,
            expected_roi if expected_roi else None,
            stakeholder if stakeholder else None,
            tag if tag else None,
            sampledata_path,  # Can be None
            mime_type,  # Can be None
            sop_doc,  # Can be None
            sop_mimetype,  # Can be None
            department if department else None,
            user_id
        )
        
        cursor.execute(
            f"EXEC {DBSCHEMA}.InsertProcessRegistration "
            "@Title = %s, @Description = %s, @Priority = %s, @ExpectedROI = %s, "
            "@Stakeholder = %s, @Tag = %s, @SampledataPath = %s, @MimeType = %s, "
            "@SopDoc = %s, @SopMimetype = %s, @Department = %s, @LoggedInUserId = %s",
            params
        )
        
        result = cursor.fetchall()
        conn.commit()
        
        # Verify the data was stored correctly
        if result:
            columns = [column[0] for column in cursor.description]
            process_dict = dict(zip(columns, result[0]))
            
            # Convert datetime objects to ISO format strings for consistent timezone handling
            process_dict = format_datetime_for_json(process_dict)
            return jsonify({"success": True, "process": process_dict}), 200
        else:
            return jsonify({"success": False, "message": "Failed to insert process registration"}), 500
            
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "message": f"Error inserting process registration: {str(e)}"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@process_registration_bp.route('/api/initial-triage', methods=['POST'])
@token_required
def insert_initial_triage(user_id, user_name):
    """
    Insert initial triage stage data.
    Calls santova.InsertInitialTriage stored procedure.
    """
    conn = None
    cursor = None
    
    try:
        DBSCHEMA = get_db_schema()
        data = request.get_json()
        
        # Extract parameters
        process_id = data.get('ProcessId')
        is_rule_based = data.get('IsRuleBased')
        is_stable = data.get('IsStable')
        systems_involved = data.get('SystemsInvolved')
        blockers = data.get('Blockers')
        estimated_automation_percent = data.get('EstimatedAutomationPercent')
        
        # Validate required fields
        if process_id is None:
            return jsonify({"success": False, "message": "ProcessId is required"}), 400
        if is_rule_based is None:
            return jsonify({"success": False, "message": "IsRuleBased is required"}), 400
        if is_stable is None:
            return jsonify({"success": False, "message": "IsStable is required"}), 400
        
        conn = connect_to_database()
        cursor = conn.cursor()
        
        # Execute stored procedure
        cursor.execute(
            f"EXEC {DBSCHEMA}.InsertInitialTriage "
            "@ProcessId = %s, @IsRuleBased = %s, @IsStable = %s, @SystemsInvolved = %s, "
            "@Blockers = %s, @EstimatedAutomationPercent = %s, @LoggedInUserId = %s",
            (process_id, is_rule_based, is_stable, systems_involved, blockers,
             estimated_automation_percent, user_id)
        )
        
        result = cursor.fetchall()
        conn.commit()
        
        # Format result as dictionary
        if result:
            columns = [column[0] for column in cursor.description]
            triage_dict = dict(zip(columns, result[0]))
            # Convert datetime objects to ISO format strings for consistent timezone handling
            triage_dict = format_datetime_for_json(triage_dict)
            return jsonify({"success": True, "triage": triage_dict}), 200
        else:
            return jsonify({"success": False, "message": "Failed to insert initial triage"}), 500
            
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error inserting initial triage: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@process_registration_bp.route('/api/system-integration', methods=['POST'])
@token_required
def insert_system_integration(user_id, user_name):
    """
    Insert system integration stage data.
    Calls santova.InsertSystemIntegration stored procedure.
    """
    conn = None
    cursor = None
    
    try:
        DBSCHEMA = get_db_schema()
        data = request.get_json()
        
        # Extract parameters
        process_id = data.get('ProcessId')
        credentials = data.get('Credentials')
        notes = data.get('Notes')
        
        # Validate required fields
        if process_id is None:
            return jsonify({"success": False, "message": "ProcessId is required"}), 400
        
        conn = connect_to_database()
        cursor = conn.cursor()
        
        # Execute stored procedure
        cursor.execute(
            f"EXEC {DBSCHEMA}.InsertSystemIntegration "
            "@ProcessId = %s, @Credentials = %s, @Notes = %s, @LoggedInUserId = %s",
            (process_id, credentials, notes, user_id)
        )
        
        result = cursor.fetchall()
        conn.commit()
        
        # Format result as dictionary
        if result:
            columns = [column[0] for column in cursor.description]
            integration_dict = dict(zip(columns, result[0]))
            # Convert datetime objects to ISO format strings for consistent timezone handling
            integration_dict = format_datetime_for_json(integration_dict)
            return jsonify({"success": True, "integration": integration_dict}), 200
        else:
            return jsonify({"success": False, "message": "Failed to insert system integration"}), 500
            
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error inserting system integration: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@process_registration_bp.route('/api/to-be-design', methods=['POST'])
@token_required
def insert_to_be_design(user_id, user_name):
    """
    Insert to-be design stage data.
    Files must be uploaded via multipart/form-data.
    File paths are created ONLY by save_uploaded_file() - never from frontend JSON.
    """

    conn = None
    cursor = None

    try:
        DBSCHEMA = get_db_schema()

        # 🔹 Use multipart/form-data
        process_id_str = request.form.get("ProcessId")
        credentials = request.form.get("Credentials")
        virtual_machine = request.form.get("VirtualMachine")
        logging_info = request.form.get("LoggingRequirements") or request.form.get("LoggingInfo")

        workflow_file = request.files.get("WorkflowFile")
        exception_file = request.files.get("ExceptionFile")

        if not process_id_str:
            return jsonify({"success": False, "message": "ProcessId is required"}), 400

        # Convert process_id to integer for database
        try:
            process_id = int(process_id_str)
        except (ValueError, TypeError):
            return jsonify({"success": False, "message": "ProcessId must be a valid number"}), 400

        from app.file_storage import save_uploaded_file

        workflow_file_name = None
        workflow_file_path = None
        exception_file_name = None
        exception_file_path = None

        # ✅ Workflow upload
        if workflow_file:
            try:
                workflow_data = save_uploaded_file(
                    workflow_file,
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

        # ✅ Exception upload
        if exception_file:
            try:
                exception_data = save_uploaded_file(
                    exception_file,
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

        # Log values before sending to stored procedure
        current_app.logger.info(
            f"InsertToBeDesign - ProcessId: {process_id}, "
            f"WorkflowFile: {workflow_file_name}, WorkflowFilePath: {workflow_file_path}, "
            f"ExceptionFile: {exception_file_name}, ExceptionFilePath: {exception_file_path}"
        )

        cursor.execute(
            f"""
            EXEC {DBSCHEMA}.InsertToBeDesign
                @ProcessId = %s,
                @WorkflowFile = %s,
                @WorkflowFilePath = %s,
                @ExceptionFile = %s,
                @ExceptionFilePath = %s,
                @Credentials = %s,
                @VirtualMachine = %s,
                @LoggingInfo = %s,
                @LoggedInUserId = %s
            """,
            (
                process_id,
                workflow_file_name,
                workflow_file_path,
                exception_file_name,
                exception_file_path,
                credentials,
                virtual_machine,
                logging_info,
                user_id
            )
        )

        result = cursor.fetchall()
        
        # Get the D_id from the result - try multiple ways
        d_id = None
        if result and cursor.description:
            try:
                columns = [column[0] for column in cursor.description]
                design_dict = dict(zip(columns, result[0]))
                d_id = design_dict.get('D_id') or design_dict.get('D_Id') or design_dict.get('DId')
                current_app.logger.info(f"Extracted D_id from stored procedure result: {d_id}")
            except (TypeError, IndexError) as e:
                current_app.logger.warning(f"Could not extract D_id from stored procedure result: {str(e)}")
        
        # If D_id not in result, get it from database using process_id
        if not d_id:
            cursor.execute(
                f"SELECT TOP 1 D_id FROM {DBSCHEMA}.ToBeDesign WHERE process_id = %s AND IsDeleted = 0 ORDER BY D_id DESC",
                (process_id,)
            )
            d_id_result = cursor.fetchone()
            if d_id_result:
                d_id = d_id_result[0]
                current_app.logger.info(f"Retrieved D_id from database: {d_id}")
        
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
        
        conn.commit()

        # Always re-fetch the record to return the latest data with corrected paths
        if d_id:
            cursor.execute(
                f"SELECT * FROM {DBSCHEMA}.ToBeDesign WHERE D_id = %s",
                (d_id,)
            )
            updated_row = cursor.fetchone()
            if updated_row and cursor.description:
                columns = [column[0] for column in cursor.description]
                design_dict = dict(zip(columns, updated_row))
                design_dict = format_datetime_for_json(design_dict)
                return jsonify({"success": True, "design": design_dict}), 200
        
        # Fallback to original result if re-fetch fails
        if result and cursor.description:
            try:
                columns = [column[0] for column in cursor.description]
                design_dict = dict(zip(columns, result[0]))
                design_dict = format_datetime_for_json(design_dict)
                return jsonify({"success": True, "design": design_dict}), 200
            except (TypeError, IndexError):
                pass
        
        # If we have d_id but couldn't fetch, still return success
        if d_id:
            return jsonify({"success": True, "message": "To-be design stage created successfully", "D_id": d_id}), 200

        return jsonify({"success": False, "message": "Insert failed - could not retrieve created record"}), 500

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@process_registration_bp.route('/api/uat-stage', methods=['POST'])
@token_required
def insert_uat_stage(user_id, user_name):
    """
    Track User Acceptance Testing (HWF) stage status.
    Calls ICAT.InsertUATStage stored procedure.
    """
    conn = None
    cursor = None
    
    try:
        DBSCHEMA = get_db_schema()
        data = request.get_json()
        
        # Extract parameters
        process_id = data.get('ProcessId')
        
        # Validate required fields
        if process_id is None:
            return jsonify({"success": False, "message": "ProcessId is required"}), 400
        
        conn = connect_to_database()
        cursor = conn.cursor()
        
        # Execute stored procedure
        cursor.execute(
            f"EXEC {DBSCHEMA}.InsertUATStage "
            "@ProcessId = %s, @LoggedInUserId = %s",
            (process_id, user_id)
        )
        
        result = cursor.fetchall()
        conn.commit()
        
        # Get message from stored procedure result
        if result:
            message = result[0][0] if result[0] else 'Process is now in the User Acceptance Testing (HWF) phase.'
            return jsonify({"success": True, "message": message}), 200
        else:
            return jsonify({"success": True, "message": "Process is now in the User Acceptance Testing (HWF) phase."}), 200
            
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error tracking UAT stage: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@process_registration_bp.route('/api/go-live-stage', methods=['POST'])
@token_required
def insert_go_live_stage(user_id, user_name):
    """
    Track Go-Live & Deployment (HWF) stage status.
    Calls ICAT.InsertGoLiveStage stored procedure.
    """
    conn = None
    cursor = None
    
    try:
        DBSCHEMA = get_db_schema()
        data = request.get_json()
        
        # Extract parameters
        process_id = data.get('ProcessId')
        
        # Validate required fields
        if process_id is None:
            return jsonify({"success": False, "message": "ProcessId is required"}), 400
        
        conn = connect_to_database()
        cursor = conn.cursor()
        
        # Execute stored procedure
        cursor.execute(
            f"EXEC {DBSCHEMA}.InsertGoLiveStage "
            "@ProcessId = %s, @LoggedInUserId = %s",
            (process_id, user_id)
        )
        
        result = cursor.fetchall()
        conn.commit()
        
        # Get message from stored procedure result
        if result:
            message = result[0][0] if result[0] else 'Process is now in the Go-Live & Deployment (HWF) phase.'
            return jsonify({"success": True, "message": message}), 200
        else:
            return jsonify({"success": True, "message": "Process is now in the Go-Live & Deployment (HWF) phase."}), 200
            
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error tracking Go-Live stage: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@process_registration_bp.route('/api/hypercare-stage', methods=['POST'])
@token_required
def insert_hypercare_stage(user_id, user_name):
    """
    Track Hypercare & Stabilization (HWF) stage status.
    Calls ICAT.InsertHypercareStage stored procedure.
    """
    conn = None
    cursor = None
    
    try:
        DBSCHEMA = get_db_schema()
        data = request.get_json()
        
        # Extract parameters
        process_id = data.get('ProcessId')
        
        # Validate required fields
        if process_id is None:
            return jsonify({"success": False, "message": "ProcessId is required"}), 400
        
        conn = connect_to_database()
        cursor = conn.cursor()
        
        # Execute stored procedure
        cursor.execute(
            f"EXEC {DBSCHEMA}.InsertHypercareStage "
            "@ProcessId = %s, @LoggedInUserId = %s",
            (process_id, user_id)
        )
        
        result = cursor.fetchall()
        conn.commit()
        
        # Get message from stored procedure result
        if result:
            message = result[0][0] if result[0] else 'Process is now in the Hypercare & Stabilization (HWF) phase.'
            return jsonify({"success": True, "message": message}), 200
        else:
            return jsonify({"success": True, "message": "Process is now in the Hypercare & Stabilization (HWF) phase."}), 200
            
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error tracking Hypercare stage: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@process_registration_bp.route('/api/handover-stage', methods=['POST'])
@token_required
def insert_handover_stage(user_id, user_name):
    """
    Track Handover to BAU Support stage status.
    Calls ICAT.InsertHandoverToBAUStage stored procedure.
    """
    conn = None
    cursor = None
    
    try:
        DBSCHEMA = get_db_schema()
        data = request.get_json()
        
        # Extract parameters
        process_id = data.get('ProcessId')
        
        # Validate required fields
        if process_id is None:
            return jsonify({"success": False, "message": "ProcessId is required"}), 400
        
        conn = connect_to_database()
        cursor = conn.cursor()
        
        # Execute stored procedure
        cursor.execute(
            f"EXEC {DBSCHEMA}.InsertHandoverToBAUStage "
            "@ProcessId = %s, @LoggedInUserId = %s",
            (process_id, user_id)
        )
        
        result = cursor.fetchall()
        conn.commit()
        
        # Get message from stored procedure result
        if result:
            message = result[0][0] if result[0] else 'Process is now in the Handover to BAU Support phase.'
            return jsonify({"success": True, "message": message}), 200
        else:
            return jsonify({"success": True, "message": "Process is now in the Handover to BAU Support phase."}), 200
            
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error tracking Handover stage: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@process_registration_bp.route('/api/approval-stage', methods=['POST'])
@token_required
def insert_approval_stage(user_id, user_name):
    """
    Create or update an approval stage.
    If the approval stage doesn't exist, it will be created.
    Then it will be updated with the provided approval data.
    """
    conn = None
    cursor = None
    
    try:
        DBSCHEMA = get_db_schema()
        data = request.get_json()
        
        process_id = data.get('ProcessId')
        if not process_id:
            return jsonify({"success": False, "message": "ProcessId is required"}), 400
        
        business_owner_approval = data.get('BusinessOwnerApproval')
        bo_approval_note = data.get('BO_ApprovalNote')
        rpa_approval = data.get('RPA_Approval')
        rpa_approval_note = data.get('RPA_ApprovalNote')
        
        conn = connect_to_database()
        cursor = conn.cursor()
        
        # Check if ApprovalStage exists
        cursor.execute(
            f"SELECT TOP 1 A_id FROM {DBSCHEMA}.ApprovalStage "
            "WHERE process_id = %s AND IsDeleted = 0 ORDER BY A_id DESC",
            (process_id,)
        )
        approval_result = cursor.fetchone()
        a_id = None
        
        if not approval_result:
            # Create ApprovalStage record if it doesn't exist
            cursor.execute(
                f"EXEC {DBSCHEMA}.InsertApprovalStage "
                "@ProcessId = %s, @BusinessOwnerApproval = 0, @RPA_Approval = 0, "
                "@BO_ApprovalNote = NULL, @RPA_ApprovalNote = NULL, @LoggedInUserId = %s",
                (process_id, user_id)
            )
            # Get the newly created A_id
            cursor.execute(
                f"SELECT TOP 1 A_id FROM {DBSCHEMA}.ApprovalStage "
                "WHERE process_id = %s AND IsDeleted = 0 ORDER BY A_id DESC",
                (process_id,)
            )
            approval_result = cursor.fetchone()
            if approval_result:
                a_id = approval_result[0]
        else:
            a_id = approval_result[0]
        
        if not a_id:
            return jsonify({"success": False, "message": "Failed to create or find approval stage"}), 500
        
        # Fetch current approval values to preserve the one not being updated
        cursor.execute(
            f"SELECT BusinessOwnerApproval, RPA_Approval, ApprovalNeedsReview, BO_ApprovalNote, RPA_ApprovalNote FROM {DBSCHEMA}.ApprovalStage WHERE A_id = %s AND IsDeleted = 0",
            (a_id,)
        )
        current_approval_result = cursor.fetchone()
        current_bo_approval = None
        current_rpa_approval = None
        current_bo_note = None
        current_rpa_note = None
        
        if current_approval_result:
            current_bo_approval = current_approval_result[0]
            current_rpa_approval = current_approval_result[1]
            current_bo_note = current_approval_result[3] if len(current_approval_result) > 3 else None
            current_rpa_note = current_approval_result[4] if len(current_approval_result) > 4 else None
        
        # Only update the approval that was explicitly provided
        # CRITICAL: Pass NULL to stored procedure for fields we don't want to update
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
        
        # Update approval stage using stored procedure
        sp_params = (
            a_id,
            process_id,
            final_bo_approval,
            final_bo_note,
            None,  # BO_approval_status
            final_rpa_approval,
            final_rpa_note,
            None,  # RPA_approval_status
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
        stage_transition = None
        if result and cursor.description:
            columns = [column[0] for column in cursor.description]
            approval_dict = dict(zip(columns, result[0]))
            approval_dict = format_datetime_for_json(approval_dict)
            
            # Get the updated approval values
            bo_value_after = approval_dict.get('BusinessOwnerApproval')
            rpa_value_after = approval_dict.get('RPA_Approval')
            
            # Check if both approvals are completed
            bo_approved = (bo_value_after == 1 or bo_value_after is True or bo_value_after == "1" or str(bo_value_after) == "1")
            rpa_approved = (rpa_value_after == 1 or rpa_value_after is True or rpa_value_after == "1" or str(rpa_value_after) == "1")
            both_completed = bo_approved and rpa_approved
            
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
            
            conn.commit()
            
            response_data = {
                "success": True,
                "approval": approval_dict
            }
            if stage_transition:
                response_data["stageTransition"] = stage_transition
            
            return jsonify(response_data), 200
        else:
            conn.commit()
            return jsonify({
                "success": True,
                "message": "Approval stage created/updated successfully"
            }), 200
            
    except Exception as e:
        if conn:
            conn.rollback()
        current_app.logger.error(f"Error creating/updating approval stage: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@process_registration_bp.route('/api/stage-tracking/complete', methods=['PUT'])
@token_required
def update_stage_tracking_completed(user_id, user_name):
    """
    Update stage tracking status to Completed.
    Calls santova.UpdateStageTrackingCompleted stored procedure.
    """
    conn = None
    cursor = None
    
    try:
        DBSCHEMA = get_db_schema()
        data = request.get_json()
        
        # Extract parameters
        process_id = data.get('ProcessId')
        stage_name = data.get('StageName')
        
        # Validate required fields
        if process_id is None:
            return jsonify({"success": False, "message": "ProcessId is required"}), 400
        if not stage_name:
            return jsonify({"success": False, "message": "StageName is required"}), 400
        
        conn = connect_to_database()
        cursor = conn.cursor()
        
        # Execute stored procedure
        cursor.execute(
            f"EXEC {DBSCHEMA}.UpdateStageTrackingCompleted "
            "@ProcessId = %s, @StageName = %s, @MovedBy = %s",
            (process_id, stage_name, user_id)
        )
        
        conn.commit()
        
        return jsonify({"success": True, "message": "Stage tracking updated to Completed"}), 200
            
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error updating stage tracking: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@process_registration_bp.route('/api/get-next-stage/<int:process_id>', methods=['GET'])
@token_required
def get_next_stage(user_id, user_name, process_id):
    """
    Get the next stage for a process from StageMaster.
    Returns the next stage name based on the current stage from StageTracking.
    """
    conn = None
    cursor = None
    
    try:
        DBSCHEMA = get_db_schema()
        
        conn = connect_to_database()
        cursor = conn.cursor()
        
        # Get current incomplete stage from StageTracking
        # Find the most recent stage that is NOT completed (Status != 'Completed' or Status IS NULL)
        cursor.execute(
            f"""
            SELECT TOP 1 stage_name, Status
            FROM {DBSCHEMA}.StageTracking 
            WHERE process_id = %s 
            AND (Status IS NULL OR Status != 'Completed')
            ORDER BY ST_id DESC
            """,
            (process_id,)
        )
        incomplete_stage_result = cursor.fetchone()
        
        if incomplete_stage_result:
            current_stage = incomplete_stage_result[0]
            print(f"Current incomplete stage from StageTracking: {current_stage}")
        else:
            # If all stages are completed, get the most recent stage to determine what's next
            cursor.execute(
                f"""
                SELECT TOP 1 stage_name
                FROM {DBSCHEMA}.StageTracking 
                WHERE process_id = %s 
                ORDER BY ST_id DESC
                """,
                (process_id,)
            )
            last_stage_result = cursor.fetchone()
            if last_stage_result:
                current_stage = last_stage_result[0]
            else:
                # If no stage tracking exists, default to "Process Registration"
                current_stage = "Process Registration"
        
        # Get next stage from StageMaster
        cursor.execute(
            f"""
            SELECT NextStageName 
            FROM {DBSCHEMA}.StageMaster 
            WHERE StageName = %s
            """,
            (current_stage,)
        )
        next_stage_result = cursor.fetchone()
        
        if next_stage_result and next_stage_result[0]:
            next_stage = next_stage_result[0]
        else:
            # If no next stage found, return null (process is at final stage)
            next_stage = None
        
        return jsonify({
            "success": True,
            "currentStage": current_stage,
            "nextStage": next_stage
        }), 200
            
    except Exception as e:
        print(f"Error getting next stage: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@process_registration_bp.route('/api/get-all-process-stages-detail/<int:process_id>', methods=['GET'])
@token_required
def get_process_registration_detail(user_id, user_name, process_id):
    """
    Get detailed process registration data with all stages.
    Calls separate stored procedures for each stage.
    Returns complete data including all stage information.
    """
    conn = None
    cursor = None
    
    try:
        DBSCHEMA = get_db_schema()
        
        conn = connect_to_database()
        cursor = conn.cursor()
        
        # 1. Get main process registration data
        cursor.execute(
            f"EXEC {DBSCHEMA}.GetProcessRegistrationById @ProcessId = %s",
            (process_id,)
        )
        process_result = cursor.fetchall()
        if not process_result:
            return jsonify({"success": False, "message": "Process registration not found"}), 404
        
        columns = [column[0] for column in cursor.description]
        process_dict = dict(zip(columns, process_result[0]))
        # Convert datetime objects to ISO format strings
        process_dict = format_datetime_for_json(process_dict)
        
        # 2. Get Initial Triage data
        cursor.execute(
            f"EXEC {DBSCHEMA}.GetInitialTriageByProcessId @ProcessId = %s",
            (process_id,)
        )
        triage_result = cursor.fetchall()
        triage_data = None
        if triage_result:
            triage_columns = [column[0] for column in cursor.description]
            triage_data = dict(zip(triage_columns, triage_result[0]))
            # Convert datetime objects to ISO format strings
            triage_data = format_datetime_for_json(triage_data)
            # Debug: Log triage data to help diagnose frontend mapping issues
        
        # 3. Get System Integration data
        cursor.execute(
            f"EXEC {DBSCHEMA}.GetSystemIntegrationByProcessId @ProcessId = %s",
            (process_id,)
        )
        integration_result = cursor.fetchall()
        integration_data = None
        if integration_result:
            integration_columns = [column[0] for column in cursor.description]
            integration_data = dict(zip(integration_columns, integration_result[0]))
            # Convert datetime objects to ISO format strings
            integration_data = format_datetime_for_json(integration_data)
            # Debug: Log integration data to help diagnose frontend mapping issues
        
        # 4. Get To-Be Design data
        cursor.execute(
            f"EXEC {DBSCHEMA}.GetToBeDesignByProcessId @ProcessId = %s",
            (process_id,)
        )
        design_result = cursor.fetchall()
        design_data = None
        if design_result:
            design_columns = [column[0] for column in cursor.description]
            design_data = dict(zip(design_columns, design_result[0]))
            # Convert datetime objects to ISO format strings
            design_data = format_datetime_for_json(design_data)
            # Debug: Log actual column names returned by stored procedure
        
        # 5. Get Approval Stage data
        cursor.execute(
            f"EXEC {DBSCHEMA}.GetApprovalStageByProcessId @ProcessId = %s",
            (process_id,)
        )
        approval_result = cursor.fetchall()
        approval_data = None
        if approval_result:
            approval_columns = [column[0] for column in cursor.description]
            approval_data = dict(zip(approval_columns, approval_result[0]))
            # Convert datetime objects to ISO format strings
            approval_data = format_datetime_for_json(approval_data)
            
            # Debug: Log approval data to help diagnose frontend mapping issues
        
        # 6. Get Development Stage data
        cursor.execute(
            f"EXEC {DBSCHEMA}.GetDevelopmentByProcessId @ProcessId = %s",
            (process_id,)
        )
        development_result = cursor.fetchall()
        development_data = None
        if development_result:
            development_columns = [column[0] for column in cursor.description]
            development_data = dict(zip(development_columns, development_result[0]))
            # Convert datetime objects to ISO format strings
            development_data = format_datetime_for_json(development_data)
        
        # 7. Get the current incomplete stage from StageTracking
        # Find the most recent stage that is NOT completed (Status != 'Completed' or Status IS NULL)
        cursor.execute(
            f"""
            SELECT TOP 1 stage_name, Status
            FROM {DBSCHEMA}.StageTracking 
            WHERE process_id = %s 
            AND (Status IS NULL OR Status != 'Completed')
            ORDER BY ST_id DESC
            """,
            (process_id,)
        )
        incomplete_stage_result = cursor.fetchone()
        
        current_stage = None
        if incomplete_stage_result:
            current_stage = incomplete_stage_result[0]
        else:
            # If all stages are completed, get the most recent stage to determine what's next
            cursor.execute(
                f"""
                SELECT TOP 1 stage_name
                FROM {DBSCHEMA}.StageTracking 
                WHERE process_id = %s 
                ORDER BY ST_id DESC
                """,
                (process_id,)
            )
            last_stage_result = cursor.fetchone()
            if last_stage_result:
                # Get the next stage from StageMaster
                last_stage = last_stage_result[0]
                cursor.execute(
                    f"""
                    SELECT NextStageName 
                    FROM {DBSCHEMA}.StageMaster 
                    WHERE StageName = %s
                    """,
                    (last_stage,)
                )
                next_stage_result = cursor.fetchone()
                if next_stage_result and next_stage_result[0]:
                    current_stage = next_stage_result[0]
                else:
                    # Process is complete, use the last completed stage
                    current_stage = last_stage
            else:
                # No stage tracking exists, default to "Process Registration"
                current_stage = "Process Registration"
        
        # Update the process_dict with the current incomplete stage from StageTracking
        # This ensures we use the actual incomplete stage, not what's in ProcessRegistration table
        if current_stage:
            process_dict['CurrentStage'] = current_stage
            print(f"Current incomplete stage from StageTracking: {current_stage}")
        
        return jsonify({
            "success": True,
            "process": process_dict,
            "stages": {
                "initialTriage": triage_data,
                "systemIntegration": integration_data,
                "toBeDesign": design_data,
                "approval": approval_data,
                "development": development_data
            },
            "currentStage": current_stage  # Explicitly return the current incomplete stage
        }), 200
            
    except Exception as e:
        print(f"Error getting process registration detail: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@process_registration_bp.route('/api/get-all-process-stages-summary', methods=['GET'])
@token_required
def get_all_process_summary(user_id, user_name):
    """
    Get all processes summary for card view.
    Calls santova.getAllProcessSummary stored procedure.
    Returns minimal data for displaying process cards in grid/list view.
    """
    conn = None
    cursor = None
    
    try:
        DBSCHEMA = get_db_schema()
        
        conn = connect_to_database()
        cursor = conn.cursor()
        
        # Execute stored procedure
        cursor.execute(f"EXEC {DBSCHEMA}.GetAllProcessSummary")
        
        result = cursor.fetchall()
        
        # Format results as list of dictionaries
        processes = []
        if result:
            columns = [column[0] for column in cursor.description]
            # Debug: Log column names to help identify date field (only once)
            for row in result:
                process_dict = dict(zip(columns, row))
                # Convert datetime objects to ISO format strings for consistent timezone handling
                process_dict = format_datetime_for_json(process_dict)
                # Debug: Log date field for first process only
                if len(processes) == 0:
                    date_fields = {k: v for k, v in process_dict.items() if 'date' in k.lower() or 'created' in k.lower() or 'at' in k.lower()}
                processes.append(process_dict)
        
        return jsonify({
            "success": True,
            "processes": processes,
            "count": len(processes)
        }), 200
            
    except Exception as e:
        print(f"Error getting all process summary: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


