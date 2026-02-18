from app.databaseconnection import db_connect
from flask import Blueprint, jsonify, request
from app.auth_middleware import token_required
from app.db_schema_utils import get_bot_schema

# Create blueprint for bots routes
bots_bp = Blueprint("bots_bp", __name__)


def get_bot_names(schema: str = "AirlineProcessHeaderDetail"):
    """
    Retrieves active bot names from the database using the GetBotNames stored procedure.
    
    Args:
        schema: Database schema name (AirlineProcessHeaderDetail for ICAT URL, santova for others)
    
    Returns:
        list: A list of dictionaries containing Bot_Id and Name for active bots
    """
    connection = None
    cursor = None
    try:
        connection = db_connect()
        cursor = connection.cursor()
        
        # Execute the stored procedure with dynamic schema
        cursor.execute(f"EXEC {schema}.GetBotNames")
        
        # Fetch all results (returns tuples)
        rows = cursor.fetchall()
        
        # Convert tuples to dictionaries
        results = []
        for row in rows:
            results.append({
                'Bot_Id': row[0],
                'Name': row[1]
            })
        
        return results
    except Exception as e:
        raise Exception(f"Error retrieving bot names: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@bots_bp.route("/api/bots", methods=["GET"])
@token_required
def get_bot_names_api():
    # user_id = request.user.get("UserId")
    # user_name = request.user.get("UserName")
    """
    Get all active bot names from the database.
    Uses AirlineProcessHeaderDetail schema for ICAT URL, santova for others.
    """
    try:
        SCHEMA = get_bot_schema()
        bot_names = get_bot_names(SCHEMA)
        return jsonify({
            "success": True,
            "data": bot_names
        }), 200
    except Exception as e:
        # Handle case where schema doesn't have the required tables
        error_msg = str(e)
        if "Invalid object name" in error_msg or "Could not find stored procedure" in error_msg:
            # Tables/procedures don't exist in this schema - return empty data
            print(f"Schema {SCHEMA} does not have required tables, returning empty data")
            return jsonify({
                "success": True,
                "data": []
            }), 200
        print(f"Error fetching bot names: {e}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
