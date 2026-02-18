from flask import Blueprint, jsonify, current_app
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required
from app.utils.db_schema import get_db_schema
import pymssql

automation_roadmap_bp = Blueprint('automation_roadmap_bp', __name__)


from flask import Blueprint, jsonify, current_app
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required
from app.utils.db_schema import get_db_schema
import pymssql

automation_roadmap_bp = Blueprint('automation_roadmap_bp', __name__)


@automation_roadmap_bp.route("/api/automation-roadmap", methods=["GET"])
@token_required
def automation_roadmap():
    """
    Get automation roadmap data including process cards and milestones.
    Uses stored procedure GetAutomationRoadmap which returns two result sets:
      RS1 - Process cards (ProcessId, Title, Description, Priority, Department,
                           EstimatedROI, CurrentStage, Status, TimelineStart,
                           TimelineEnd, Progress, SubmittedBy)
      RS2 - Milestones    (ProcessId, StageName, SequenceOrder, status,
                           movedAt, MovedByName, IsCompleted)
    """
    conn   = None
    cursor = None

    try:
        DBSCHEMA = get_db_schema()
        current_app.logger.info(f"[Automation Roadmap] Using schema: {DBSCHEMA}")

        conn = connect_to_database()
        if not conn:
            error_msg = "Database connection failed"
            current_app.logger.error(f"[Automation Roadmap] {error_msg}")
            return jsonify({"success": False, "error": error_msg}), 500

        cursor = conn.cursor()

        # ── Execute SP ────────────────────────────────────────────
        cursor.execute(f"EXEC {DBSCHEMA}.GetAutomationRoadmap")

        # ── Result Set 1: Process Cards ───────────────────────────
        if not cursor.description:
            return jsonify({"success": False, "error": "No data returned from stored procedure"}), 500

        columns   = [col[0] for col in cursor.description]
        processes = [dict(zip(columns, row)) for row in cursor.fetchall()]

        for p in processes:
            p["EstimatedROI"] = float(p["EstimatedROI"]) if p["EstimatedROI"] is not None else 0.0
            p["Progress"]     = int(p["Progress"])       if p["Progress"]     is not None else 0
            p["TimelineStart"] = (
                p["TimelineStart"].isoformat()
                if p.get("TimelineStart") and hasattr(p["TimelineStart"], "isoformat")
                else p.get("TimelineStart")
            )
            p["TimelineEnd"] = (
                p["TimelineEnd"].isoformat()
                if p.get("TimelineEnd") and hasattr(p["TimelineEnd"], "isoformat")
                else p.get("TimelineEnd")
            )

        # ── Result Set 2: Milestones ──────────────────────────────
        milestones = []
        try:
            if cursor.nextset() and cursor.description:
                ms_columns = [col[0] for col in cursor.description]
                milestones = [dict(zip(ms_columns, row)) for row in cursor.fetchall()]

                for m in milestones:
                    m["movedAt"] = (
                        m["movedAt"].isoformat()
                        if m.get("movedAt") and hasattr(m["movedAt"], "isoformat")
                        else m.get("movedAt")
                    )
        except Exception as nextset_error:
            current_app.logger.warning(
                f"[Automation Roadmap] Could not fetch milestones: {str(nextset_error)}"
            )

        # ── Nest milestones into each process ─────────────────────
        milestones_map = {}
        for m in milestones:
            pid = m.get("ProcessId")
            if pid:
                milestones_map.setdefault(pid, []).append(m)

        for p in processes:
            pid             = p.get("ProcessId")
            p["milestones"] = milestones_map.get(pid, []) if pid else []

        return jsonify({
            "success": True,
            "count":   len(processes),
            "data":    processes
        }), 200

    except pymssql.DatabaseError as e:
        error_msg = f"Database error: {str(e)}"
        current_app.logger.error(f"[Automation Roadmap] {error_msg}", exc_info=True)
        return jsonify({"success": False, "error": error_msg}), 500
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        current_app.logger.error(f"[Automation Roadmap] {error_msg}", exc_info=True)
        return jsonify({"success": False, "error": error_msg}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
