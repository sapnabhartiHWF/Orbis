from flask import Blueprint, jsonify
from app.Database.connection import connect_to_database  # your existing DB connection function    C:\sapna\HybridWorkforce_Projects\santova2\backend\Database\connection.py

user_bp = Blueprint("user_bp", __name__)

@user_bp.route("/api/users", methods=["GET"])
def get_all_users():
    """
    Fetch all users from santova.SantovaUser via stored procedure.
    """
    conn = connect_to_database()
    cursor = conn.cursor()

    try:
        cursor.execute("EXEC santova.GetAllUser")
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
