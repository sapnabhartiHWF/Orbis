from flask import Blueprint, request, jsonify, current_app
from app.Database.connection import connect_to_database
from app.databaseconnection import db_connect
from app.auth_middleware import token_required
from app.file_management.ftp_utils import get_ftp_manager
from app.utils.db_schema import get_db_schema
from app.db_schema_utils import get_bot_schema
import os
import re
import requests
import threading
from werkzeug.utils import secure_filename
from flask import send_file
from datetime import datetime
from app.utils.email_service import notify_automation_engineers_on_file_upload
from config import Config

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
    Retrieves the process name from ProcessID.
    First checks Company table, then ProcessOnboarding table.
    Returns a sanitized folder-safe name.
    """
    if not process_id:
        return "Unassigned"
    
    conn = None
    cursor = None
    try:
        conn = connect_to_database()
        cursor = conn.cursor()
        
        # First, try to get from Company table (for regular processes)
        cursor.execute(f"""
            SELECT Name 
            FROM {DBSCHEMA}.Company 
            WHERE CompanyId = %s
        """, (process_id,))
        
        result = cursor.fetchone()
        if result and result[0]:
            return sanitize_folder_name(result[0])
        
        # If not found in Company table, try ProcessOnboarding table (for onboarding processes)
        cursor.execute(f"""
            SELECT Name 
            FROM {DBSCHEMA}.ProcessOnboarding 
            WHERE Oid = %s
        """, (process_id,))
        
        result = cursor.fetchone()
        if result and result[0]:
            return sanitize_folder_name(result[0])
        
        # If still not found, return a default name
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
    sanitized = re.sub(r'[<>:"/\\|?*]', '_', name)
    sanitized = sanitized.strip('. ')
    sanitized = re.sub(r'[_\s]+', '_', sanitized)
    if len(sanitized) > 100:
        sanitized = sanitized[:100]
    if not sanitized:
        sanitized = "Unnamed"
    
    return sanitized

@file_bp.route("/api/process/<int:bot_id>/file-management", methods=["POST"])
@token_required
def upload_file_route(bot_id):
    user_id = request.user.get("UserId")
    user_name = request.user.get("UserName")

    if "file" not in request.files:
        return jsonify({"success": False, "message": "No file uploaded"}), 400

    file = request.files["file"]
    description = request.form.get("Description")
    file_type = request.form.get("FileType")
    
    # Determine which schema and database connection to use
    # get_bot_schema() returns "AirlineProcessHeaderDetail" for ICAT/localhost, "santova" for santova URL
    DBSCHEMA = get_bot_schema()
    
    # If schema is "santova", use connect_to_database() (DB_A4EFFD_Hybridwf)
    # Otherwise (AirlineProcessHeaderDetail), use db_connect() (db_Icat)
    use_db_connect = DBSCHEMA != "santova"

    if file.filename == "":
        return jsonify({"success": False, "message": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"success": False, "message": "File type not allowed"}), 400

    filename = secure_filename(file.filename)
    file_format = filename.rsplit(".", 1)[1].lower()
    mime_type = file.content_type or "application/octet-stream"
    file_size = request.content_length or len(file.read())
    file.seek(0)

    # ✅ Bot-based folder - get bot name from AirlineProcessHeaderDetail.Bots using db_connect()
    bot_name = None
    if use_db_connect:
        try:
            bot_conn = db_connect()
            if bot_conn:
                bot_cursor = bot_conn.cursor()
                bot_cursor.execute(f"""
                    SELECT Name 
                    FROM {DBSCHEMA}.Bots 
                    WHERE Bot_Id = %s AND IsDeleted = 0
                """, (bot_id,))
                bot_result = bot_cursor.fetchone()
                if bot_result and bot_result[0]:
                    bot_name = sanitize_folder_name(bot_result[0])
                bot_cursor.close()
                bot_conn.close()
        except Exception as e:
            current_app.logger.error(f"Error fetching bot name for Bot_Id={bot_id}: {str(e)}")
    
    process_name = bot_name or f"Bot_{bot_id}"
    process_folder = os.path.join(UPLOAD_FOLDER, process_name)
    os.makedirs(process_folder, exist_ok=True)

    file_path = os.path.join(process_folder, filename)
    file.save(file_path)

    # FTP upload - upload to FTP server synchronously to ensure it completes
    # For FTP credentials: use get_db_schema() to get "ICAT" or "santova"
    # (get_ftp_manager expects "ICAT" or "santova", not "AirlineProcessHeaderDetail")
    FTP_SCHEMA = get_db_schema()  # Returns "ICAT" for ICAT URL/localhost, "santova" for santova URL
    ftp_manager = get_ftp_manager(FTP_SCHEMA)
    ftp_path = None
    
    if ftp_manager:
        try:
            ftp_process_name = sanitize_folder_name(process_name)
            remote_directory = f"/{ftp_process_name}"
            current_app.logger.info(f"Starting FTP upload: local={file_path}, remote_dir={remote_directory}, filename={filename}")
            
            ftp_success, ftp_msg = ftp_manager.upload_file(
                local_file_path=file_path,
                remote_directory=remote_directory,
                remote_filename=filename
            )
            
            if ftp_success:
                ftp_path = f"{remote_directory}/{filename}".replace('//', '/')
                current_app.logger.info(f"FTP upload successful: {ftp_path}")
            else:
                # Log warning but continue - store local path as fallback
                current_app.logger.warning(f"FTP upload failed: {ftp_msg}. Storing local path instead.")
                ftp_path = None
        except Exception as e:
            # Log error but continue - store local path as fallback
            current_app.logger.error(f"FTP upload exception: {str(e)}. Storing local path instead.")
            ftp_path = None

    # Use appropriate database connection based on schema
    if use_db_connect:
        # For AirlineProcessHeaderDetail schema: use db_connect() (db_Icat database)
        conn = db_connect()
    else:
        # For santova schema: use connect_to_database() (DB_A4EFFD_Hybridwf database)
        conn = connect_to_database()
    
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
    
    cursor = conn.cursor()

    try:
        # Store FTP path if available, otherwise store local path
        path_to_store = ftp_path if ftp_path else file_path
        current_app.logger.info(f"Storing file path in database: {path_to_store} (FTP: {ftp_path is not None})")
        
        cursor.execute(f"""
            EXEC {DBSCHEMA}.InsertFileData
                @UserID=%s,
                @CreatedByName=%s,
                @Bot_Id=%s,
                @FileName=%s,
                @FileType=%s,
                @MimeType=%s,
                @FileSize=%s,
                @FileFormat=%s,
                @Description=%s,
                @FilePath=%s
        """, (
            user_id,
            user_name,
            bot_id,
            filename,
            file_type,
            mime_type,
            file_size,
            file_format,
            description,
            path_to_store
        ))

        row = cursor.fetchone()
        conn.commit()

        # Notify Automation Engineers about the new file upload
        try:
            # Use get_db_schema() (returns "ICAT" or "santova") instead of bot-specific schema (DBSCHEMA)
            # because the GetAutomationEngineerEmails SP lives in the central schema
            NOTIFICATION_SCHEMA = get_db_schema()
            notify_automation_engineers_on_file_upload(
                DBSCHEMA=NOTIFICATION_SCHEMA,
                file_name=filename,
                process_name=process_name,
                uploaded_by=user_name,
                file_type=file_type,
                file_size=file_size,
                description=description
            )
        except Exception as e:
            current_app.logger.error(f"Failed to trigger email notification: {str(e)}")

        return jsonify({
            "success": True,
            "FileID": row[0],
            "Status": row[1],
            "UploadedBy": row[2]
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@file_bp.route('/api/process/<int:bot_id>/file-management', methods=['GET'])
@token_required
def get_files_route(bot_id):
    # user_id = request.user.get("UserId")
    # user_name = request.user.get("UserName")
    """
    Get files for a specific bot/process.
    Filtering handled in Stored Procedure.
    """
    try:
        file_type = request.args.get('fileType')
        status = request.args.get('status')

        # Normalize
        file_type_param = file_type if file_type and file_type.lower() != "all" else None
        status_param = status if status and status.lower() != "all" else None

        DBSCHEMA = get_bot_schema()
        use_db_connect = DBSCHEMA != "santova"

        conn = db_connect() if use_db_connect else connect_to_database()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500

        cursor = conn.cursor()

        current_app.logger.info(
            f"GetFileData | schema={DBSCHEMA}, bot_id={bot_id}, fileType={file_type_param}, status={status_param}"
        )

        cursor.execute(
            f"EXEC {DBSCHEMA}.GetFileData @Bot_Id=%s, @FileType=%s, @Status=%s",
            (bot_id, file_type_param, status_param)
        )

        columns = [c[0] for c in cursor.description]
        files = []

        for row in cursor.fetchall():
            data = dict(zip(columns, row))
            for k, v in data.items():
                if isinstance(v, datetime):
                    data[k] = v.isoformat() + "Z"
            files.append(data)

        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "files": files
        }), 200

    except Exception as e:
        current_app.logger.error(str(e))
        import traceback
        current_app.logger.error(traceback.format_exc())
        return jsonify({"success": False, "message": str(e)}), 500
        

@file_bp.route("/api/delete-uploaded-file", methods=["POST"])
@token_required
def delete_file_route():
    user_id = request.user.get("UserId")
    # user_name = request.user.get("UserName")
    """
    Delete uploaded file (soft delete).
    Only owner can delete.
    Uses appropriate database connection and schema based on the request origin.
    Also deletes from FTP server if configured.
    """
    data = request.get_json()
    
    # Determine which schema to use for the stored procedure
    # get_bot_schema() returns "AirlineProcessHeaderDetail" for ICAT/localhost, "santova" for santova URL
    DBSCHEMA = get_bot_schema()

    file_id = data.get("FileID")

    if not file_id:
        return jsonify({
            "Success": False,
            "Message": "FileID is required"
        }), 400

    try:
        file_id = int(file_id)
    except ValueError:
        return jsonify({
            "Success": False,
            "Message": "FileID must be numeric"
        }), 400

    success, message = delete_file(DBSCHEMA, file_id, user_id)

    status_code = 200 if success else 403

    return jsonify({
        "Success": success,
        "Message": message
    }), status_code


def delete_file(DBSCHEMA: str, file_id: int, user_id: int):
    """
    Calls DeleteUploadedData SP.
    SP handles:
    - ownership check
    - soft delete
    - response message
    Also deletes from FTP server if file was successfully deleted from DB.
    """
    conn = None
    cursor = None

    try:
        # Determine which database connection to use
        # If schema is "santova", use connect_to_database() (DB_A4EFFD_Hybridwf)
        # Otherwise (AirlineProcessHeaderDetail), use db_connect() (db_Icat)
        use_db_connect = DBSCHEMA != "santova"
        
        if use_db_connect:
            # For AirlineProcessHeaderDetail schema: use db_connect() (db_Icat database)
            conn = db_connect()
            table_path = f"{DBSCHEMA}.FileManagement"
            # Query Bot_Id for AirlineProcessHeaderDetail schema
            file_info_query = f"""
                SELECT FileName, FilePath, BotId
                FROM {table_path}
                WHERE FileID = %s AND IsDeleted = 0
            """
        else:
            # For santova schema: use connect_to_database() (DB_A4EFFD_Hybridwf database)
            conn = connect_to_database()
            table_path = f"DB_A4EFFD_Hybridwf.{DBSCHEMA}.FileManagement"
            # Query ProcessID for santova schema
            file_info_query = f"""
                SELECT FileName, FilePath, ProcessID
                FROM {table_path}
                WHERE FileID = %s AND IsDeleted = 0
            """
        
        if not conn:
            return False, "Database connection failed"
        
        cursor = conn.cursor()

        # First, get file info for FTP deletion
        cursor.execute(file_info_query, (file_id,))
        file_info = cursor.fetchone()

        # Execute the SP
        cursor.execute(
            f"EXEC {DBSCHEMA}.DeleteUploadedData @FileID=%s, @UserID=%s",
            (file_id, user_id)
        )

        result = cursor.fetchone()
        conn.commit()

        if not result:
            return False, "No response from database"

        success = result[0] == 1
        message = result[1]
        
        # Delete from FTP server if file was successfully deleted from DB
        if success and file_info:
            # For FTP credentials: use get_db_schema() to get "ICAT" or "santova"
            FTP_SCHEMA = get_db_schema()  # Returns "ICAT" for ICAT URL/localhost, "santova" for santova URL
            ftp_manager = get_ftp_manager(FTP_SCHEMA)
            if ftp_manager:
                try:
                    file_name, file_path, process_or_bot_id = file_info
                    
                    # Get process name based on schema
                    process_name = None
                    if use_db_connect:
                        # For AirlineProcessHeaderDetail schema: get name from Bots table
                        if process_or_bot_id:
                            try:
                                bot_conn = db_connect()
                                if bot_conn:
                                    bot_cursor = bot_conn.cursor()
                                    bot_cursor.execute(f"""
                                        SELECT Name 
                                        FROM {DBSCHEMA}.Bots 
                                        WHERE Bot_Id = %s AND IsDeleted = 0
                                    """, (process_or_bot_id,))
                                    bot_result = bot_cursor.fetchone()
                                    if bot_result and bot_result[0]:
                                        process_name = sanitize_folder_name(bot_result[0])
                                    bot_cursor.close()
                                    bot_conn.close()
                            except Exception as e:
                                current_app.logger.error(f"Error fetching bot name for Bot_Id={process_or_bot_id}: {str(e)}")
                        
                        if not process_name:
                            process_name = f"Bot_{process_or_bot_id}" if process_or_bot_id else "Unassigned"
                    else:
                        # For santova schema: use get_process_name function
                        process_name = get_process_name(DBSCHEMA, process_or_bot_id)
                    
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

        return success, message

    except Exception as e:
        current_app.logger.error(f"Error deleting file {file_id}: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return False, f"Delete failed: {str(e)}"

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# download uploaded files

@file_bp.route("/api/download-file/<int:file_id>", methods=["GET"])
@token_required
def download_file_route(file_id):
    # user_id = request.user.get("UserId")
    # user_name = request.user.get("UserName")
    """
    Downloads a file from the uploads folder based on DB record.
    If local file doesn't exist, tries to download from FTP server.
    Uses appropriate database connection and schema based on the request origin.
    """
    try:
        # Determine which schema and database connection to use
        # get_bot_schema() returns "AirlineProcessHeaderDetail" for ICAT/localhost, "santova" for santova URL
        DBSCHEMA = get_bot_schema()
        
        # If schema is "santova", use connect_to_database() (DB_A4EFFD_Hybridwf)
        # Otherwise (AirlineProcessHeaderDetail), use db_connect() (db_Icat)
        use_db_connect = DBSCHEMA != "santova"
        
        if use_db_connect:
            # For AirlineProcessHeaderDetail schema: use db_connect() (db_Icat database)
            conn = db_connect()
            # For AirlineProcessHeaderDetail schema, table is in db_Icat database
            table_path = f"{DBSCHEMA}.FileManagement"
            # Query Bot_Id instead of ProcessID for AirlineProcessHeaderDetail schema
            select_query = f"""
                SELECT FileName, FileFormat, FilePath, BotId
                FROM {table_path}
                WHERE FileID = %s AND IsDeleted = 0
            """
        else:
            # For santova schema: use connect_to_database() (DB_A4EFFD_Hybridwf database)
            conn = connect_to_database()
            # For santova schema, table is in DB_A4EFFD_Hybridwf database
            table_path = f"DB_A4EFFD_Hybridwf.{DBSCHEMA}.FileManagement"
            # Query ProcessID for santova schema
            select_query = f"""
                SELECT FileName, FileFormat, FilePath, ProcessID
                FROM {table_path}
                WHERE FileID = %s AND IsDeleted = 0
            """
        
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Query file information
        cursor.execute(select_query, (file_id,))
        file_row = cursor.fetchone()

        if not file_row:
            cursor.close()
            conn.close()
            return jsonify({"success": False, "message": "File not found"}), 404

        file_name, file_format, file_path, process_or_bot_id = file_row

        # Check if local file exists
        if not os.path.exists(file_path):
            # Try to download from FTP server (use schema-specific credentials and paths)
            # For FTP credentials: use get_db_schema() to get "ICAT" or "santova"
            FTP_SCHEMA = get_db_schema()  # Returns "ICAT" for ICAT URL/localhost, "santova" for santova URL
            ftp_manager = get_ftp_manager(FTP_SCHEMA)
            if ftp_manager:
                try:
                    # Get process name based on schema
                    process_name = None
                    if use_db_connect:
                        # For AirlineProcessHeaderDetail schema: get name from Bots table
                        if process_or_bot_id:
                            try:
                                bot_conn = db_connect()
                                if bot_conn:
                                    bot_cursor = bot_conn.cursor()
                                    bot_cursor.execute(f"""
                                        SELECT Name 
                                        FROM {DBSCHEMA}.Bots 
                                        WHERE Bot_Id = %s AND IsDeleted = 0
                                    """, (process_or_bot_id,))
                                    bot_result = bot_cursor.fetchone()
                                    if bot_result and bot_result[0]:
                                        process_name = sanitize_folder_name(bot_result[0])
                                    bot_cursor.close()
                                    bot_conn.close()
                            except Exception as e:
                                current_app.logger.error(f"Error fetching bot name for Bot_Id={process_or_bot_id}: {str(e)}")
                        
                        if not process_name:
                            process_name = f"Bot_{process_or_bot_id}" if process_or_bot_id else "Unassigned"
                    else:
                        # For santova schema: use get_process_name function
                        process_name = get_process_name(DBSCHEMA, process_or_bot_id)
                    
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
                        cursor.close()
                        conn.close()
                        return jsonify({
                            "success": False,
                            "message": f"File missing from server and FTP download failed: {ftp_msg}"
                        }), 404
                    
                    current_app.logger.info(f"File downloaded from FTP: {remote_file_path}")
                except Exception as ftp_error:
                    current_app.logger.error(f"FTP download error: {str(ftp_error)}")
                    cursor.close()
                    conn.close()
                    return jsonify({
                        "success": False,
                        "message": f"File missing from server and FTP download failed: {str(ftp_error)}"
                    }), 404
            else:
                cursor.close()
                conn.close()
                return jsonify({"success": False, "message": "File missing from server"}), 404

        # Update download count
        cursor.execute(f"""
            UPDATE {table_path}
            SET DownloadCount = ISNULL(DownloadCount, 0) + 1
            WHERE FileID = %s
        """, (file_id,))
        conn.commit()

        cursor.close()
        conn.close()

        return send_file(
            file_path,
            as_attachment=True,
            download_name=f"{file_name}.{file_format}",
            mimetype="application/octet-stream"
        )

    except Exception as e:
        current_app.logger.error(f"Error downloading file {file_id}: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return jsonify({"success": False, "message": str(e)}), 500

def call_uipath_api_background(app, file_id, file_name):
    """Safely call UiPath Orchestrator API inside Flask app context."""
    with app.app_context():
        try:
            uipath_url = app.config.get("UIPATH_ORCHESTRATOR_URL")
            uipath_token = app.config.get("UIPATH_ORCHESTRATOR_TOKEN")

            if not uipath_url or not uipath_token:
                app.logger.warning("UiPath config missing. Skipping Orchestrator call.")
                return

            headers = {
                "Authorization": f"Bearer {uipath_token}",
                "Content-Type": "application/json"
            }

            payload = {
                "fileId": file_id,
                "fileName": file_name
            }

            app.logger.info(f"[UiPath] Triggering job for file_id={file_id}")

            response = requests.post(
                uipath_url,
                json=payload,
                headers=headers,
                timeout=30
            )

            if response.status_code in (200, 202):
                app.logger.info(f"[UiPath] Success for file_id={file_id}")
            else:
                app.logger.warning(
                    f"[UiPath] Failed | file_id={file_id} | "
                    f"Status={response.status_code} | Response={response.text[:300]}"
                )

        except requests.exceptions.Timeout:
            app.logger.error(f"[UiPath] Timeout for file_id={file_id}")
        except requests.exceptions.ConnectionError:
            app.logger.error(f"[UiPath] Connection error for file_id={file_id}")
        except requests.exceptions.RequestException as e:
            app.logger.error(f"[UiPath] Request error for file_id={file_id}: {str(e)}")
        except Exception as e:
            import traceback
            app.logger.error(f"[UiPath] Unexpected error for file_id={file_id}: {str(e)}")
            app.logger.error(traceback.format_exc())



@file_bp.route("/api/process/<int:bot_id>/trigger-file/<int:file_id>", methods=["POST"])
@token_required
def trigger_file_route(bot_id, file_id):
    # user_id = request.user.get("UserId")
    # user_name = request.user.get("UserName")
    """
    Triggers a file by setting [Trigger] = 1 in the database.
    Uses appropriate database connection and schema based on the request origin.
    Validates that the file belongs to the specified bot_id.
    """
    try:
        # Determine which schema and database connection to use
        # get_bot_schema() returns "AirlineProcessHeaderDetail" for ICAT/localhost, "santova" for santova URL
        DBSCHEMA = get_bot_schema()
        
        # If schema is "santova", use connect_to_database() (DB_A4EFFD_Hybridwf)
        # Otherwise (AirlineProcessHeaderDetail), use db_connect() (db_Icat)
        use_db_connect = DBSCHEMA != "santova"
        
        if use_db_connect:
            # For AirlineProcessHeaderDetail schema: use db_connect() (db_Icat database)
            conn = db_connect()
            # For AirlineProcessHeaderDetail schema, table is in db_Icat database
            table_path = f"{DBSCHEMA}.FileManagement"
        else:
            # For santova schema: use connect_to_database() (DB_A4EFFD_Hybridwf database)
            conn = connect_to_database()
            # For santova schema, table is in DB_A4EFFD_Hybridwf database
            table_path = f"DB_A4EFFD_Hybridwf.{DBSCHEMA}.FileManagement"
        
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Check if file exists and is not deleted, also get file name and bot_id/process_id for validation
        if use_db_connect:
            # For AirlineProcessHeaderDetail schema: query BotId (column name without underscore)
            select_query = f"""
                SELECT FileID, [Trigger], FileName, BotId
                FROM {table_path}
                WHERE FileID = %s AND IsDeleted = 0
            """
        else:
            # For santova schema: query ProcessID
            select_query = f"""
                SELECT FileID, [Trigger], FileName, ProcessID
                FROM {table_path}
                WHERE FileID = %s AND IsDeleted = 0
            """
        
        cursor.execute(select_query, (file_id,))
        file_row = cursor.fetchone()

        if not file_row:
            cursor.close()
            conn.close()
            return jsonify({"success": False, "message": "File not found"}), 404
        
        # Validate that the file belongs to the specified bot_id
        file_bot_id = file_row[3] if len(file_row) > 3 else None
        if file_bot_id and int(file_bot_id) != int(bot_id):
            cursor.close()
            conn.close()
            return jsonify({
                "success": False,
                "message": f"File does not belong to bot_id {bot_id}. File belongs to bot_id {file_bot_id}"
            }), 400

        # Update trigger status to 1
        cursor.execute(f"""
            UPDATE {table_path}
            SET [Trigger] = 1
            WHERE FileID = %s AND IsDeleted = 0
        """, (file_id,))
        conn.commit()

        cursor.close()
        conn.close()

        try:
            app = current_app._get_current_object()
            file_name = file_row[2] if len(file_row) > 2 else None

            threading.Thread(
                target=call_uipath_api_background,
                args=(app, file_id, file_name),
                daemon=True
            ).start()

        except Exception as thread_error:
            current_app.logger.error(f"Failed to start UiPath background thread: {str(thread_error)}")

        return jsonify({
            "success": True,
            "message": "File triggered successfully"
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error triggering file {file_id}: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return jsonify({"success": False, "message": str(e)}), 500

