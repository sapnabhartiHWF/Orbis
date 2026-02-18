from flask import Blueprint, request, jsonify, current_app
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required

assignment_bp = Blueprint("assignment_bp", __name__)

@assignment_bp.route("/api/Rpa_taskAssignment", methods=["POST"])
@token_required
def assign_invoice():
    user_id = request.user.get("UserId")
    # user_name = request.user.get("UserName")
    """
    Assign invoice file to RPA Engineer
    Logged-in user is Automation Lead
    """
    conn = None
    cursor = None
    try:
        data = request.get_json()

        file_id = data.get("fileId")
        rpa_engineer_id = data.get("rpaEngineerId")
        
        from app.utils.db_schema import get_db_schema
        DBSCHEMA = get_db_schema()

        if not file_id or not rpa_engineer_id:
            return jsonify({
                "success": False,
                "message": "fileId and rpaEngineerId are required"
            }), 400

        conn = connect_to_database()
        if not conn:
             return jsonify({
                "success": False,
                "message": "Database connection failed"
            }), 500
            
        cursor = conn.cursor()

        # 🔹 Call FINAL stored procedure
        query = f"""
            EXEC {DBSCHEMA}.NotifyToRpaEngineer_OnAssign
                @FileID = %s,
                @RpaEngineerID = %s,
                @AssignedBy = %s
        """
        cursor.execute(query, (file_id, rpa_engineer_id, user_id))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Invoice assigned and notification sent successfully"
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error in assign_invoice: {e}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@assignment_bp.route("/api/rpa_notifications", methods=["GET"])
@token_required
def get_notifications():
    user_id = request.user.get("UserId")
    # user_name = request.user.get("UserName")
    conn = None
    cursor = None
    try:
        from app.utils.db_schema import get_db_schema
        DBSCHEMA = get_db_schema()

        conn = connect_to_database()
        if not conn:
             return jsonify({
                "success": False,
                "message": "Database connection failed"
            }), 500

        cursor = conn.cursor()

        query = f"""
            SELECT
                NotificationId,
                Title,
                Message,
                RedirectUrl,
                Metadata,
                IsRead,
                CreatedDate
            FROM {DBSCHEMA}.Notification
            WHERE UserId = %s
            ORDER BY CreatedDate DESC
        """
        cursor.execute(query, (user_id,))

        rows = cursor.fetchall()
        columns = [column[0] for column in cursor.description]

        notifications = []
        for row in rows:
            row_dict = dict(zip(columns, row))
            notifications.append({
                "id": row_dict.get("NotificationId"),
                "title": row_dict.get("Title"),
                "message": row_dict.get("Message"),
                "redirectUrl": row_dict.get("RedirectUrl"),
                "metadata": row_dict.get("Metadata"),
                "isRead": row_dict.get("IsRead"),
                "createdDate": row_dict.get("CreatedDate")
            })

        return jsonify(notifications), 200

    except Exception as e:
        current_app.logger.error(f"Error in get_notifications: {e}")
        return jsonify({"message": str(e)}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@assignment_bp.route("/api/rpa_users", methods=["GET"])
@token_required
def get_all_users():
    # user_id = request.user.get("UserId")
    # user_name = request.user.get("UserName")
    """
    Fetch all users from DBSCHEMA.
    """
    conn = None
    cursor = None
    try:
        from app.utils.db_schema import get_db_schema
        DBSCHEMA = get_db_schema()
        
        conn = connect_to_database()
        if not conn:
             return jsonify({
                "success": False,
                "message": "Database connection failed"
            }), 500

        cursor = conn.cursor()

        # Call stored procedure to get RPA Engineers
        query = f"EXEC {DBSCHEMA}.GetRpaEngineers"
        cursor.execute(query)
        rows = cursor.fetchall()

        # get column names
        columns = [col[0] for col in cursor.description]

        # convert each row to dict
        users = [dict(zip(columns, row)) for row in rows]

        return jsonify({"success": True, "data": users}), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching users: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()