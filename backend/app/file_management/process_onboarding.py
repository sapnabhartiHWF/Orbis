from flask import Blueprint, jsonify, request, current_app
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required
import jwt

process_onboarding_bp = Blueprint('process_onboarding_bp', __name__)

# Insert Process Onboarding
@process_onboarding_bp.route('/api/process_onboarding', methods=['POST'])
@token_required
def insert_process_onboarding(user_id, user_name):
	try:
		host = request.headers.get("Origin")
		DBSCHEMA = "santova"
		if host == "https://orbis-icat.alphalogix.tech":
			DBSCHEMA = "ICAT"

		data = request.get_json()
		name = data.get('Name')
		owned_by = data.get('OwnedBy')
		department = data.get('Department')
		description = data.get('Description')
		tag = data.get('Tag')

		if not name:
			return jsonify({'error': 'Name is required'}), 400
		if not user_id:
			return jsonify({'error': 'User ID is missing from token'}), 401
		try:
			user_id_int = int(user_id)
		except (ValueError, TypeError) as e:
			return jsonify({'error': f'Invalid user ID: {user_id}'}), 400

		conn = connect_to_database()
		cursor = conn.cursor(as_dict=True)
		sql = f"EXEC {DBSCHEMA}.InsertProcessOnboarding @Name=%s, @OwnedBy=%s, @Department=%s, @Description=%s, @Tag=%s, @LoggedInUser=%s"
		cursor.execute(sql, (name, owned_by, department, description, tag, user_id_int))
		result = cursor.fetchone()
		conn.commit()
		cursor.close()
		conn.close()

		if not result:
			return jsonify({'error': 'Insert failed'}), 500

		return jsonify({'message': 'Process onboarding inserted successfully', 'process': result}), 201
	except Exception as e:
		import traceback
		traceback.print_exc()
		return jsonify({'error': str(e)}), 500

# Get Process Onboarding List
@process_onboarding_bp.route('/api/process-onboarding_details', methods=['GET'])
@token_required
def get_process_onboarding_list(user_id, user_name):
	try:
		host = request.headers.get("Origin")
		DBSCHEMA = "santova"
		if host == "https://orbis-icat.alphalogix.tech":
			DBSCHEMA = "ICAT"

		conn = connect_to_database()
		cursor = conn.cursor(as_dict=True)
		sql = f"EXEC {DBSCHEMA}.GetProcessOnboardingList"
		cursor.execute(sql)
		rows = cursor.fetchall()
		cursor.close()
		conn.close()

		return jsonify({'processes': rows})
	except Exception as e:
		import traceback
		traceback.print_exc()
		return jsonify({'error': str(e)}), 500
