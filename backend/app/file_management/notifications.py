
from flask import Blueprint, request, jsonify, current_app
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required


notifications_bp = Blueprint("notifications_bp", __name__)

@notifications_bp.route("/api/notifications", methods=["GET"])
@token_required
def get_user_notifications():
    user_id = request.user.get("UserId")
    # user_name = request.user.get("UserName")
    """
    Get notifications for the logged-in user using santova.GetUserNotifications.
    Includes RedirectUrl and Metadata for frontend navigation.
    """
    from app.utils.db_schema import get_db_schema
    DBSCHEMA = get_db_schema()

    conn = None
    cursor = None
    try:
        conn = connect_to_database()
        cursor = conn.cursor(as_dict=True)

        cursor.execute(
            f"EXEC {DBSCHEMA}.GetUserNotifications @UserId=%s",
            (user_id,),
        )
        rows = cursor.fetchall()
        notifications = []
        for row in rows:
            notifications.append({
                "notificationId": row.get("NotificationId"),
                "title": row.get("Title"),
                "message": row.get("Message"),
                "entityType": row.get("EntityType"),
                "entityId": row.get("EntityId"),
                "isRead": row.get("IsRead"),
                "createdDate": row.get("CreatedDate"),
                "fileName": row.get("FileName"),
                "fileType": row.get("FileType"),
                "redirectUrl": row.get("RedirectUrl"),
            })
        return jsonify({"success": True, "notifications": notifications})
    except Exception as e:
        current_app.logger.error(f"Error fetching notifications for user {user_id}: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()



@notifications_bp.route("/api/notifications/mark-read", methods=["POST"])
@token_required
def mark_notification_read():
    # user_id = request.user.get("UserId")
    # user_name = request.user.get("UserName")
  """
  Mark a notification as read using santova.MarkNotificationAsRead.
  """
  data = request.get_json(silent=True) or {}
  notification_id = data.get("NotificationId") or data.get("notificationId")

  if not notification_id:
    return (
      jsonify(
        {"success": False, "message": "NotificationId is required"}
      ),
      400,
    )

  from app.utils.db_schema import get_db_schema
  DBSCHEMA = get_db_schema()

  conn = None
  cursor = None
  try:
    conn = connect_to_database()
    cursor = conn.cursor()

    cursor.execute(
      f"EXEC {DBSCHEMA}.MarkNotificationAsRead @NotificationId=%s",
      (notification_id,),
    )
    conn.commit()
    return jsonify({"success": True})
  except Exception as e:
    current_app.logger.error(
      f"Error marking notification {notification_id} as read: {e}"
    )
    return jsonify({"success": False, "message": str(e)}), 500
  finally:
    if cursor:
      cursor.close()
    if conn:
      conn.close()


@notifications_bp.route("/api/notify-automation-lead", methods=["POST"])
@token_required
def notify_automation_lead():
    # user_id = request.user.get("UserId")
    # user_name = request.user.get("UserName")
    """
    Notify Automation Leads when a file is uploaded.
    Uses santova.NotifyAutomationLead_OnFileUpload stored procedure.
    UploadedBy is automatically fetched from FileManagement.UserID.
    
    Expected JSON body:
    {
        "FileID": 123
    }
    """
    data = request.get_json(silent=True) or {}
    
    file_id = data.get("FileID") or data.get("fileId")
    
    if not file_id:
        return jsonify({"success": False, "message": "FileID is required"}), 400
    
    from app.utils.db_schema import get_db_schema
    DBSCHEMA = get_db_schema()
    
    conn = None
    cursor = None
    try:
        conn = connect_to_database()
        cursor = conn.cursor()
        
        # Get UploadedBy from FileManagement.UserID
        cursor.execute(
            f"SELECT UserID FROM DB_A4EFFD_Hybridwf.{DBSCHEMA}.FileManagement WHERE FileID = %s AND IsDeleted = 0",
            (file_id,)
        )
        result = cursor.fetchone()
        if not result:
            return jsonify({"success": False, "message": f"File with FileID={file_id} not found"}), 404
        uploaded_by = result[0]
        
        # Call stored procedure to create notifications for Automation Leads
        cursor.execute(
            f"EXEC {DBSCHEMA}.NotifyAutomationLead_OnFileUpload @FileID=%s, @UploadedBy=%s",
            (file_id, uploaded_by),
        )
        
        conn.commit()
        
        return jsonify({
            "success": True,
            "message": "Notifications sent to Automation Leads successfully",
            "data": {
                "FileID": file_id,
                "UploadedBy": uploaded_by,
            }
        })
    except Exception as e:
        if conn:
            conn.rollback()
        current_app.logger.error(
            f"Error notifying Automation Leads for FileID={file_id} uploaded by UserID={uploaded_by}: {e}"
        )
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@notifications_bp.route("/api/file-review", methods=["POST"])
@token_required
def save_file_review():
    user_id = request.user.get("UserId")
    # user_name = request.user.get("UserName")
    """
      Save or update Automation Lead feasibility review for a file.
      Uses santova.SaveFileReviewedByLead.

      Expected JSON body:
      {
      "FileID": 123,
      "IsRuleBased": true,
      "SystemAccessible": true,
      "ExceptionManageable": false,
      "ComplianceRisk": false,
      "Decision": "APPROVED" | "REJECTED" | "PARKED",
      "Remarks": "optional comments"
    }
    """
    data = request.get_json(silent=True) or {}

    file_id = data.get("FileID") or data.get("fileId")
    if not file_id:
      return jsonify({"success": False, "message": "FileID is required"}), 400

    # Normalize booleans to BIT (0/1)
    def to_bit(val):
      if val in (True, 1, "1", "true", "TRUE", "yes", "YES", "y", "Y"):
        return 1
      return 0

    is_rule_based = to_bit(data.get("IsRuleBased"))
    system_accessible = to_bit(data.get("SystemAccessible"))
    exception_manageable = to_bit(data.get("ExceptionManageable"))
    compliance_risk = to_bit(data.get("ComplianceRisk"))
    decision = (data.get("Decision") or "").upper().strip()
    remarks = data.get("Remarks")

    if decision not in ("APPROVED", "REJECTED", "PARKED"):
      return (
        jsonify(
          {
            "success": False,
            "message": "Decision must be one of: APPROVED, REJECTED, PARKED",
          }
        ),
        400,
      )

    from app.utils.db_schema import get_db_schema
    DBSCHEMA = get_db_schema()

    conn = None
    cursor = None
    try:
      conn = connect_to_database()
      cursor = conn.cursor()

      # Save / update feasibility review
      cursor.execute(
        f"""
        EXEC {DBSCHEMA}.SaveFileReviewedByLead
            @FileID=%s,
            @IsRuleBased=%s,
            @SystemAccessible=%s,
            @ExceptionManageable=%s,
            @ComplianceRisk=%s,
            @Decision=%s,
            @Remarks=%s,
            @ReviewedBy=%s
        """,
        (
          file_id,
          is_rule_based,
          system_accessible,
          exception_manageable,
          compliance_risk,
          decision,
          remarks,
          user_id,
        ),
      )
      
      # Optionally, update FileManagement.Status to reflect decision
      try:
        cursor.execute(
          f"""
          UPDATE DB_A4EFFD_Hybridwf.{DBSCHEMA}.FileManagement
          SET Status = %s
          WHERE FileID = %s
          """,
          (decision, file_id),
        )
      except Exception as status_err:
        current_app.logger.warning(
          f"Failed to update FileManagement.Status for FileID={file_id}: {status_err}"
        )

      conn.commit()

      return jsonify(
        {
          "success": True,
          "message": "Review saved successfully",
          "data": {
            "FileID": file_id,
            "IsRuleBased": bool(is_rule_based),
            "SystemAccessible": bool(system_accessible),
            "ExceptionManageable": bool(exception_manageable),
            "ComplianceRisk": bool(compliance_risk),
            "Decision": decision,
            "ReviewedBy": user_id,
          },
        }
      )
    except Exception as e:
      if conn:
        conn.rollback()
      current_app.logger.error(
        f"Error saving review for FileID={file_id} by UserID={user_id}: {e}"
      )
      return jsonify({"success": False, "message": str(e)}), 500
    finally:
      if cursor:
        cursor.close()
      if conn:
        conn.close()
