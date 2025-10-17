from flask import Blueprint, jsonify, request
from app.Database.connection import connect_to_database
import jwt

process_api = Blueprint('processes_api', __name__)

# Example secret key for JWT decoding
JWT_SECRET = "your_jwt_secret_here"

@process_api.route('/api/processes', methods=['GET'])
def get_all_processes():
    try:
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"error": "Authorization token missing"}), 401
        if token.startswith("Bearer "):
            token = token[7:]

        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        company_ids = payload.get("CompanyIds")  # this is a list

        conn = connect_to_database()
        cursor = conn.cursor()

        if company_ids:
            placeholders = ",".join(["%s"] * len(company_ids))
            cursor.execute(
                f"SELECT CompanyId, Name AS CompanyName FROM santova.Company WHERE CompanyId IN ({placeholders})",
                company_ids
            )
        else:
            cursor.execute("SELECT CompanyId, Name AS CompanyName FROM santova.Company")

        columns = [column[0] for column in cursor.description]
        rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

        cursor.close()
        conn.close()

        return jsonify({"processes": rows})
    except Exception as e:
        print("Error fetching processes:", e)
        return jsonify({"error": str(e)}), 500


