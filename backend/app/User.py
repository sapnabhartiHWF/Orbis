from flask import Blueprint, jsonify
from app.Database.connection import connect_to_database
from flask import request
from app.auth_middleware import token_required

user_bp = Blueprint("user_bp", __name__)

@user_bp.route("/api/users", methods=["GET"])
@token_required
def get_all_users():
    assignable_only = request.args.get("assignable", "false").lower() == "true"

    from app.utils.db_schema import get_db_schema
    DBSCHEMA = get_db_schema()

    conn = connect_to_database()
    cursor = conn.cursor()

    try:
        sp_name = "GetRpaUser" if assignable_only else "GetAllUser"
        cursor.execute(f"EXEC {DBSCHEMA}.{sp_name}")

        rows = cursor.fetchall()
        columns = [col[0] for col in cursor.description]

        users = [dict(zip(columns, row)) for row in rows]

        return jsonify({
            "success": True,
            "count": len(users),
            "data": users
        }), 200

    except Exception as e:
        print("Error fetching users:", str(e))
        return jsonify({
            "success": False,
            "message": "Failed to fetch users"
        }), 500

    finally:
        cursor.close()
        conn.close()