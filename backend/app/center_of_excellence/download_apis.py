from flask import Blueprint, request, jsonify, send_file, current_app
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required
from app.file_management.ftp_utils import get_ftp_manager
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


def get_db_schema() -> str:
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
            print(f"Using ICAT schema for origin: {host}")
        else:
            print(f"Using santova schema for origin: {host}")
    else:
        print("No Origin/Referer header found, defaulting to santova schema")
    
    return DBSCHEMA


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
        download_count = row[query_config["download_count_index"]]
        record_id = row[query_config["id_column_index"]]
        mime_type = (
            row[query_config["mime_type_index"]]
            if query_config.get("mime_type_index") is not None
            else None
        )

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

        # Increment download count
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
def download_sample_data(user_id, user_name, process_id):
    """
    Download SampleData file for a process and increment download count.
    """
    query_config = {
        'table': 'ProcessRegistration',
        'select_columns': ['P_id', 'SampledataPath', 'MimeType', 'SampleDataDownloadCount'],
        'where_clause': 'P_id = %s AND IsDeleted = 0',
        'where_params': (process_id,),
        'file_path_index': 1,
        'mime_type_index': 2,
        'download_count_index': 3,
        'id_column_index': 0
    }
    
    update_config = {
        'table': 'ProcessRegistration',
        'update_column': 'SampleDataDownloadCount',
        'where_column': 'P_id',
        'id_value_index': 0
    }
    
    error_response, file_response = download_file_with_count(
        process_id, query_config, update_config, "SampleData"
    )
    
    return error_response if error_response else file_response


@download_bp.route('/api/download-process-sopdoc/<int:process_id>', methods=['GET'])
@token_required
def download_sop_doc(user_id, user_name, process_id):
    """
    Download SopDoc file for a process and increment download count.
    """
    query_config = {
        'table': 'ProcessRegistration',
        'select_columns': ['P_id', 'SopDoc', 'SopMimetype', 'SopDocDownloadCount'],
        'where_clause': 'P_id = %s AND IsDeleted = 0',
        'where_params': (process_id,),
        'file_path_index': 1,
        'mime_type_index': 2,
        'download_count_index': 3,
        'id_column_index': 0
    }
    
    update_config = {
        'table': 'ProcessRegistration',
        'update_column': 'SopDocDownloadCount',
        'where_column': 'P_id',
        'id_value_index': 0
    }
    
    error_response, file_response = download_file_with_count(
        process_id, query_config, update_config, "SOP Document"
    )
    
    return error_response if error_response else file_response


@download_bp.route('/api/download-tobe-workflow/<int:process_id>', methods=['GET'])
@token_required
def download_workflow_diagram(user_id, user_name, process_id):
    """
    Download Workflow Diagram file for TO-BE Design stage and increment download count.
    """
    query_config = {
        'table': 'ToBeDesign',
        'select_columns': ['D_id', 'WorkflowFilePath', 'WorkflowDownloadCount'],
        'where_clause': 'process_id = %s AND IsDeleted = 0',
        'where_params': (process_id,),
        'file_path_index': 1,
        'mime_type_index': None,  # No MIME type column
        'download_count_index': 2,
        'id_column_index': 0,
        'use_top': True,
        'order_by': 'ORDER BY D_id DESC'
    }
    
    update_config = {
        'table': 'ToBeDesign',
        'update_column': 'WorkflowDownloadCount',
        'where_column': 'D_id',
        'id_value_index': 0
    }
    
    error_response, file_response = download_file_with_count(
        process_id, query_config, update_config, "Workflow Diagram"
    )
    
    return error_response if error_response else file_response


@download_bp.route('/api/download-tobe-exception/<int:process_id>', methods=['GET'])
@token_required
def download_exception_handling_plan(user_id, user_name, process_id):
    """
    Download Exception Handling Plan file for TO-BE Design stage and increment download count.
    """
    query_config = {
        'table': 'ToBeDesign',
        'select_columns': ['D_id', 'ExceptionFilePath', 'ExceptionDownloadCount'],
        'where_clause': 'process_id = %s AND IsDeleted = 0',
        'where_params': (process_id,),
        'file_path_index': 1,
        'mime_type_index': None,  # No MIME type column
        'download_count_index': 2,
        'id_column_index': 0,
        'use_top': True,
        'order_by': 'ORDER BY D_id DESC'
    }
    
    update_config = {
        'table': 'ToBeDesign',
        'update_column': 'ExceptionDownloadCount',
        'where_column': 'D_id',
        'id_value_index': 0
    }
    
    error_response, file_response = download_file_with_count(
        process_id, query_config, update_config, "Exception Handling Plan"
    )
    
    return error_response if error_response else file_response
