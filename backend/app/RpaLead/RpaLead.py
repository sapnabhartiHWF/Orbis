from flask import Blueprint, request, jsonify, current_app
import pymssql

from app.utils.db_schema import get_db_schema
from app.Database.connection_pool import connect_to_database
from app.databaseconnection import db_connect
from app.auth_middleware import token_required


# Blueprint for RPA Lead related routes
rpa_lead_bp = Blueprint("rpa_lead", __name__)


def _get_connection():
    """
    Match the project's existing DB routing:
    - ICAT / localhost uses `db_connect()` (db_Icat database)
    - Santova uses pooled `connect_to_database()`
    """
    DBSCHEMA = get_db_schema()
    use_db_connect = DBSCHEMA != "santova"
    conn = db_connect() if use_db_connect else connect_to_database()
    return conn, DBSCHEMA


def _execute_process_query(conn, DBSCHEMA, process_id=None, created_by=None, 
                          department=None, priority=None, overall_status=None):
    """
    Execute GetProcessInfo stored procedure and return results.
    """
    cursor = conn.cursor()
    try:
        proc = f"db_Icat.{DBSCHEMA}.GetProcessInfo"
        params = (process_id, created_by, department, priority, overall_status)
        cursor.execute(f"EXEC {proc} %s, %s, %s, %s, %s", params)
        
        columns = [column[0] for column in cursor.description] if cursor.description else []
        rows = cursor.fetchall()
        
        return [dict(zip(columns, row)) for row in rows]
    finally:
        cursor.close()


@rpa_lead_bp.route("/api/rpa-lead/process", methods=["GET"])
@token_required
def get_process_list():
    """
    Get list of processes with optional filters.
    Mirrors the existing DB setup (db_Icat + schema-based routing).
    """
    created_by_raw = request.args.get("createdBy")
    department = request.args.get("department") or None
    priority = request.args.get("priority") or None
    overall_status = request.args.get("overallStatus") or None

    # Normalize createdBy to int or None
    created_by = None
    if created_by_raw not in (None, ""):
        try:
            created_by = int(created_by_raw)
        except (TypeError, ValueError):
            return jsonify(
                {"success": False, "message": "Invalid createdBy (must be an integer)"}
            ), 400

    conn, DBSCHEMA = _get_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    try:
        result = _execute_process_query(conn, DBSCHEMA, None, created_by, department, priority, overall_status)
        
        return jsonify({
            "success": True,
            "count": len(result),
            "data": result
        })

    except pymssql.Error as e:
        current_app.logger.exception("DB error in /api/rpa-lead/process")
        return jsonify({"success": False, "error": "Database error", "details": str(e)}), 500

    except Exception as e:
        current_app.logger.exception("Unhandled error in /api/rpa-lead/process")
        return jsonify({"success": False, "error": "Server error", "details": str(e)}), 500

    finally:
        if conn:
            try:
                conn.close()
            except Exception:
                pass


@rpa_lead_bp.route("/api/rpa-lead/process/<int:process_id>", methods=["GET"])
@token_required
def get_single_process(process_id):
    """
    Get a single process by ID.
    """
    conn, DBSCHEMA = _get_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    try:
        result = _execute_process_query(conn, DBSCHEMA, process_id)
        
        if not result:
            return jsonify({"success": False, "message": "Process not found"}), 404

        return jsonify({
            "success": True,
            "data": result[0]
        })

    except pymssql.Error as e:
        current_app.logger.exception("DB error in /api/rpa-lead/process/<id>")
        return jsonify({"success": False, "error": "Database error", "details": str(e)}), 500

    except Exception as e:
        current_app.logger.exception("Unhandled error in /api/rpa-lead/process/<id>")
        return jsonify({"success": False, "error": "Server error", "details": str(e)}), 500

    finally:
        if conn:
            try:
                conn.close()
            except Exception:
                pass