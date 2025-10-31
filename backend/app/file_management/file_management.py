from flask import Blueprint, request, jsonify, current_app
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required
import os
from werkzeug.utils import secure_filename
from flask import send_file

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

    if not file or file.filename == "":
        return jsonify({"success": False, "message": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"success": False, "message": "File type not allowed"}), 400

    filename = secure_filename(file.filename)
    file_format = filename.rsplit(".", 1)[1].lower()
    mime_type = file.content_type 
    file_size = len(file.read())
    file.seek(0)

    # Folder path: uploads/user_<id>/
    user_folder = os.path.join(UPLOAD_FOLDER, f"user_{user_id}")
    os.makedirs(user_folder, exist_ok=True)
    file_path = os.path.join(user_folder, filename)
    file.save(file_path)

    conn = connect_to_database()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            EXEC santova.InsertFileData
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

        return jsonify({
            "success": True,
            "message": "File uploaded successfully",
            "NewFileID": new_file_id,
            "UploadedByName": uploaded_by_name
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


def get_files_from_db(process_id=None, file_type=None):
    """
    Fetch all files from SP regardless of user.
    """
    conn = connect_to_database()
    cursor = conn.cursor()
    try:
        # SQL Server SP call
        sql = "EXEC santova.GetFileData @ProcessID=%s, @UserID=%s, @FileType=%s"
        cursor.execute(sql, (process_id, None, file_type if file_type and file_type != 'all' else None))

        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()
        files = []
        for row in rows:
            file_dict = dict(zip(columns, row))
            # Handle tags as list
            if file_dict.get('tags'):
                file_dict['tags'] = [tag.strip() for tag in file_dict['tags'].split(',') if tag.strip()]
            files.append(file_dict)

        return files

    except Exception as e:
        print("Error fetching files from DB:", e)
        raise e

    finally:
        cursor.close()
        conn.close()



def delete_file(file_id: int, user_id: int):
    """
    Soft delete a file by setting IsDeleted = 1.
    Only the owner can delete.
    Returns (success: bool, message: str)
    """
    conn = None
    cursor = None
    try:
        conn = connect_to_database()
        cursor = conn.cursor()

        # Execute the SP
        cursor.execute(
            "EXEC santova.DeleteUploadedData @FileID=%s, @UserID=%s",
            (file_id, user_id)
        )

        # Fetch the SP result
        row = cursor.fetchone()
        conn.commit()

        if row:
            success = row[0] == 1
            message = row[1] if len(row) > 1 else "No message returned"
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
    """
    process_id_str = request.args.get('processId')
    file_type = request.args.get('fileType', 'all')

    process_id = int(process_id_str) if process_id_str else None

    try:
        files = get_files_from_db()

        return jsonify({
            'success': True,
            'files': files
        })

    except ValueError:
        return jsonify({'success': False, 'message': 'Invalid ProcessID format'}), 400
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

    if not file_id:
        current_app.logger.warning("Delete request missing FileID")
        return jsonify({"Success": False, "Message": "FileID is required"}), 400

    # Ensure numeric
    try:
        file_id = int(file_id)
    except ValueError:
        return jsonify({"Success": False, "Message": "FileID must be numeric"}), 400

    success, message = delete_file(file_id, user_id)

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
    """
    conn = connect_to_database()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT FileName, FileFormat, FilePath
            FROM santova.FileManagement
            WHERE FileID = %s AND IsDeleted = 0
        """, (file_id,))
        file_row = cursor.fetchone()

        if not file_row:
            return jsonify({"success": False, "message": "File not found"}), 404
            
        print(file_row)

        file_name, file_format, file_path = file_row

        if not os.path.exists(file_path):
            return jsonify({"success": False, "message": "File missing from server"}), 404

        cursor.execute("""
            UPDATE santova.FileManagement
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

