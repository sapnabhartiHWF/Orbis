from flask import Blueprint, request, jsonify, current_app
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required

file_bp = Blueprint("file_bp", __name__)

def insert_file_to_db(user_id, process_id, file_name, file_type, file_size, file_format, description=None):
    """
    Inserts a file record into the database via stored procedure.
    Returns (new_file_id, uploaded_by_name) if successful.
    """
    conn = connect_to_database()
    cursor = conn.cursor()
    try:
        sql = """
        EXEC santova.InsertFileData
            @UserID = %s,
            @ProcessID = %s,
            @FileName = %s,
            @FileType = %s,
            @FileSize = %s,
            @FileFormat = %s,
            @Description = %s
        """
        cursor.execute(sql, (
            user_id,
            process_id,
            file_name,
            file_type,
            file_size,
            file_format,
            description if description else None
        ))

        result = cursor.fetchone()
        if not result:
            raise Exception("No result returned from stored procedure")

        new_file_id = result[0]
        uploaded_by_name = result[1] if len(result) > 1 else "Unknown User"

        conn.commit()
        return new_file_id, uploaded_by_name

    except Exception as e:
        conn.rollback()
        raise e

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

@file_bp.route('/api/file-management', methods=['POST'])
@token_required  # ✅ Requires valid JWT
def insert_file_route(user_id, user_name):
    """
    Route to handle file upload metadata insert.
    JWT gives user_id and user_name.
    """
    data = request.json
    required_fields = ['ProcessID', 'FileName', 'FileType', 'FileSize', 'FileFormat']

    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'success': False, 'message': f'{field} is required'}), 400

    try:
        new_file_id, uploaded_by_name = insert_file_to_db(
            user_id=user_id,
            process_id=data['ProcessID'],
            file_name=data['FileName'],
            file_type=data['FileType'],
            file_size=data['FileSize'],
            file_format=data['FileFormat'],
            description=data.get('Description')
        )

        return jsonify({
            'success': True,
            'NewFileID': new_file_id,
            'UploadedByName': uploaded_by_name or user_name
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


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

