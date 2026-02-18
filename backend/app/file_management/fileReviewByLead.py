from flask import request, jsonify, current_app
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required
from app.file_management.file_management import file_bp

@file_bp.route("/api/file-review", methods=["POST"])
@token_required
def review_file_route():
    user_id = request.user.get("UserId")
    # user_name = request.user.get("UserName")
    role_id = request.user.get("RoleId")
    """
    Automation Lead reviews a file (Approve / Reject)
    Only RoleId = 14 is allowed
    """

    data = request.get_json()

    file_id = data.get("FileID") or data.get("fileId")
    decision = (data.get("Decision") or "").upper().strip()
    remarks = data.get("Remarks")

    is_rule_based = data.get("IsRuleBased")
    system_accessible = data.get("SystemAccessible")
    exception_manageable = data.get("ExceptionManageable")
    compliance_risk = data.get("ComplianceRisk")

    # 🔒 Role validation
    AUTOMATION_LEAD_ROLE_ID = 14
    if role_id != AUTOMATION_LEAD_ROLE_ID:
        return jsonify({
            "success": False,
            "message": "Unauthorized: Only Automation Lead can review files"
        }), 403

    if not file_id or decision not in ("APPROVED", "REJECTED"):
        return jsonify({
            "success": False,
            "message": "FileID and valid Decision (APPROVED / REJECTED) are required"
        }), 400

    # Convert checkbox values to BIT
    def to_bit(val):
        return 1 if val in (True, 1, "1", "true", "TRUE", "yes", "YES") else 0

    from app.utils.db_schema import get_db_schema
    DBSCHEMA = get_db_schema()

    conn = connect_to_database()
    cursor = conn.cursor()

    try:
        cursor.execute(f"""
            EXEC {DBSCHEMA}.SaveFileReviewedByLead
                @FileID = %s,
                @IsRuleBased = %s,
                @SystemAccessible = %s,
                @ExceptionManageable = %s,
                @ComplianceRisk = %s,
                @Decision = %s,
                @Remarks = %s,
                @ReviewedBy = %s,
                @RoleId = %s
        """, (
            int(file_id),
            to_bit(is_rule_based),
            to_bit(system_accessible),
            to_bit(exception_manageable),
            to_bit(compliance_risk),
            decision,
            remarks if remarks else None,
            int(user_id),
            int(role_id)
        ))

        conn.commit()

        return jsonify({
            "success": True,
            "message": f"File reviewed successfully ({decision})",
            "FileID": file_id,
            "Decision": decision
        }), 200

    except Exception as e:
        conn.rollback()
        current_app.logger.error(f"File review failed: {e}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()