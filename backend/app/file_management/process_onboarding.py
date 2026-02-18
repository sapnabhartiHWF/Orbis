from flask import Blueprint, jsonify, request, current_app
from app.databaseconnection import db_connect
from app.auth_middleware import token_required
from datetime import datetime
import pymssql
import jwt

process_onboarding_bp = Blueprint('process_onboarding_bp', __name__)

# Insert Process Onboarding (Bot)
@process_onboarding_bp.route('/api/process_onboarding', methods=['POST'])
@token_required
def insert_process_onboarding():
    user_id = request.user.get("UserId")
    user_name = request.user.get("UserName")
    conn = None
    cursor = None
    try:
        data = request.get_json()
        name = data.get('Name')
        owned_by = data.get('OwnedBy')
        department = data.get('Department')
        description = data.get('Description')
        tag = data.get('Tag')

        if not name:
            return jsonify({'error': 'Name is required'}), 400

        if not user_id or not user_name:
            return jsonify({'error': 'User details missing from token'}), 401

        conn = db_connect()
        cursor = conn.cursor()

        sql = """
        EXEC AirlineProcessHeaderDetail.InsertBot
            @Name=%s,
            @OwnedBy=%s,
            @Department=%s,
            @Description=%s,
            @Tag=%s,
            @CreatedById=%s,
            @CreatedBy=%s
        """

        cursor.execute(sql, (
            name,
            owned_by,
            department,
            description,
            tag,
            str(user_id),
            user_name
        ))

        columns = [col[0] for col in cursor.description]
        row = cursor.fetchone()
        conn.commit()

        if not row:
            return jsonify({'error': 'Insert failed'}), 500

        result = dict(zip(columns, row))

        current_app.logger.info(
            f"Bot inserted: Bot_Id={result.get('Bot_Id')} by {user_name}"
        )

        return jsonify({
            'message': 'Process onboarding inserted successfully',
            'process': result
        }), 201

    except Exception as e:
        current_app.logger.error(f"Error inserting bot: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# Get Process Onboarding List (Bot List)
@process_onboarding_bp.route('/api/process-onboarding_details', methods=['GET'])
@token_required
def get_process_onboarding_list():
    # user_id = request.user.get("UserId")
    # user_name = request.user.get("UserName")
	conn = None
	cursor = None
	try:
		# Connect to database using db_connect (connects to db_Icat)
		try:
			conn = db_connect()
		except pymssql.Error as conn_error:
			current_app.logger.error(f"Failed to connect to database: {str(conn_error)}")
			return jsonify({
				'error': f'Database connection failed. Please check your database credentials in .env file. Error: {str(conn_error)}'
			}), 500
		except Exception as conn_error:
			current_app.logger.error(f"Unexpected error connecting to database: {str(conn_error)}")
			return jsonify({
				'error': f'Database connection error: {str(conn_error)}'
			}), 500
			
		if not conn:
			current_app.logger.error("db_connect() returned None")
			return jsonify({'error': 'Database connection failed - connection object is None'}), 500
			
		cursor = conn.cursor()
		
		# Execute stored procedure: AirlineProcessHeaderDetail.BotList
		# The stored procedure is in db_Icat.AirlineProcessHeaderDetail schema
		sql = "EXEC AirlineProcessHeaderDetail.BotList"
		current_app.logger.info("Executing: AirlineProcessHeaderDetail.BotList")
		cursor.execute(sql)
		
		# Get column names
		columns = [col[0] for col in cursor.description] if cursor.description else []
		
		# Fetch all rows
		rows = cursor.fetchall()
		
		# Convert tuples to dictionaries
		processes = []
		for row in rows:
			process_dict = dict(zip(columns, row))
			
			# Normalize datetime fields
			for key, value in process_dict.items():
				if isinstance(value, datetime):
					process_dict[key] = value.isoformat() + 'Z'
			
			processes.append(process_dict)

		current_app.logger.info(f"Fetched {len(processes)} bots from BotList")
		return jsonify({'processes': processes})
		
	except pymssql.Error as db_error:
		current_app.logger.error(f"Database error fetching bot list: {str(db_error)}")
		error_msg = f"Database connection error: {str(db_error)}"
		return jsonify({'error': error_msg}), 500
	except Exception as e:
		current_app.logger.error(f"Error fetching bot list: {str(e)}")
		import traceback
		current_app.logger.error(traceback.format_exc())
		return jsonify({'error': str(e)}), 500
	finally:
		if cursor:
			cursor.close()
		if conn:
			conn.close()
