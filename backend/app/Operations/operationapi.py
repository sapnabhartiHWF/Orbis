from flask import Blueprint, jsonify, request
from app.Operations.operation import db_summary_report, airline_details, morgan_stanley_details,operations_by_bot
from app.auth_middleware import token_required
from app.db_schema_utils import get_bot_schema

# Create blueprint for operations routes
operation_bp = Blueprint("operation_bp", __name__)


@operation_bp.route("/api/operations/summary", methods=["GET"])
@token_required
def get_summary_report():
    # user_id = request.user.get("UserId")
    # user_name = request.user.get("UserName")
    """
    Get summary report with total bots, active bots, success count, and exception count.
    Uses AirlineProcessHeaderDetail schema for ICAT URL, santova for others.
    """
    try:
        SCHEMA = get_bot_schema()
        report = db_summary_report(SCHEMA)
        return jsonify({
            "success": True,
            "data": report
        }), 200
    except Exception as e:
        # Handle case where schema doesn't have the required tables
        error_msg = str(e)
        if "Invalid object name" in error_msg or "Could not find stored procedure" in error_msg:
            # Tables/procedures don't exist in this schema - return empty data
            print(f"Schema {SCHEMA} does not have required tables, returning empty data")
            return jsonify({
                "success": True,
                "data": {
                    "Total Bot": 0,
                    "Total ActiveBot": 0,
                    "Total Success": 0,
                    "Total Exception": 0,
                    "Production Ready Bot": 0
                }
            }), 200
        print(f"Error fetching summary report: {e}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


@operation_bp.route("/api/operations/airline-details", methods=["GET"])
@token_required
def get_airline_details():
    # user_id = request.user.get("UserId")
    # user_name = request.user.get("UserName")
    """
    Get airline details with flight numbers, flight status, and airline status.
    Uses AirlineProcessHeaderDetail schema for ICAT URL, santova for others.
    """
    try:
        bot_id = request.args.get("bot_id", type=int)
        SCHEMA = get_bot_schema()
        details = airline_details(SCHEMA, bot_id=bot_id)
        return jsonify({
            "success": True,
            "data": details
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
        print(f"Error fetching airline details: {e}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


@operation_bp.route("/api/operations/morgan-stanley", methods=["GET"])
@token_required
def get_morgan_stanley_details():
    # user_id = request.user.get("UserId")
    # user_name = request.user.get("UserName")
    """
    Get Morgan Stanley details by calling stored procedure SP_GetMorganStanley.
    Returns all records from the MorganStanley table ordered by CreatedOn DESC.
    Uses AirlineProcessHeaderDetail schema for ICAT URL, santova for others.
    """
    try:
        SCHEMA = get_bot_schema()
        details = morgan_stanley_details(SCHEMA)
        return jsonify({
            "success": True,
            "data": details
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
        print(f"Error fetching Morgan Stanley details: {e}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@operation_bp.route("/api/operations/by-bot", methods=["GET"])
@token_required
def get_operations_by_bot():
    """
    Return process data depending on bot_id
    BotId = 1 → Morgan Stanley
    BotId = 2 → Flight Details
    """
    try:
        bot_id = request.args.get("bot_id", type=int)
        if not bot_id:
            return jsonify({"success": False, "message": "bot_id is required"}), 400

        SCHEMA = get_bot_schema()
        data = operations_by_bot(SCHEMA, bot_id)

        return jsonify({
            "success": True,
            "data": data
        }), 200

    except Exception as e:
        print(f"Error fetching operations by bot: {e}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
