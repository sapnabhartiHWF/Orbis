from flask import Blueprint, jsonify, request
from .create_exception_ticket import create_exception_ticket, get_exception_ticket
from app.auth_middleware import token_required
from app.db_schema_utils import get_airline_schema

exception_blueprint = Blueprint('exception', __name__)

@exception_blueprint.route('/api/create-exception', methods=['POST'])
@token_required
def create_exception(user_id, user_name):
    try:
        SCHEMA = get_airline_schema()
        data = request.get_json()
        if not data:
            return jsonify({'status': 'error', 'message': 'No data provided'}), 400
        
        result = create_exception_ticket(
            data['subject'], 
            data['message'], 
            data['botname'], 
            data['status'], 
            data['serverity'], 
            data['assginname'],
            SCHEMA
        )
        return jsonify({'status': 'success', 'message': result}), 201
    except Exception as e:
        # Handle case where schema doesn't have the required tables
        error_msg = str(e)
        if "Invalid object name" in error_msg or "Could not find stored procedure" in error_msg:
            # Tables/procedures don't exist in this schema
            print(f"Schema {SCHEMA} does not have required tables")
            return jsonify({'status': 'error', 'message': 'Exception creation not available for this URL'}), 400
        print(f"Error creating exception: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@exception_blueprint.route('/api/get-exception', methods=['GET'])
@token_required
def get_exception(user_id, user_name):
    try:
        SCHEMA = get_airline_schema()
        exceptions = get_exception_ticket(SCHEMA)
        # Frontend expects 'data' not 'message'
        return jsonify({'status': 'success', 'data': exceptions}), 200
    except Exception as e:
        # Handle case where schema doesn't have the required tables
        error_msg = str(e)
        if "Invalid object name" in error_msg or "Could not find stored procedure" in error_msg:
            # Tables/procedures don't exist in this schema - return empty data
            print(f"Schema {SCHEMA} does not have required tables, returning empty data")
            return jsonify({'status': 'success', 'data': []}), 200
        print(f"Error fetching exceptions: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500