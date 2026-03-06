from flask import Blueprint, request, jsonify
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required
import json

team_assignment_bp = Blueprint("team_assignment_bp", __name__)

# -------------------------------------------------------
# INSERT TEAM ASSIGNMENT + MILESTONES
# -------------------------------------------------------

def insert_team_assignment_with_milestones(
    DBSCHEMA,
    assignment_name,
    priority,
    due_date,
    estimated_hours,
    assigned_to_ids_json,
    status,
    progress_percent,
    logged_in_user_id,
    milestones_json,
    process_id=None
):
    conn = connect_to_database()
    cursor = conn.cursor()

    try:
        assigned_to_ids_json_str = json.dumps(assigned_to_ids_json) if assigned_to_ids_json else None
        milestones_json_str = json.dumps(milestones_json) if milestones_json else None

        # Call stored procedure that handles assignment & milestones
        sql = f"""
        DECLARE @NewAssignmentId INT;
        EXEC {DBSCHEMA}.InsertTeamAssignmentWithMilestones
            @Assignment_Name = %s,
            @Priority = %s,
            @Due_Date = %s,
            @Estimated_Hours = %s,
            @AssignedToIdsJSON = %s,
            @Status = %s,
            @ProgressPercent = %s,
            @LoggedInUserId = %s,
            @MilestonesJSON = %s,
            @Process_Id = %s,
            @NewAssignmentId = @NewAssignmentId OUTPUT;

        SELECT @NewAssignmentId AS AssignmentId;
        """

        cursor.execute(sql, (
            assignment_name,
            priority,
            due_date,
            estimated_hours,
            assigned_to_ids_json_str,
            status,
            progress_percent,
            logged_in_user_id,
            milestones_json_str,
            process_id
        ))

        result = cursor.fetchone()
        new_assignment_id = result[0] if result else None
        conn.commit()

        return True, {"AssignmentId": new_assignment_id}

    except Exception as e:
        conn.rollback()
        print(f"❌ Error inserting team assignment: {e}")
        return False, str(e)

    finally:
        cursor.close()
        conn.close()


@team_assignment_bp.route("/api/insert-team-assignment", methods=["POST"])
@token_required
def insert_team_assignment_route():
    user_id = request.user.get("UserId")
    # user_name = request.user.get("UserName")
    data = request.json
    from app.utils.db_schema import get_db_schema
    DBSCHEMA = get_db_schema()

    required_fields = [
        "Assignment_Name", "Priority", "Due_Date", "Estimated_Hours", "AssignedToIds", "Status"
    ]
    for field in required_fields:
        if field not in data:
            return jsonify({"success": False, "message": f"Missing required field: {field}"}), 400

    assigned_to_ids = data.get("AssignedToIds")
    if not isinstance(assigned_to_ids, list) or not assigned_to_ids:
        return jsonify({"success": False, "message": "AssignedToIds must be a non-empty array"}), 400

    assigned_to_ids_formatted = [{"UserId": uid} for uid in assigned_to_ids]

    # Extract and validate Process_Id
    process_id_raw = data.get("Process_Id")
    process_id = None
    if process_id_raw is not None:
        try:
            process_id = int(process_id_raw) if not isinstance(process_id_raw, int) else process_id_raw
        except (ValueError, TypeError):
            process_id = None

    success, result = insert_team_assignment_with_milestones(
        DBSCHEMA=DBSCHEMA,
        assignment_name=data["Assignment_Name"],
        priority=data["Priority"],
        due_date=data["Due_Date"],
        estimated_hours=data["Estimated_Hours"],
        assigned_to_ids_json=assigned_to_ids_formatted,
        status=data["Status"],
        progress_percent=data.get("ProgressPercent", 0.00),
        logged_in_user_id=user_id,
        milestones_json=data.get("Milestones", []),
        process_id=process_id  # Fixed: Frontend sends Process_Id (with underscore)
    )

    if success:
        return jsonify({
            "success": True,
            "message": "Team assignment created successfully",
            "data": result
        }), 201
    return jsonify({
        "success": False,
        "message": f"Failed to create team assignment: {result}"
    }), 500


# -------------------------------------------------------
# GET TEAM ASSIGNMENTS
# -------------------------------------------------------

def get_team_assignments(DBSCHEMA, assignment_id=None, status_filter=None):
    conn = connect_to_database()
    cursor = conn.cursor()

    try:
        # Build SQL with appropriate parameters
        if assignment_id and status_filter:
            sql = f"EXEC {DBSCHEMA}.GetTeamAssignments @AssignmentId = %s, @StatusFilter = %s"
            cursor.execute(sql, (assignment_id, status_filter))
        elif assignment_id:
            sql = f"EXEC {DBSCHEMA}.GetTeamAssignments @AssignmentId = %s, @StatusFilter = NULL"
            cursor.execute(sql, (assignment_id,))
        elif status_filter:
            sql = f"EXEC {DBSCHEMA}.GetTeamAssignments @AssignmentId = NULL, @StatusFilter = %s"
            cursor.execute(sql, (status_filter,))
        else:
            sql = f"EXEC {DBSCHEMA}.GetTeamAssignments @AssignmentId = NULL, @StatusFilter = NULL"
            cursor.execute(sql)

        # Fetch first result set: Assignments
        assignment_rows = cursor.fetchall()
        assignment_columns = [column[0] for column in cursor.description]
        
        assignments = []
        for row in assignment_rows:
            assignment_dict = dict(zip(assignment_columns, row))
            assignment_dict['Milestones'] = []
            assignments.append(assignment_dict)
        
        # Create a dictionary for quick lookup by AssignmentId
        assignments_dict = {a['AssignmentId']: a for a in assignments}
        
        # Fetch second result set: Milestones
        if cursor.nextset():
            milestone_rows = cursor.fetchall()
            milestone_columns = [column[0] for column in cursor.description]
            
            for row in milestone_rows:
                milestone_dict = dict(zip(milestone_columns, row))
                assignment_id_key = milestone_dict['AssignmentId']
                
                if assignment_id_key in assignments_dict:
                    assignments_dict[assignment_id_key]['Milestones'].append(milestone_dict)

        return assignments

    except Exception as e:
        print(f"❌ Error fetching team assignments: {e}")
        raise e

    finally:
        cursor.close()
        conn.close()


@team_assignment_bp.route("/api/get-team-assignments", methods=["GET"])
@token_required
def get_team_assignments_route():
    # user_id = request.user.get("UserId")
    # user_name = request.user.get("UserName")
    assignment_id = request.args.get('assignmentId')
    status_filter = request.args.get('statusFilter')
    from app.utils.db_schema import get_db_schema
    DBSCHEMA = get_db_schema()
    
    try:
        assignment_id_int = int(assignment_id) if assignment_id else None
        assignments = get_team_assignments(DBSCHEMA=DBSCHEMA, assignment_id=assignment_id_int, status_filter=status_filter)
        
        return jsonify({
            "success": True,
            "data": assignments,
            "count": len(assignments)
        }), 200

    except ValueError:
        return jsonify({
            "success": False,
            "message": "Invalid assignmentId format. Must be a number."
        }), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to fetch team assignments: {str(e)}"
        }), 500


# -------------------------------------------------------
# UPDATE MILESTONE STATUS (Trigger-Driven)
# -------------------------------------------------------

def update_milestone_status(DBSCHEMA, milestone_id, status, logged_in_user_id):
    conn = connect_to_database()
    cursor = conn.cursor()

    try:
        # Map frontend status to database values
        # Frontend sends: "Assigned", "In Process", "Completed"
        status_lower = status.lower().strip()
        if status_lower in ["assigned"]:
            db_status = "Assigned"
        elif status_lower in ["in process", "in-process", "in progress"]:
            db_status = "In Process"
        elif status_lower in ["completed", "complete"]:
            db_status = "Completed"
        elif status_lower in ["overdue"]:
            db_status = "Overdue"
        else:
            # If already in correct format, use as is
            db_status = status

        # Update milestone only — triggers handle logs & assignment updates
        sql = f"""
        UPDATE {DBSCHEMA}.Milestone
        SET 
            Status = %s,
            UpdatedById = %s,
            UpdatedDate = GETDATE(),
            CompletedById = CASE WHEN %s = 'Completed' THEN %s ELSE NULL END
        WHERE Mid = %s AND isDeleted = 0
        """
        cursor.execute(sql, (db_status, logged_in_user_id, db_status, logged_in_user_id, milestone_id))

        if cursor.rowcount == 0:
            return False, "Milestone not found or already deleted"

        conn.commit()

        # Fetch current milestone + assignment data after trigger effects
        cursor.execute(f"""
        SELECT 
            m.Mid AS MilestoneId,
            m.A_id AS AssignmentId,
            m.Status AS MilestoneStatus,
            ta.Status AS AssignmentStatus,
            ta.ProgressPercent AS AssignmentProgress
        FROM {DBSCHEMA}.Milestone m
        INNER JOIN {DBSCHEMA}.Team_Assignment ta ON m.A_id = ta.A_Id
        WHERE m.Mid = %s
        """, (milestone_id,))

        row = cursor.fetchone()
        if not row:
            return True, {"message": "Milestone updated, but no linked assignment found."}

        columns = [col[0] for col in cursor.description]
        return True, dict(zip(columns, row))

    except Exception as e:
        conn.rollback()
        print(f"❌ Error updating milestone status: {e}")
        return False, str(e)

    finally:
        cursor.close()
        conn.close()


@team_assignment_bp.route("/api/update-milestone-status", methods=["OPTIONS"])
def update_milestone_status_options():
    """Handle CORS preflight requests"""
    return jsonify({"ok": True}), 200


@team_assignment_bp.route("/api/update-milestone-status", methods=["PUT"])
@token_required
def update_milestone_status_route():
    user_id = request.user.get("UserId")
    # user_name = request.user.get("UserName")
    data = request.json
    from app.utils.db_schema import get_db_schema
    DBSCHEMA = get_db_schema()

    if "MilestoneId" not in data or "Status" not in data:
        return jsonify({"success": False, "message": "Missing MilestoneId or Status"}), 400

    success, result = update_milestone_status(
        DBSCHEMA=DBSCHEMA,
        milestone_id=data["MilestoneId"],
        status=data["Status"],
        logged_in_user_id=user_id
    )

    if success:
        return jsonify({
            "success": True,
            "message": "Milestone status updated successfully",
            "data": result
        }), 200
    else:
        return jsonify({
            "success": False,
            "message": f"Failed to update milestone status: {result}"
        }), 500
