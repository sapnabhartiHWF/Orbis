from flask import Blueprint, request, jsonify, current_app
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required
from app.utils.email_service import send_file_upload_notification
from app.file_management.ftp_utils import get_ftp_manager
import os
import re
from werkzeug.utils import secure_filename
from flask import send_file
from datetime import datetime

file_bp = Blueprint("file_bp", __name__)

UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
ALLOWED_EXTENSIONS = {
    # Documents
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt",

    # Images
    "jpg", "jpeg", "png", "gif", "bmp", "tiff", "svg","jfif",

    # Videos
    "mp4", "mov", "avi", "mkv", "webm",

    # Flowcharts / Design files
    "drawio", "vsdx", "svg", "xml", "psd", "ai", "flowchart", "diagram"
}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def get_process_name(DBSCHEMA, process_id):
    """
    Retrieves the process name (Company name) from ProcessID.
    Returns a sanitized folder-safe name.
    """
    if not process_id:
        return "Unassigned"
    
    conn = None
    cursor = None
    try:
        conn = connect_to_database()
        cursor = conn.cursor()
        
        cursor.execute(f"""
            SELECT Name 
            FROM {DBSCHEMA}.Company 
            WHERE CompanyId = %s
        """, (process_id,))
        
        result = cursor.fetchone()
        if result and result[0]:
            return sanitize_folder_name(result[0])
        else:
            return f"Process_{process_id}"
    
    except Exception as e:
        current_app.logger.error(f"Error fetching process name for ProcessID={process_id}: {str(e)}")
        return f"Process_{process_id}"
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def sanitize_folder_name(name):
    """
    Sanitizes a process name to be filesystem-safe.
    Removes or replaces invalid characters for folder names.
    """
    if not name:
        return "Unnamed"
    
    # Remove or replace invalid characters for Windows/Unix filesystems
    # Invalid: < > : " / \ | ? *
    sanitized = re.sub(r'[<>:"/\\|?*]', '_', name)
    
    # Remove leading/trailing spaces and dots (Windows doesn't allow trailing dots)
    sanitized = sanitized.strip('. ')
    
    # Replace multiple underscores/spaces with single underscore
    sanitized = re.sub(r'[_\s]+', '_', sanitized)
    
    # Limit length to avoid filesystem issues
    if len(sanitized) > 100:
        sanitized = sanitized[:100]
    
    # If empty after sanitization, use default
    if not sanitized:
        sanitized = "Unnamed"
    
    return sanitized

@file_bp.route("/api/file-management", methods=["POST"])
@token_required
def upload_file_route(user_id, user_name):
    """
    Uploads a file and saves metadata to DB
    """
    if "file" not in request.files:
        return jsonify({"success": False, "message": "No file uploaded"}), 400

    file = request.files["file"]
    process_id = request.form.get("ProcessID")
    description = request.form.get("Description")
    file_type = request.form.get("FileType")  # ✅ dropdown-selected type (e.g. Document, Image, Video, etc.)
    host = request.headers.get("Origin")
    DBSCHEMA = "santova"
    if host == "https://orbis-icat.alphalogix.tech":
        DBSCHEMA = "ICAT"
    if not file or file.filename == "":
        return jsonify({"success": False, "message": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"success": False, "message": "File type not allowed"}), 400

    filename = secure_filename(file.filename)
    file_format = filename.rsplit(".", 1)[1].lower()
    mime_type = file.content_type 
    file_size = len(file.read())
    file.seek(0)

    # Get process name and create folder structure: uploads/process_name/
    process_name = get_process_name(DBSCHEMA, process_id)
    process_folder = os.path.join(UPLOAD_FOLDER, process_name)
    os.makedirs(process_folder, exist_ok=True)
    file_path = os.path.join(process_folder, filename)
    file.save(file_path)

    # Upload to FTP server if configured (use schema-specific credentials and paths)
    ftp_upload_success = False
    ftp_message = ""
    ftp_manager = get_ftp_manager(DBSCHEMA)
    if ftp_manager:
        try:
            # Create FTP remote directory path using actual process name
            # Sanitize process name for FTP path
            ftp_process_name = sanitize_folder_name(process_name)
            
            # FTP structure uses process name directly (schema only determines which FTP credentials to use)
            remote_directory = f"/{ftp_process_name}"
            
            # Upload to FTP
            ftp_upload_success, ftp_message = ftp_manager.upload_file(
                local_file_path=file_path,
                remote_directory=remote_directory,
                remote_filename=filename
            )
            
            if ftp_upload_success:
                current_app.logger.info(f"File uploaded to FTP: {remote_directory}/{filename}")
            else:
                current_app.logger.warning(f"FTP upload failed: {ftp_message}")
        except Exception as ftp_error:
            # Log FTP error but don't fail the main upload
            current_app.logger.error(f"FTP upload error: {str(ftp_error)}")
            ftp_message = f"FTP upload error: {str(ftp_error)}"

    conn = connect_to_database()
    cursor = conn.cursor()

    try:
        cursor.execute(f"""
            EXEC {DBSCHEMA}.InsertFileData
                @UserID = %s,
                @ProcessID = %s,
                @FileName = %s,
                @FileType = %s, 
                @MimeType = %s,
                @FileSize = %s,
                @FileFormat = %s,
                @Description = %s,
                @FilePath = %s
        """, (
            user_id,
            process_id,
            filename,
            file_type,
            mime_type,
            file_size,
            file_format,
            description,
            file_path
        ))

        # ✅ Fetch output from SP (FileID + UploadedByName)
        result = cursor.fetchone()
        new_file_id = result[0] if result else None
        uploaded_by_name = result[1] if result and len(result) > 1 else user_name

        conn.commit()

        # Send email notification to Automation Engineers
        try:
            send_file_upload_notification(
                DBSCHEMA=DBSCHEMA,
                file_name=filename,
                process_name=process_name,
                uploaded_by=uploaded_by_name,
                file_type=file_type,
                file_size=file_size,
                description=description
            )
        except Exception as email_error:
            # Log email error but don't fail the upload
            current_app.logger.error(f"Failed to send email notification: {str(email_error)}")

        response_message = "File uploaded successfully"
        if ftp_upload_success:
            response_message += " (FTP upload successful)"
        elif ftp_manager:
            response_message += f" (FTP upload failed: {ftp_message})"

        return jsonify({
            "success": True,
            "message": response_message,
            "NewFileID": new_file_id,
            "UploadedByName": uploaded_by_name,
            "ftp_uploaded": ftp_upload_success
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


def get_files_from_db(DBSCHEMA, process_id=None, file_type=None):
    """
    Fetch all files from SP regardless of user.
    Returns files with triggerStatus field from SP.
    """
    conn = connect_to_database()
    cursor = conn.cursor()
    try:
        # SQL Server SP call - SP now returns triggerStatus
        sql = f"EXEC {DBSCHEMA}.GetFileData @ProcessID=%s, @UserID=%s, @FileType=%s"
        cursor.execute(sql, (process_id, None, file_type if file_type and file_type != 'all' else None))

        columns = [column[0] for column in cursor.description]
        # Debug: Log column names to help identify date field
        print(f"🔍 GetFileData columns: {columns}")
        rows = cursor.fetchall()
        files = []
        for row in rows:
            file_dict = dict(zip(columns, row))
            # Handle triggerStatus - convert to boolean for isTriggered
            if 'triggerStatus' in file_dict:
                file_dict['isTriggered'] = file_dict['triggerStatus'] == 'Triggered'
                file_dict['IsTriggered'] = file_dict['isTriggered']
            # Handle tags as list if present
            if file_dict.get('tags'):
                if isinstance(file_dict['tags'], str):
                    file_dict['tags'] = [tag.strip() for tag in file_dict['tags'].split(',') if tag.strip()]
            # CRITICAL: Convert datetime objects to ISO format strings with timezone
            # This ensures consistent date/time handling across timezones
            date_fields_found = {}
            for key, value in file_dict.items():
                if isinstance(value, datetime):
                    # SQL Server GETDATE() returns server local time (naive datetime)
                    # Preserve the exact time value by treating it as UTC
                    # This ensures the time displayed matches what's stored in the database
                    if value.tzinfo is None:
                        # Naive datetime from SQL Server - treat as UTC to preserve exact time
                        file_dict[key] = value.isoformat() + 'Z'
                    else:
                        # Already has timezone info
                        file_dict[key] = value.isoformat()
                    date_fields_found[key] = file_dict[key]
                elif isinstance(value, str) and any(term in key.lower() for term in ['date', 'created', 'uploaded', 'time', 'at']):
                    # Handle string dates - try to parse and convert to ISO format
                    # This handles cases where SQL Server returns dates as strings
                    try:
                        # Try to parse common SQL Server date formats
                        if value and value.strip():
                            # Check if it's already in ISO format
                            if 'T' in value or value.count('-') >= 2:
                                # Might be ISO or SQL Server format, ensure it has Z suffix
                                if not value.endswith('Z') and not ('+' in value or value.count(':') > 2):
                                    # Try to parse and reformat
                                    try:
                                        parsed_date = datetime.fromisoformat(value.replace('Z', '+00:00')) if 'Z' in value else datetime.fromisoformat(value)
                                        file_dict[key] = parsed_date.isoformat() + 'Z' if parsed_date.tzinfo is None else parsed_date.isoformat()
                                        date_fields_found[key] = file_dict[key]
                                    except:
                                        # If parsing fails, keep original but log
                                        if len(files) == 0:
                                            print(f"⚠️ Could not parse string date field {key}: {value}")
                            else:
                                # SQL Server datetime format like '2025-12-11 03:33:53.843' or '2024-01-01 12:00:00'
                                try:
                                    # Handle SQL Server datetime format with optional milliseconds
                                    # Format: YYYY-MM-DD HH:MM:SS[.mmm...]
                                    # Match SQL Server datetime format: YYYY-MM-DD HH:MM:SS.mmm or YYYY-MM-DD HH:MM:SS
                                    sql_datetime_pattern = r'^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})(?:\.(\d+))?$'
                                    match = re.match(sql_datetime_pattern, value.strip())
                                    if match:
                                        date_part = match.group(1)
                                        time_part = match.group(2)
                                        milliseconds = match.group(3) or '0'
                                        # Pad milliseconds to 6 digits for microseconds (Python datetime requirement)
                                        # SQL Server can return 1-7 digits, we need exactly 6 for microseconds
                                        milliseconds = milliseconds.ljust(6, '0')[:6]
                                        # Parse as: YYYY-MM-DDTHH:MM:SS.microseconds
                                        datetime_str = f"{date_part}T{time_part}.{milliseconds}"
                                        parsed_date = datetime.strptime(datetime_str, '%Y-%m-%dT%H:%M:%S.%f')
                                        # Convert to ISO format with Z suffix
                                        # Treating server time as UTC to preserve exact time value from database
                                        # GETDATE() returns server local time, but we preserve it as-is
                                        file_dict[key] = parsed_date.isoformat() + 'Z'
                                        date_fields_found[key] = file_dict[key]
                                        if len(files) == 0:
                                            print(f"✅ Parsed SQL Server datetime: {value} -> {file_dict[key]}")
                                    else:
                                        # Fallback to standard formats (without milliseconds)
                                        for fmt in ['%Y-%m-%d %H:%M:%S', '%Y-%m-%dT%H:%M:%S']:
                                            try:
                                                parsed_date = datetime.strptime(value, fmt)
                                                file_dict[key] = parsed_date.isoformat() + 'Z'
                                                date_fields_found[key] = file_dict[key]
                                                if len(files) == 0:
                                                    print(f"✅ Parsed datetime (fallback): {value} -> {file_dict[key]}")
                                                break
                                            except:
                                                continue
                                except Exception as parse_error:
                                    if len(files) == 0:
                                        print(f"⚠️ Error parsing SQL Server datetime '{value}': {parse_error}")
                                    pass
                    except Exception as e:
                        if len(files) == 0:
                            print(f"⚠️ Error processing string date field {key}: {e}")
            
            # Debug: Log ALL fields for first file to help identify date field
            if len(files) == 0:
                print(f"🔍 Sample file ALL fields: {file_dict}")
                print(f"🔍 Sample file ALL keys: {list(file_dict.keys())}")
                if date_fields_found:
                    print(f"🔍 Sample file date fields: {date_fields_found}")
                else:
                    # Check for date-like values that might not be datetime objects
                    date_like_fields = {k: v for k, v in file_dict.items() if any(term in k.lower() for term in ['date', 'created', 'uploaded', 'time', 'at'])}
                    if date_like_fields:
                        print(f"🔍 Sample file date-like fields (non-datetime): {date_like_fields}")
                    else:
                        print(f"⚠️ No date-like fields found in file data!")
                        print(f"⚠️ All available keys: {list(file_dict.keys())}")
            
            # Ensure at least one date field exists - use CreatedDate or UploadedDate if available
            # This helps frontend find the date even if field names vary
            if not any(k.lower() in ['uploadedat', 'uploaded_at', 'uploadeddate', 'createdat', 'created_at', 'createddate'] for k in file_dict.keys()):
                # Try to find any date field and map it to uploadedAt for frontend
                for key in file_dict.keys():
                    if any(term in key.lower() for term in ['date', 'created', 'uploaded', 'time']):
                        file_dict['uploadedAt'] = file_dict[key]
                        file_dict['UploadedAt'] = file_dict[key]
                        file_dict['UploadedDate'] = file_dict[key]
                        if len(files) == 0:
                            print(f"✅ Mapped date field '{key}' to uploadedAt/UploadedAt/UploadedDate")
                        break
            
            files.append(file_dict)

        return files

    except Exception as e:
        print("Error fetching files from DB:", e)
        raise e

    finally:
        cursor.close()
        conn.close()



def delete_file(DBSCHEMA, file_id: int, user_id: int):
    """
    Soft delete a file by setting IsDeleted = 1.
    Also deletes from FTP server if configured.
    Only the owner can delete.
    Returns (success: bool, message: str)
    """
    conn = None
    cursor = None
    try:
        conn = connect_to_database()
        cursor = conn.cursor()

        # First, get file info for FTP deletion
        cursor.execute(f"""
            SELECT FileName, FilePath, ProcessID
            FROM DB_A4EFFD_Hybridwf.{DBSCHEMA}.FileManagement
            WHERE FileID = %s AND IsDeleted = 0
        """, (file_id,))
        file_info = cursor.fetchone()

        # Execute the SP
        cursor.execute(
            f"EXEC {DBSCHEMA}.DeleteUploadedData @FileID=%s, @UserID=%s",
            (file_id, user_id)
        )

        # Fetch the SP result
        row = cursor.fetchone()
        conn.commit()

        if row:
            success = row[0] == 1
            message = row[1] if len(row) > 1 else "No message returned"
            
            # Delete from FTP server if file was successfully deleted from DB (use schema-specific credentials and paths)
            if success and file_info:
                ftp_manager = get_ftp_manager(DBSCHEMA)
                if ftp_manager:
                    try:
                        file_name, file_path, process_id = file_info
                        process_name = get_process_name(DBSCHEMA, process_id)
                        ftp_process_name = sanitize_folder_name(process_name)
                        
                        # FTP structure uses process name directly (schema only determines which FTP credentials to use)
                        remote_file_path = f"/{ftp_process_name}/{file_name}"
                        
                        ftp_success, ftp_msg = ftp_manager.delete_file(remote_file_path)
                        if ftp_success:
                            current_app.logger.info(f"File deleted from FTP: {remote_file_path}")
                        else:
                            current_app.logger.warning(f"FTP delete failed: {ftp_msg}")
                    except Exception as ftp_error:
                        current_app.logger.error(f"FTP delete error: {str(ftp_error)}")
            
            current_app.logger.info(f"DeleteFile SP response: {row}")
            return success, message
        else:
            current_app.logger.warning(f"No response from DeleteUploadedData for FileID={file_id}")
            return False, "Delete failed: no response from database"

    except Exception as e:
        current_app.logger.error(f"Error deleting file {file_id}: {str(e)}")
        return False, f"Delete failed: {str(e)}"

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()



# 🌐 ROUTES (JWT-Protected)

@file_bp.route('/api/uploaded-details', methods=['GET'])
@token_required  # ✅ Protect this route too
def get_files_route(user_id, user_name):
    """
    Fetch all files based on optional filters.
    Now returns triggerStatus from SP.
    """
    process_id_str = request.args.get('processId')
    file_type = request.args.get('fileType', 'all')
    folder_structure = request.args.get('folderStructure', 'false').lower() == 'true'
    host = request.headers.get("Origin")
    DBSCHEMA = "santova"
    if host == "https://orbis-icat.alphalogix.tech":
        DBSCHEMA = "ICAT"
    process_id = int(process_id_str) if process_id_str else None

    try:
        files = get_files_from_db(DBSCHEMA, process_id, file_type)

        # If folder structure is requested, organize files by process name
        if folder_structure:
            folder_structure_data = organize_files_by_process(DBSCHEMA, files)
            return jsonify({
                'success': True,
                'folderStructure': folder_structure_data,
                'files': files
            })
        else:
            return jsonify({
                'success': True,
                'files': files
            })

    except ValueError:
        return jsonify({'success': False, 'message': 'Invalid ProcessID format'}), 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


def organize_files_by_process(DBSCHEMA, files):
    """
    Organizes files into a folder structure based on process names.
    Returns a dictionary with process names as keys and their files as values.
    """
    folder_structure = {}
    
    for file_item in files:
        process_id = file_item.get('ProcessID') or file_item.get('processId')
        process_name = get_process_name(DBSCHEMA, process_id)
        
        if process_name not in folder_structure:
            folder_structure[process_name] = {
                'processName': process_name,
                'processId': process_id,
                'files': []
            }
        
        folder_structure[process_name]['files'].append(file_item)
    
    # Convert to list format for easier frontend consumption
    return list(folder_structure.values())


@file_bp.route('/api/files-folder-structure', methods=['GET'])
@token_required
def get_files_folder_structure_route(user_id, user_name):
    """
    Returns files organized in folder structure by process name.
    """
    file_type = request.args.get('fileType', 'all')
    host = request.headers.get("Origin")
    DBSCHEMA = "santova"
    if host == "https://orbis-icat.alphalogix.tech":
        DBSCHEMA = "ICAT"

    try:
        # Get all files (no process_id filter to get all processes)
        files = get_files_from_db(DBSCHEMA, None, file_type)
        
        # Organize by process name
        folder_structure = organize_files_by_process(DBSCHEMA, files)

        return jsonify({
            'success': True,
            'folderStructure': folder_structure
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@file_bp.route("/api/delete-uploaded-file", methods=["POST"])
@token_required
def delete_file_route(user_id, user_name):
    """
    Deletes a file. Only owner can delete.
    Returns proper HTTP status codes.
    """
    data = request.json
    file_id = data.get("FileID")
    host = request.headers.get("Origin")
    DBSCHEMA = "santova"
    if host == "https://orbis-icat.alphalogix.tech":
        DBSCHEMA = "ICAT"
    if not file_id:
        current_app.logger.warning("Delete request missing FileID")
        return jsonify({"Success": False, "Message": "FileID is required"}), 400

    # Ensure numeric
    try:
        file_id = int(file_id)
    except ValueError:
        return jsonify({"Success": False, "Message": "FileID must be numeric"}), 400

    success, message = delete_file(DBSCHEMA, file_id, user_id)

    # Return proper HTTP status based on success
    status_code = 200 if success else 403  # 403 Forbidden if not allowed
    current_app.logger.info(f"Delete request for FileID={file_id} by UserID={user_id} => {message}")
    return jsonify({"Success": success, "Message": message}), status_code

# download uploaded files

@file_bp.route("/api/download-file/<int:file_id>", methods=["GET"])
@token_required
def download_file_route(user_id, user_name, file_id):
    """
    Downloads a file from the uploads folder based on DB record.
    If local file doesn't exist, tries to download from FTP server.
    Uses full table path: DB_A4EFFD_Hybridwf.{DBSCHEMA}.FileManagement
    """
    host = request.headers.get("Origin")
    DBSCHEMA = "santova"
    if host == "https://orbis-icat.alphalogix.tech":
        DBSCHEMA = "ICAT"
    conn = connect_to_database()
    cursor = conn.cursor()
    try:
        # Use full table path matching the SP definition
        cursor.execute(f"""
            SELECT FileName, FileFormat, FilePath, ProcessID
            FROM DB_A4EFFD_Hybridwf.{DBSCHEMA}.FileManagement
            WHERE FileID = %s AND IsDeleted = 0
        """, (file_id,))
        file_row = cursor.fetchone()

        if not file_row:
            return jsonify({"success": False, "message": "File not found"}), 404

        file_name, file_format, file_path, process_id = file_row

        # Check if local file exists
        if not os.path.exists(file_path):
            # Try to download from FTP server (use schema-specific credentials and paths)
            ftp_manager = get_ftp_manager(DBSCHEMA)
            if ftp_manager:
                try:
                    process_name = get_process_name(DBSCHEMA, process_id)
                    ftp_process_name = sanitize_folder_name(process_name)
                    
                    # FTP structure uses process name directly (schema only determines which FTP credentials to use)
                    remote_file_path = f"/{ftp_process_name}/{file_name}"
                    
                    # Ensure local directory exists
                    local_dir = os.path.dirname(file_path)
                    if local_dir:
                        os.makedirs(local_dir, exist_ok=True)
                    
                    # Download from FTP
                    ftp_success, ftp_msg = ftp_manager.download_file(
                        remote_file_path=remote_file_path,
                        local_file_path=file_path
                    )
                    
                    if not ftp_success:
                        return jsonify({
                            "success": False,
                            "message": f"File missing from server and FTP download failed: {ftp_msg}"
                        }), 404
                    
                    current_app.logger.info(f"File downloaded from FTP: {remote_file_path}")
                except Exception as ftp_error:
                    current_app.logger.error(f"FTP download error: {str(ftp_error)}")
                    return jsonify({
                        "success": False,
                        "message": f"File missing from server and FTP download failed: {str(ftp_error)}"
                    }), 404
            else:
                return jsonify({"success": False, "message": "File missing from server"}), 404

        # Update download count using full table path
        cursor.execute(f"""
            UPDATE DB_A4EFFD_Hybridwf.{DBSCHEMA}.FileManagement
            SET DownloadCount = ISNULL(DownloadCount, 0) + 1
            WHERE FileID = %s
        """, (file_id,))
        conn.commit()

        return send_file(
            file_path,
            as_attachment=True,
            download_name=f"{file_name}.{file_format}",
            mimetype="application/octet-stream"
        )

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@file_bp.route("/api/trigger-file/<int:file_id>", methods=["POST"])
@token_required
def trigger_file_route(user_id, user_name, file_id):
    """
    Triggers a file by setting [Trigger] = 1 in the database.
    """
    host = request.headers.get("Origin")
    DBSCHEMA = "santova"
    if host == "https://orbis-icat.alphalogix.tech":
        DBSCHEMA = "ICAT"
    conn = connect_to_database()
    cursor = conn.cursor()
    try:
        # Check if file exists and is not deleted
        cursor.execute(f"""
            SELECT FileID, [Trigger]
            FROM DB_A4EFFD_Hybridwf.{DBSCHEMA}.FileManagement
            WHERE FileID = %s AND IsDeleted = 0
        """, (file_id,))
        file_row = cursor.fetchone()

        if not file_row:
            return jsonify({"success": False, "message": "File not found"}), 404

        # Update trigger status to 1
        cursor.execute(f"""
            UPDATE DB_A4EFFD_Hybridwf.{DBSCHEMA}.FileManagement
            SET [Trigger] = 1
            WHERE FileID = %s AND IsDeleted = 0
        """, (file_id,))
        conn.commit()

        return jsonify({
            "success": True,
            "message": "File triggered successfully"
        }), 200

    except Exception as e:
        conn.rollback()
        current_app.logger.error(f"Error triggering file {file_id}: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

