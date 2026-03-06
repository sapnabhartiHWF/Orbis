from flask import Blueprint, request, jsonify
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required
from app.utils.db_schema import get_db_schema

sla_bp = Blueprint("sla", __name__)


@sla_bp.route("/api/sla/dashboard-summary", methods=["GET"])
@token_required
def dashboard_summary():
    """
    Get SLA dashboard summary with overall compliance, breaches, cycle time, and processes monitored.
    
    Query Parameters:
        from: Start date (YYYY-MM-DD format)
        to: End date (YYYY-MM-DD format)
        department: Optional department filter
    
    Returns:
        JSON response with dashboard summary data
    """
    from_date = request.args.get("from")
    to_date = request.args.get("to")
    department = request.args.get("department")

    conn = None
    cursor = None

    try:
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        
        if not conn:
            return jsonify({"success": False, "message": "Failed to connect to database"}), 500

        cursor = conn.cursor()

        # Execute stored procedure with proper parameter syntax for pymssql
        cursor.execute(
            f"EXEC {DBSCHEMA}.GetSLADashboardSummary @FromDate=%s, @ToDate=%s, @Department=%s",
            (from_date, to_date, department)
        )

        row = cursor.fetchone()

        # Handle case where no data is returned
        if not row:
            result = {
                "overall_compliance": 0,
                "total_breaches": 0,
                "avg_cycle_time": 0.0,
                "processes_monitored": 0
            }
        else:
            result = {
                "overall_compliance": row[0] if row[0] is not None else 0,
                "total_breaches": row[1] if row[1] is not None else 0,
                "avg_cycle_time": float(row[2]) if row[2] is not None else 0.0,
                "processes_monitored": row[3] if row[3] is not None else 0
            }

        return jsonify({"success": True, "data": result})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@sla_bp.route("/api/sla/process-summary", methods=["GET"])
@token_required
def process_summary():
    """
    Get SLA process summary with detailed metrics per process.
    
    Query Parameters:
        from: Start date (YYYY-MM-DD format)
        to: End date (YYYY-MM-DD format)
        department: Optional department filter
    
    Returns:
        JSON response with process summary data
    """
    from_date = request.args.get("from")
    to_date = request.args.get("to")
    department = request.args.get("department")

    conn = None
    cursor = None

    try:
        DBSCHEMA = get_db_schema()
        conn = connect_to_database()
        
        if not conn:
            return jsonify({"success": False, "message": "Failed to connect to database"}), 500

        cursor = conn.cursor()

        # Execute stored procedure with proper parameter syntax for pymssql
        cursor.execute(
            f"EXEC {DBSCHEMA}.GetSLAProcessSummary @FromDate=%s, @ToDate=%s, @Department=%s",
            (from_date, to_date, department)
        )

        # Get column names from cursor description
        if cursor.description:
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()

            result = []
            for row in rows:
                # Convert row to dictionary, handling None values
                row_dict = {}
                for i, col in enumerate(columns):
                    value = row[i] if i < len(row) else None
                    # Convert decimal/numeric types to float for JSON serialization
                    if isinstance(value, (int, float)):
                        row_dict[col] = value
                    elif value is None:
                        row_dict[col] = None
                    else:
                        row_dict[col] = str(value)
                result.append(row_dict)
        else:
            result = []

        return jsonify({"success": True, "data": result})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()