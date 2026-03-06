
from flask import Blueprint, request, jsonify, current_app
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required


team_notifications_bp = Blueprint("team_notifications_bp", __name__, url_prefix="/api/team")

def get_notifications(DBSCHEMA, user_id, page=1, page_size=10):
    conn = connect_to_database()
    cursor = conn.cursor()

    offset = (page - 1) * page_size

    sql = f"""
    SELECT *
    FROM {DBSCHEMA}.Notifications
    WHERE UserId = %s AND IsDeleted = 0
    ORDER BY CreatedAt DESC
    OFFSET %s ROWS FETCH NEXT %s ROWS ONLY
    """

    cursor.execute(sql, (user_id, offset, page_size))
    rows = cursor.fetchall()
    columns = [col[0] for col in cursor.description]

    data = [dict(zip(columns, row)) for row in rows]

    cursor.close()
    conn.close()

    return data

@team_notifications_bp.route("/notifications", methods=["GET"])
@token_required
def get_notifications_route():
    user_id = request.user.get("UserId")
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("pageSize", 10))

    from app.utils.db_schema import get_db_schema
    DBSCHEMA = get_db_schema()

    data = get_notifications(DBSCHEMA, user_id, page, page_size)

    return jsonify({
        "success": True,
        "data": data
    }), 200

def get_unread_count(DBSCHEMA, user_id):
    conn = connect_to_database()
    cursor = conn.cursor()

    sql = f"""
    SELECT COUNT(*)
    FROM {DBSCHEMA}.Notifications
    WHERE UserId = %s AND IsRead = 0 AND IsDeleted = 0
    """

    cursor.execute(sql, (user_id,))
    count = cursor.fetchone()[0]

    cursor.close()
    conn.close()

    return count

@team_notifications_bp.route("/notifications/unread-count", methods=["GET"])
@token_required
def unread_count_route():
    user_id = request.user.get("UserId")

    from app.utils.db_schema import get_db_schema
    DBSCHEMA = get_db_schema()

    count = get_unread_count(DBSCHEMA, user_id)

    return jsonify({
        "success": True,
        "unreadCount": count
    }), 200

def mark_notification_read(DBSCHEMA, notification_id, user_id):
    conn = connect_to_database()
    cursor = conn.cursor()

    sql = f"""
    UPDATE {DBSCHEMA}.Notifications
    SET IsRead = 1,
        ReadAt = GETUTCDATE()
    WHERE NotificationId = %s AND UserId = %s
    """

    cursor.execute(sql, (notification_id, user_id))
    conn.commit()

    cursor.close()
    conn.close()

@team_notifications_bp.route("/notifications/mark-read", methods=["PUT"])
@token_required
def mark_read_route():
    user_id = request.user.get("UserId")
    data = request.json

    notification_id = data.get("NotificationId")

    from app.utils.db_schema import get_db_schema
    DBSCHEMA = get_db_schema()

    mark_notification_read(DBSCHEMA, notification_id, user_id)

    return jsonify({
        "success": True,
        "message": "Notification marked as read"
    }), 200

@team_notifications_bp.route("/notifications/mark-all-read", methods=["PUT"])
@token_required
def mark_all_read_route():
    user_id = request.user.get("UserId")

    from app.utils.db_schema import get_db_schema
    DBSCHEMA = get_db_schema()

    conn = connect_to_database()
    cursor = conn.cursor()

    cursor.execute(f"""
        UPDATE {DBSCHEMA}.Notifications
        SET IsRead = 1,
            ReadAt = GETUTCDATE()
        WHERE UserId = %s AND IsRead = 0
    """, (user_id,))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        "success": True,
        "message": "All notifications marked as read"
    }), 200