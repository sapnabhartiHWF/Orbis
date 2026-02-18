# extractedEmailData.py
from flask import Blueprint, jsonify, request, current_app
from app.db_schema_utils import get_bot_schema
from app.Database.connection_pool import connect_to_database
from app.databaseconnection import db_connect
import pymssql


# Blueprint for email-related routes
emails_bp = Blueprint("emails", __name__)


def _get_connection():
    """
    Match the project's existing DB routing:
    - ICAT / localhost uses `db_connect()`
    - Santova uses pooled `connect_to_database()`
    """
    DBSCHEMA = get_bot_schema()
    use_db_connect = DBSCHEMA != "santova"
    conn = db_connect() if use_db_connect else connect_to_database()
    return conn, DBSCHEMA

# -------------------------------
# GET ALL EMAILS (with filters)
# -------------------------------
@emails_bp.route("/api/emails", methods=["GET"])
def get_emails():
    email_id_raw = request.args.get("emailId")
    from_date = request.args.get("fromDate") or None
    to_date = request.args.get("toDate") or None

    # Normalize emailId: allow empty -> None, else int
    email_id = None
    if email_id_raw not in (None, ""):
        try:
            email_id = int(email_id_raw)
        except (TypeError, ValueError):
            return jsonify({"message": "Invalid emailId (must be an integer)"}), 400

    conn, DBSCHEMA = _get_connection()
    if not conn:
        return jsonify({"message": "Database connection failed"}), 500

    cursor = None
    try:
        cursor = conn.cursor()
        proc = f"db_Icat.{DBSCHEMA}.GetEmailDetails"

        # pymssql uses %s placeholders
        cursor.execute(f"EXEC {proc} %s, %s, %s", (email_id, from_date, to_date))

        columns = [column[0] for column in cursor.description] if cursor.description else []
        rows = cursor.fetchall()

        result = [dict(zip(columns, row)) for row in rows]
        return jsonify(result)

    except pymssql.Error as e:
        logger = getattr(current_app, "logger", None)
        if logger:
            logger.exception("DB error in /api/emails")
        return jsonify({"message": "Database error", "details": str(e)}), 500
    except Exception as e:
        logger = getattr(current_app, "logger", None)
        if logger:
            logger.exception("Unhandled error in /api/emails")
        return jsonify({"message": "Server error", "details": str(e)}), 500
    finally:
        try:
            if cursor:
                cursor.close()
        finally:
            try:
                conn.close()
            except Exception:
                pass


# -------------------------------
# GET EMAIL BY ID
# -------------------------------
@emails_bp.route("/api/emails/<int:email_id>", methods=["GET"])
def get_email_by_id(email_id):
    conn, DBSCHEMA = _get_connection()
    if not conn:
        return jsonify({"message": "Database connection failed"}), 500

    cursor = None
    try:
        cursor = conn.cursor()
        proc = f"db_Icat.{DBSCHEMA}.GetEmailDetails"
        cursor.execute(f"EXEC {proc} %s, %s, %s", (email_id, None, None))

        row = cursor.fetchone()
        if not row:
            return jsonify({"message": "Email not found"}), 404

        columns = [column[0] for column in cursor.description] if cursor.description else []
        result = dict(zip(columns, row))
        return jsonify(result)

    except pymssql.Error as e:
        logger = getattr(current_app, "logger", None)
        if logger:
            logger.exception("DB error in /api/emails/<id>")
        return jsonify({"message": "Database error", "details": str(e)}), 500
    except Exception as e:
        logger = getattr(current_app, "logger", None)
        if logger:
            logger.exception("Unhandled error in /api/emails/<id>")
        return jsonify({"message": "Server error", "details": str(e)}), 500
    finally:
        try:
            if cursor:
                cursor.close()
        finally:
            try:
                conn.close()
            except Exception:
                pass

