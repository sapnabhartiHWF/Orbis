"""
PDD (Process Design Document) File Upload API
Only RPA Engineers can upload, all users can view/download
"""
from flask import Blueprint, request, jsonify, current_app, send_file
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required
from app.utils.db_schema import get_db_schema
import os
from werkzeug.utils import secure_filename
from datetime import datetime

pdd_upload_bp = Blueprint("pdd_upload_bp", __name__)

# Allowed file extensions for PDD
ALLOWED_PDD_EXTENSIONS = {
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"
}

def allowed_pdd_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_PDD_EXTENSIONS

@pdd_upload_bp.route("/api/pdd/upload", methods=["POST"])
@token_required
def upload_pdd(user_id, user_name):
    conn = None
    cursor = None
    try:
        DBSCHEMA = get_db_schema()
        
        file = request.files.get("file")
        file_id = request.form.get("fileId")

        if not file or not file_id:
            return jsonify(success=False, message="File and FileID required"), 400

        filename = secure_filename(file.filename)
        upload_dir = os.path.join(os.getcwd(), "uploads", "PDD", str(file_id))
        os.makedirs(upload_dir, exist_ok=True)

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        file_format = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
        final_name = f"{os.path.splitext(filename)[0]}_{timestamp}.{file_format}"
        file_path = os.path.join(upload_dir, final_name)
        file.save(file_path)

        conn = connect_to_database()
        if not conn:
            return jsonify(success=False, message="Database connection failed"), 500
        
        cursor = conn.cursor()

        cursor.execute(f"""
            EXEC {DBSCHEMA}.insertOrUpdatePddDetails
                @FileID=%s,
                @RpaEngineerID=%s,
                @FileName=%s,
                @FilePath=%s,
                @FileSize=%s,
                @FileFormat=%s,
                @MimeType=%s,
                @CreatedBy=%s
        """, (
            file_id,
            user_id,
            filename,
            file_path,
            os.path.getsize(file_path),
            file_format,
            file.content_type or "application/octet-stream",
            user_id
        ))

        conn.commit()

        return jsonify(success=True, message="PDD uploaded successfully"), 200

    except Exception as e:
        if conn:
            conn.rollback()
        current_app.logger.error(f"Error uploading PDD: {e}")
        return jsonify(success=False, message=str(e)), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@pdd_upload_bp.route("/api/pdd/<int:file_id>", methods=["GET"])
@token_required
def get_pdd(user_id, user_name, file_id):
    conn = None
    cursor = None
    try:
        DBSCHEMA = get_db_schema()
        
        conn = connect_to_database()
        if not conn:
            return jsonify({
                "success": False,
                "message": "Database connection failed"
            }), 500
        
        cursor = conn.cursor()

        cursor.execute(
            f"EXEC {DBSCHEMA}.GetPDDByFileId @FileID=%s",
            (file_id,)
        )

        row = cursor.fetchone()

        if not row:
            return jsonify(success=False, message="No PDD found"), 404

        columns = [c[0] for c in cursor.description]
        data = dict(zip(columns, row))
        
        # Format datetime fields
        for key in ["CreatedDate", "UpdatedDate"]:
            if data.get(key) and hasattr(data[key], 'isoformat'):
                data[key] = data[key].isoformat()
        
        # Format file size
        size = data.get("FileSize", 0)
        for unit in ["B", "KB", "MB", "GB"]:
            if size < 1024:
                data["FormattedFileSize"] = f"{size:.2f} {unit}"
                break
            size /= 1024

        return jsonify(success=True, data=data), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting PDD: {e}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@pdd_upload_bp.route("/api/pdd/<int:file_id>/assignment", methods=["GET"])
@token_required
def check_assignment(user_id, user_name, file_id):
    conn = None
    cursor = None
    try:
        DBSCHEMA = get_db_schema()
        
        conn = connect_to_database()
        if not conn:
            return jsonify({
                "success": False,
                "message": "Database connection failed"
            }), 500
        
        cursor = conn.cursor()

        cursor.execute(
            f"EXEC {DBSCHEMA}.IsUserAssignedToFile @FileID=%s, @UserID=%s",
            (file_id, user_id)
        )

        row = cursor.fetchone()

        return jsonify(
            success=True,
            isAssigned=bool(row and row[0] == 1)
        ), 200
        
    except Exception as e:
        current_app.logger.error(f"Error checking assignment: {e}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@pdd_upload_bp.route("/api/pdd/<int:file_id>/download", methods=["GET"])
@token_required
def download_pdd(user_id, user_name, file_id):
    """
    Download PDD file. All users can download.
    """
    conn = None
    cursor = None
    try:
        DBSCHEMA = get_db_schema()
        
        conn = connect_to_database()
        if not conn:
            return jsonify({
                "success": False,
                "message": "Database connection failed"
            }), 500
        
        cursor = conn.cursor()
        
        cursor.execute(f"""
            SELECT FileName, FilePath, FileFormat
            FROM {DBSCHEMA}.PDD
            WHERE FileID = %s AND IsDeleted = 0
        """, (file_id,))
        
        row = cursor.fetchone()
        
        if not row:
            return jsonify({
                "success": False,
                "message": "PDD file not found"
            }), 404
        
        file_name, file_path, file_format = row
        
        # Check if file exists
        if not os.path.exists(file_path):
            return jsonify({
                "success": False,
                "message": "PDD file not found on server"
            }), 404
        
        # Return file for download
        return send_file(
            file_path,
            as_attachment=True,
            download_name=f"{file_name}.{file_format}" if file_format else file_name,
            mimetype="application/octet-stream"
        )
        
    except Exception as e:
        current_app.logger.error(f"Error in download_pdd: {e}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
