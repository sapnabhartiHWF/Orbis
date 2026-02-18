from flask import Blueprint, request, jsonify, current_app
from app.auth_middleware import token_required
from app.rulebook.rulebook import get_rulebook_data
from app.rulebook.rulebook import create_rule_change_request
from app.rulebook.rulebook import review_rule_change
from app.rulebook.rulebook import get_rule_versions
from app.rulebook.rulebook import get_rule_change_requests

rulebook_bp = Blueprint("rulebook_bp", __name__)

@rulebook_bp.route('/api/rulebook', methods=['GET'])
@token_required
def get_rulebook_route():
    # user_id = request.user.get("UserId")
    # user_name = request.user.get("UserName")
    try:
        bot_id = request.args.get("bot_id", type=int)
        page_number = request.args.get("page_number", type=int, default=1)
        page_size = request.args.get("page_size", type=int, default=50)
        rulebooks = get_rulebook_data(bot_id, page_number, page_size)

        return jsonify({
            "success": True,
            "rulebooks": rulebooks,
            "pageNumber": page_number,
            "pageSize": page_size
        }), 200

    except Exception as e:
        current_app.logger.error(str(e))
        import traceback
        current_app.logger.error(traceback.format_exc())

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


@rulebook_bp.route("/api/rulebook/request-change", methods=["POST"])
@token_required
def request_rule_change_route():
    try:
        data = request.json

        request_id = create_rule_change_request(
            rule_id=data.get("rule_id"),
            proposed_subject=data.get("proposed_subject"),
            proposed_description=data.get("proposed_description"),
            proposed_rule_logic=data.get("proposed_rule_logic"),
            proposed_bot_id=data.get("proposed_bot_id"),
            change_summary=data.get("change_summary"),
            requested_by_id=request.user.get("UserId"),
            requested_by_name=request.user.get("UserName"),
        )

        # 🔔 SEND EMAIL ONLY AFTER SUCCESSFUL INSERT
        try:
            email_schema = get_db_schema()
            notify_automation_engineers_on_rule_change(
                DBSCHEMA=email_schema,
                rule_id=data.get("rule_id"),
                proposed_subject=data.get("proposed_subject"),
                proposed_description=data.get("proposed_description"),
                requested_by_name=request.user.get("UserName"),
            )
        except Exception as e:
            current_app.logger.error(f"Email notification failed: {str(e)}")

        return jsonify({
            "success": True,
            "message": "Change request submitted successfully",
            "request_id": request_id
        }), 201

    except Exception as e:
        current_app.logger.error(str(e))
        return jsonify({"success": False, "message": str(e)}), 500


@rulebook_bp.route("/api/rulebook/change-requests", methods=["GET"])
@token_required
def get_rule_change_requests_route():
    try:
        status = request.args.get("status")
        rule_id = request.args.get("rule_id", type=int)

        # Only fetch requests for rules the logged-in user owns
        reviewer_id = request.user.get("UserId")
        if not reviewer_id:
            return jsonify({"success": False, "message": "User not authenticated"}), 401

        requests = get_rule_change_requests(
            status=status,
            rule_id=rule_id,
            reviewer_id=reviewer_id
        )

        return jsonify({
            "success": True,
            "requests": requests
        }), 200
        
    except Exception as e:
        current_app.logger.error(str(e))
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


@rulebook_bp.route("/api/rulebook/review", methods=["POST"])
@token_required
def review_rule_change_route():
    try:
        data = request.json
        request_id = data.get("request_id")
        action = data.get("action")  # "Approve" or "Reject"
        comments = data.get("comments")

        reviewer_id = request.user.get("UserId")
        reviewer_name = request.user.get("UserName")

        review_rule_change(request_id, action, reviewer_id, reviewer_name, comments)

        return jsonify({"success": True, "message": f"Request {action}d"}), 200

    except Exception as e:
        current_app.logger.error(str(e))
        return jsonify({"success": False, "message": str(e)}), 500

@rulebook_bp.route("/api/rulebook/<int:rule_id>/versions", methods=["GET"])
@token_required
def get_versions_route(rule_id):
    try:
        versions = get_rule_versions(rule_id)
        return jsonify({"success": True, "versions": versions}), 200
    except Exception as e:
        current_app.logger.error(str(e))
        return jsonify({"success": False, "message": str(e)}), 500

