from flask import Blueprint, request, jsonify, make_response, current_app
from app.Database.connection import connect_to_database
import jwt
import datetime

auth_bp = Blueprint("auth", __name__)

def generate_jwt(user, company_ids):
    payload = {
        "UserId": user.get("UserId"),
        "UserName": f"{user.get('FirstName')} {user.get('LastName')}".strip(),
        "RoleId": user.get("RoleId"),
        "CompanyIds": company_ids,  # pass all mapped company IDs
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2),
        "iat": datetime.datetime.utcnow()
    }
    token = jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")
    return token

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password required"}), 400

    conn = connect_to_database()
    cursor = conn.cursor()
    try:
        query = "EXEC santova.checkLogin @email=%s, @password=%s"
        cursor.execute(query, (email, password))
        rows = cursor.fetchall()
        if not rows:
            return jsonify({"message": "Invalid credentials"}), 401

        columns = [column[0] for column in cursor.description]

        # Take the first row for basic user info
        user = dict(zip(columns, rows[0]))

        # Collect all mapped companies from returned rows
        company_ids = []
        company_names = []
        for row in rows:
            row_dict = dict(zip(columns, row))
            if row_dict.get("CompanyId") and row_dict["CompanyId"] not in company_ids:
                company_ids.append(row_dict["CompanyId"])
                company_names.append(row_dict.get("CompanyName"))

        token = generate_jwt(user, company_ids)

        user_info = {
            "UserId": user.get("UserId"),
            "FirstName": user.get("FirstName"),
            "LastName": user.get("LastName"),
            "Email": user.get("Email"),
            "RoleId": user.get("RoleId"),
            "RoleName": user.get("RoleName"),
            "CompanyIds": company_ids,
            "CompanyNames": company_names
        }

        response = make_response(jsonify({
            "message": "Login successful",
            "token": token,
            "user": user_info
        }))
        return response

    except Exception as e:
        print("Login error:", e)
        return jsonify({"message": "Internal Server Error", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
