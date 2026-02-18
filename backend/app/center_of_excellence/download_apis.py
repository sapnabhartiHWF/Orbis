from flask import Blueprint, request, jsonify, send_file, current_app
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required
from app.file_management.ftp_utils import get_ftp_manager
from app.utils.db_schema import get_db_schema  # ✅ Import common utility (defaults to ICAT)
import os
from werkzeug.utils import secure_filename
from typing import Optional, Tuple, Dict, Any

download_bp = Blueprint('download_bp', __name__)

UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")

# Centralized MIME type to file extension mapping
MIME_TYPE_TO_EXTENSION = {
    # Documents
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "text/plain": "txt",
    # Images
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/bmp": "bmp",
    "image/tiff": "tiff",
    "image/svg+xml": "svg",
    "image/webp": "webp",
    "image/jfif": "jfif",
}


def get_file_extension_from_mime_type(mime_type: Optional[str], file_path: Optional[str] = None) -> str:
    """
    Get file extension from file path first, then MIME type as fallback.
    Priority: file_path > mime_type > default
    
    Args:
        mime_type: MIME type string (e.g., "image/png")
        file_path: Optional file path to extract extension from (preferred method)
    
    Returns:
        str: File extension (e.g., "png", "pdf", "xlsx")
    """
    # Priority 1: Extract extension from file path (most reliable)
    if file_path and "." in file_path:
        # Get the basename first to handle paths correctly
        basename = os.path.basename(file_path)
        if "." in basename:
            extension = basename.rsplit(".", 1)[1].lower().strip()
            # Remove any query parameters or fragments
            extension = extension.split("?")[0].split("#")[0]
            if extension:
                return extension
    
    # Priority 2: Use MIME type mapping
    if mime_type and mime_type.lower() in MIME_TYPE_TO_EXTENSION:
        return MIME_TYPE_TO_EXTENSION[mime_type.lower()]
    
    # Default fallback - should rarely be used
    return "bin"


def download_file_with_count(
    process_id: int,
    query_config: Dict[str, Any],
    update_config: Dict[str, Any],
    error_context: str
) -> Tuple[Optional[jsonify], Optional[send_file]]:

    conn = None
    cursor = None

    try:
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        cursor = conn.cursor()

        top_clause = "TOP 1 " if query_config.get("use_top") else ""
        order_by_clause = f" {query_config.get('order_by')}" if query_config.get("order_by") else ""

        select_query = f"""
            SELECT {top_clause}{', '.join(query_config['select_columns'])}
            FROM {DBSCHEMA}.{query_config['table']}
            WHERE {query_config['where_clause']}
            {order_by_clause}
        """

        cursor.execute(select_query, query_config["where_params"])
        row = cursor.fetchone()

        if not row:
            return jsonify({
                "success": False,
                "message": f"{error_context} not found for this process"
            }), None

        file_path_value = row[query_config["file_path_index"]]
        # Safely extract optional indices (download_count may not exist in older schemas)
        download_count = None
        if query_config.get("download_count_index") is not None:
            try:
                download_count = row[query_config["download_count_index"]]
            except Exception:
                download_count = None

        record_id = None
        if query_config.get("id_column_index") is not None:
            try:
                record_id = row[query_config["id_column_index"]]
            except Exception:
                record_id = None

        mime_type = None
        if query_config.get("mime_type_index") is not None:
            try:
                mime_type = row[query_config["mime_type_index"]]
            except Exception:
                mime_type = None

        # 🔴 HARD FAIL: path must include filename with extension
        if not file_path_value or "." not in os.path.basename(file_path_value):
            return jsonify({
                "success": False,
                "message": (
                    f"{error_context} file path is invalid or incomplete in database. "
                    f"Stored path: '{file_path_value}'. Please re-upload the file."
                )
            }), None

        # Normalize path
        file_path_value = file_path_value.replace("\\", "/")
        
        # Extract extension from database path value FIRST (before path manipulation)
        # This ensures we capture the original extension - CRITICAL for correct file type
        original_extension_from_db = None
        db_basename = os.path.basename(file_path_value)
        if "." in db_basename:
            original_extension_from_db = db_basename.rsplit(".", 1)[1].lower().strip()
            # Clean extension - remove any query parameters or fragments
            original_extension_from_db = original_extension_from_db.split("?")[0].split("#")[0].strip()
            # Validate extension is not empty
            if not original_extension_from_db:
                original_extension_from_db = None

        if os.path.isabs(file_path_value):
            file_path = file_path_value
        else:
            file_path = os.path.join(UPLOAD_FOLDER, file_path_value)

        # Ensure directory exists for FTP fallback
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        # Try local → FTP
        if not os.path.exists(file_path):
            ftp_manager = get_ftp_manager(DBSCHEMA)
            if not ftp_manager:
                return jsonify({
                    "success": False,
                    "message": "File not found locally and FTP not configured"
                }), None

            remote_path = "/" + file_path_value.lstrip("/")
            success, msg = ftp_manager.download_file(remote_path, file_path)

            if not success or not os.path.exists(file_path):
                return jsonify({
                    "success": False,
                    "message": f"File not found locally and FTP download failed: {msg}"
                }), None

        # Validate file content
        if os.path.getsize(file_path) == 0:
            return jsonify({
                "success": False,
                "message": f"{error_context} file is empty. Please re-upload."
            }), None

        # Increment download count (best-effort) — failures here should NOT block file download
        try:
            new_count = (download_count or 0) + 1
            cursor.execute(
                f"""
                UPDATE {DBSCHEMA}.{update_config['table']}
                SET {update_config['update_column']} = %s
                WHERE {update_config['where_column']} = %s AND IsDeleted = 0
                """,
                (new_count, record_id)
            )
            conn.commit()
        except Exception as update_err:
            # Log a warning and continue; don't abort the download if the count update fails
            current_app.logger.warning(
                f"Could not update download count for {error_context}: {str(update_err)}"
            )
            if conn:
                try:
                    conn.rollback()
                except Exception:
                    pass

        # Extract extension from the actual file path (most reliable - preserves original extension)
        # This is CRITICAL: we must preserve the original file extension from the uploaded file
        # ALWAYS use the file path extension - NEVER guess from MIME type
        original_filename = os.path.basename(file_path)
        extension = None
        
        # Log for debugging
        current_app.logger.info(f"Download file - file_path_value: {file_path_value}, file_path: {file_path}, original_filename: {original_filename}, mime_type: {mime_type}, db_extension: {original_extension_from_db}")
        
        # ALWAYS use extension from database path value FIRST (this is the source of truth)
        # This is the most reliable source as it's the original uploaded file path
        if original_extension_from_db and original_extension_from_db != "":
            extension = original_extension_from_db
            current_app.logger.info(f"✓ Using extension from database path: {extension} (file_path_value: {file_path_value})")
        else:
            # Fallback 1: Extract from actual file path
            if "." in original_filename:
                extension = original_filename.rsplit(".", 1)[1].lower().strip()
                extension = extension.split("?")[0].split("#")[0]
                if extension and extension != "":
                    current_app.logger.info(f"✓ Extracted extension from file path: {extension}")
                else:
                    extension = None
        
        # Fallback 2: If still no extension, try from file_path_value directly (one more attempt)
        if not extension or extension == "":
            if file_path_value and "." in os.path.basename(file_path_value):
                extension = os.path.basename(file_path_value).rsplit(".", 1)[1].lower().strip()
                extension = extension.split("?")[0].split("#")[0]
                if extension and extension != "":
                    current_app.logger.warning(f"✓ Extracted extension from file_path_value (retry): {extension}")
                else:
                    extension = None
        
        # Fallback 3: Use MIME type ONLY if we absolutely cannot get it from file path
        if not extension or extension == "":
            if mime_type and mime_type.lower() in MIME_TYPE_TO_EXTENSION:
                extension = MIME_TYPE_TO_EXTENSION[mime_type.lower()]
                current_app.logger.warning(f"⚠ Using extension from MIME type (fallback): {extension}")
            else:
                extension = "bin"
                current_app.logger.error(f"✗ CRITICAL: Could not determine extension! file_path_value: {file_path_value}, mime_type: {mime_type}")
        
        # Final validation: Ensure extension is valid
        if not extension or extension == "":
            extension = "bin"
            current_app.logger.error(f"✗ Extension is empty after all attempts! Using default: {extension}")
        
        # Map error_context to clean download filenames (base name only, extension will be added)
        clean_filename_map = {
            "SampleData": "sample_data",
            "SOP Document": "sop_document",
            "Workflow Diagram": "workflow_diagram",
            "Exception Handling Plan": "exception_handling_plan"
        }
        
        # CRITICAL: Validate extension matches MIME type (safety check)
        # If MIME type indicates spreadsheet but extension is PDF, re-extract from file path
        if extension == "pdf" and mime_type and "spreadsheet" in mime_type.lower():
            current_app.logger.error(f"ERROR: Extension is PDF but MIME type indicates spreadsheet! Re-extracting from file path.")
            # Try to get extension from file_path_value again
            if file_path_value and "." in os.path.basename(file_path_value):
                extension = os.path.basename(file_path_value).rsplit(".", 1)[1].lower().strip()
                extension = extension.split("?")[0].split("#")[0]
                current_app.logger.info(f"Corrected extension to: {extension}")
        
        # Additional validation: If MIME type is Excel but extension is not xlsx/xls, check file path
        if mime_type and "spreadsheet" in mime_type.lower() and extension not in ["xlsx", "xls", "xlsm"]:
            current_app.logger.warning(f"WARNING: MIME type is spreadsheet but extension is {extension}. Checking file path...")
            if file_path_value and "." in os.path.basename(file_path_value):
                potential_ext = os.path.basename(file_path_value).rsplit(".", 1)[1].lower().strip()
                if potential_ext in ["xlsx", "xls", "xlsm"]:
                    extension = potential_ext
                    current_app.logger.info(f"Corrected extension to match file path: {extension}")
        
        # Generate clean filename with the ORIGINAL file extension (preserves .xlsx, .pdf, etc.)
        if error_context in clean_filename_map:
            # Use clean base name but preserve the original extension from uploaded file
            download_name = f"{clean_filename_map[error_context]}.{extension}"
            current_app.logger.info(f"Final download name: {download_name} (extension: {extension}, mime_type: {mime_type}, file_path_value: {file_path_value})")
        else:
            # Fallback: use original filename
            if "." in original_filename:
                download_name = original_filename
            else:
                download_name = f"{original_filename}.{extension}"

        return None, send_file(
            file_path,
            as_attachment=True,
            download_name=download_name,
            mimetype=mime_type or "application/octet-stream"
        )

    except Exception as e:
        if conn:
            conn.rollback()
        current_app.logger.exception(e)
        return jsonify({"success": False, "message": str(e)}), None

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()



@download_bp.route('/api/download-process-sampledata/<int:process_id>', methods=['GET'])
@token_required
def download_sample_data(process_id):
    # user_id = request.user.get("UserId")
    # user_name = request.user.get("UserName")
    """
    Download SampleData file for a process and increment download count.
    """
    # NOTE: Do not SELECT the download-count column here because older DB schemas
    # may not have it. We perform download-count updates in a best-effort try/except.
    query_config = {
        'table': 'ProcessRegistration',
        'select_columns': ['P_id', 'SampledataPath', 'MimeType'],
        'where_clause': 'P_id = %s AND IsDeleted = 0',
        'where_params': (process_id,),
        'file_path_index': 1,
        'mime_type_index': 2,
        'download_count_index': None,
        'id_column_index': 0
    }
    
    update_config = {
        'table': 'ProcessRegistration',
        'update_column': 'sampleDownloadCount',
        'where_column': 'P_id',
        'id_value_index': 0
    }
    
    error_response, file_response = download_file_with_count(
        process_id, query_config, update_config, "SampleData"
    )
    
    return error_response if error_response else file_response


@download_bp.route('/api/download-process-sopdoc/<int:process_id>', methods=['GET'])
@token_required
def download_sop_doc(process_id):
    # user_id = request.user.get("UserId")
    # user_name = request.user.get("UserName")
    """
    Download SopDoc file for a process and increment download count.
    """
    # Avoid selecting the SopDocDownloadCount column directly (may not exist).
    query_config = {
        'table': 'ProcessRegistration',
        'select_columns': ['P_id', 'SopDoc', 'SopMimetype'],
        'where_clause': 'P_id = %s AND IsDeleted = 0',
        'where_params': (process_id,),
        'file_path_index': 1,
        'mime_type_index': 2,
        'download_count_index': None,
        'id_column_index': 0
    }
    
    update_config = {
        'table': 'ProcessRegistration',
        'update_column': 'downloadCount',
        'where_column': 'P_id',
        'id_value_index': 0
    }
    
    error_response, file_response = download_file_with_count(
        process_id, query_config, update_config, "SOP Document"
    )
    
    return error_response if error_response else file_response

@download_bp.route('/api/download-process-pdd/<int:process_id>', methods=['GET'])
@token_required
def download_process_pdd(process_id):
    conn = None
    cursor = None

    try:
        DBSCHEMA = get_db_schema()
        current_app.logger.info(f"[PDD Download] Using schema: {DBSCHEMA} for process_id: {process_id}")
        
        conn = connect_to_database()
        if not conn:
            error_msg = "Database connection failed"
            current_app.logger.error(f"[PDD Download] {error_msg}")
            return jsonify({"success": False, "message": error_msg}), 500
        
        cursor = conn.cursor()

        # Use stored procedure to get PDD data (same as get_technical_assessment)
        # If this fails, throw error immediately - don't try other schemas
        try:
            cursor.execute(
                f"EXEC {DBSCHEMA}.GetTechnicalAssessment @ProcessId=%s",
                (process_id,)
            )
            result = cursor.fetchall()
        except Exception as sp_error:
            # Log the error with schema info and re-raise immediately
            error_msg = f"Error executing GetTechnicalAssessment in schema '{DBSCHEMA}': {str(sp_error)}"
            current_app.logger.error(f"[PDD Download] {error_msg}")
            raise Exception(error_msg) from sp_error

        if not result:
            error_msg = f"PDD not found for process {process_id} in schema '{DBSCHEMA}'"
            current_app.logger.warning(f"[PDD Download] {error_msg}")
            return jsonify({"success": False, "message": error_msg}), 404

        # Get column names from cursor description
        columns = [column[0] for column in cursor.description]
        tech_assessment_dict = dict(zip(columns, result[0]))

        # Extract PDD path and MIME type (handle both naming conventions)
        pdd_path = tech_assessment_dict.get('DA_pddPath') or tech_assessment_dict.get('pddPath')
        mime_type = tech_assessment_dict.get('DA_MimeType') or tech_assessment_dict.get('MimeType')
        da_id = tech_assessment_dict.get('DA_id')

        if not pdd_path:
            return jsonify({"success": False, "message": "PDD file path not found"}), 404

        # Normalize path
        pdd_path = pdd_path.replace("\\", "/")

        # Build file path
        file_path = pdd_path if os.path.isabs(pdd_path) else os.path.join(UPLOAD_FOLDER, pdd_path)

        # Try FTP if not found locally
        if not os.path.exists(file_path):
            ftp_manager = get_ftp_manager(DBSCHEMA)
            if not ftp_manager:
                return jsonify({"success": False, "message": "File not found locally and FTP not configured"}), 404
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            remote_path = "/" + pdd_path.lstrip("/")
            success, msg = ftp_manager.download_file(remote_path, file_path)
            if not success or not os.path.exists(file_path):
                return jsonify({"success": False, "message": f"FTP download failed: {msg}"}), 404

        # Validate file size
        if os.path.getsize(file_path) == 0:
            return jsonify({"success": False, "message": "PDD file is empty"}), 400

        if da_id:
            try:
                cursor.execute(
                    f"UPDATE {DBSCHEMA}.DetailedAnalysisStage SET downloadCount = ISNULL(downloadCount, 0) + 1 WHERE DA_id = %s",
                    (da_id,)
                )
                conn.commit()
            except Exception as update_error:
                
                current_app.logger.warning(f"Could not update download count (non-critical): {str(update_error)}")
                if conn:
                    conn.rollback()

        # Extract extension from file path
        ext = os.path.splitext(pdd_path)[1].lstrip(".") or "bin"
        if not ext or ext == "":
            # Fallback to MIME type
            ext = get_file_extension_from_mime_type(mime_type, pdd_path)

        return send_file(
            file_path,
            as_attachment=True,
            download_name=f"pdd_process_{process_id}.{ext}",
            mimetype=mime_type or "application/octet-stream"
        )

    except Exception as e:
        if conn:
            conn.rollback()
        current_app.logger.exception(f"Error downloading PDD: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
