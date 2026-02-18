from flask import Blueprint, request, jsonify, current_app
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required
from app.utils.db_schema import get_db_schema
from app.center_of_excellence.process_stages import process_stages_bp


@process_stages_bp.route('/api/process/<int:process_id>', methods=['DELETE'])
@token_required
def delete_process(process_id):
    """
    Soft delete a process by setting its status to deleted.
    Calls ICAT.SoftDeleteProcess stored procedure.
    """
    user_id = request.user.get("UserId")
    conn = None
    cursor = None

    try:
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        cursor = conn.cursor()

        cursor.execute(
            f"EXEC {DBSCHEMA}.SoftDeleteProcess "
            "@ProcessId=%s, "
            "@DeletedBy=%s",
            (process_id, user_id)
        )

        result = cursor.fetchall()
        conn.commit()

        # Check if stored procedure returned any error messages
        if result:
            # Check for error messages in the result
            error_message = None
            for row in result:
                if isinstance(row, (list, tuple)) and len(row) > 0:
                    msg = str(row[0]) if row[0] else None
                    if msg and ("error" in msg.lower() or "failed" in msg.lower() or "denied" in msg.lower()):
                        error_message = msg
                        break
            
            if error_message:
                return jsonify({
                    "success": False,
                    "message": error_message
                }), 400

        return jsonify({
            "success": True,
            "message": "Process deleted successfully."
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()
        error_message = str(e)
        current_app.logger.error(f"Error deleting process {process_id}: {error_message}", exc_info=True)
        
        # Check for specific error types
        if "not found" in error_message.lower() or "does not exist" in error_message.lower():
            return jsonify({
                "success": False,
                "message": f"Process with ID {process_id} not found."
            }), 404
        elif "Access Denied" in error_message or "denied" in error_message.lower():
            return jsonify({
                "success": False,
                "message": "Access Denied: You do not have permission to delete this process."
            }), 403
        elif "cannot delete" in error_message.lower() or "cannot be deleted" in error_message.lower():
            return jsonify({
                "success": False,
                "message": "This process cannot be deleted. It may be in use or have dependencies."
            }), 400
        
        return jsonify({
            "success": False,
            "message": error_message
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
