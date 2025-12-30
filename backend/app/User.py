from flask import Blueprint, jsonify
from app.Database.connection import connect_to_database  # your existing DB connection function    C:\sapna\HybridWorkforce_Projects\santova2\backend\Database\connection.py
from flask import request
from app.auth_middleware import token_required

user_bp = Blueprint("user_bp", __name__)

@user_bp.route("/api/users", methods=["GET"])
@token_required
def get_all_users(user_id, user_name):
    """
    Fetch all users from santova.SantovaUser via stored procedure.
    """
    host = request.headers.get("Origin")
    DBSCHEMA = "santova"
    if host == "https://orbis-icat.alphalogix.tech":
        DBSCHEMA = "ICAT"
    conn = connect_to_database()
    cursor = conn.cursor()

    try:
        cursor.execute(f"EXEC {DBSCHEMA}.GetAllUser")
        rows = cursor.fetchall()

        # get column names
        columns = [col[0] for col in cursor.description]

        # convert each row to dict
        users = [dict(zip(columns, row)) for row in rows]

        return jsonify({"success": True, "data": users}), 200

    except Exception as e:
        print("Error fetching users:", e)
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()
