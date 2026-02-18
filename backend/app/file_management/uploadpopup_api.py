from flask import Blueprint, jsonify, request, current_app
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required

process_api = Blueprint('processes_api', __name__)

@process_api.route('/api/processes', methods=['GET'])
@token_required
def get_all_processes():
    # user_id = request.user.get("UserId")
    # user_name = request.user.get("UserName")
    try:
        from app.utils.db_schema import get_db_schema
        DBSCHEMA = get_db_schema()

        # Get CompanyIds from request.user (set by token_required)
        company_ids = request.user.get("CompanyIds")  # this is a list

        conn = connect_to_database()
        cursor = conn.cursor()

        if company_ids:
            placeholders = ",".join(["%s"] * len(company_ids))
            cursor.execute(
                f"SELECT CompanyId, Name AS CompanyName FROM {DBSCHEMA}.Company WHERE CompanyId IN ({placeholders})",
                company_ids
            )
        else:
            cursor.execute(f"SELECT CompanyId, Name AS CompanyName FROM {DBSCHEMA}.Company")

        columns = [column[0] for column in cursor.description]
        rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

        cursor.close()
        conn.close()

        return jsonify({"processes": rows})
    except Exception as e:
        print("Error fetching processes:", e)
        return jsonify({"error": str(e)}), 500


@process_api.route('/api/insert_process', methods=['POST'])
@token_required
def insert_company():
    user_id = request.user.get("UserId")
    # user_name = request.user.get("UserName")
    try:
        from app.utils.db_schema import get_db_schema
        DBSCHEMA = get_db_schema()

        data = request.get_json()
        name = data.get('Name')

        if not name:
            return jsonify({'error': 'Name is required'}), 400

        # Debug: Check if user_id is received
        if not user_id:
            return jsonify({'error': 'User ID is missing from token'}), 401

        # Ensure user_id is an integer
        try:
            user_id_int = int(user_id)
        except (ValueError, TypeError) as e:
            print(f"Error converting user_id to int: user_id={user_id}, type={type(user_id)}, error={e}")
            return jsonify({'error': f'Invalid user ID: {user_id}'}), 400

        print(f"DEBUG: Calling InsertCompany with Name='{name}', UserId={user_id_int}, DBSCHEMA={DBSCHEMA}")

        conn = connect_to_database()
        cursor = conn.cursor()

      
        sql = f"EXEC {DBSCHEMA}.InsertCompany @Name = %s, @UserId = %s"
        print(f"DEBUG: Executing SQL: {sql} with params: name='{name}', user_id={user_id_int}")
        cursor.execute(sql, (name, user_id_int))
        result = cursor.fetchone()
        conn.commit()

        company_id = result[0] if result else None

        cursor.close()
        conn.close()

        return jsonify({
            'message': 'Company inserted successfully',
            'CompanyId': company_id
        }), 201

    except Exception as e:
        print(f"Error in insert_company: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500