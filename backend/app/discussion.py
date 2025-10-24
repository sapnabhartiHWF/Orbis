from flask import Blueprint, request, jsonify
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required  # ✅ use JWT for authentication
import json

# Create blueprint for discussion routes
discussion_bp = Blueprint("discussion_bp", __name__)


def insert_comment(user_id, comment_text, parent_id=None, mentioned_user_ids=None):
    """
    Calls santova.InsertComment stored procedure.
    Supports optional mentions via JSON array.
    """
    conn = connect_to_database()
    cursor = conn.cursor()

    try:
        mentioned_json = json.dumps(mentioned_user_ids) if mentioned_user_ids else None

        sql = """
        DECLARE @NewCommentID INT;
        EXEC santova.InsertComment
            @UserID = %s,
            @ParentID = %s,
            @CommentText = %s,
            @MentionedUserIDs = %s,
            @NewCommentID = @NewCommentID OUTPUT;
        SELECT @NewCommentID AS NewCommentID;
        """

        cursor.execute(sql, (user_id, parent_id, comment_text, mentioned_json))
        result = cursor.fetchone()
        new_comment_id = result[0] if result else None

        conn.commit()
        return True, new_comment_id

    except Exception as e:
        conn.rollback()
        return False, str(e)

    finally:
        cursor.close()
        conn.close()


@discussion_bp.route("/api/add-comment", methods=["POST"])
@token_required  # ✅ secure with JWT
def add_comment(user_id, user_name):
    """
    Add a new comment (supports mentions and replies).
    JWT provides user_id and user_name.
    """
    data = request.json
    comment_text = data.get("CommentText")
    parent_id = data.get("ParentID")
    mentioned_user_ids = data.get("MentionedUserIDs")

    if not comment_text:
        return jsonify({"success": False, "message": "CommentText is required"}), 400

    success, result = insert_comment(user_id, comment_text, parent_id, mentioned_user_ids)

    if success:
        return jsonify({
            "success": True,
            "CommentID": result,
            "UserID": user_id,
            "UserName": user_name,
            "ParentID": parent_id,
            "CommentText": comment_text,
            "MentionedUserIDs": mentioned_user_ids or []
        }), 200
    else:
        return jsonify({"success": False, "message": result}), 500


def get_comments_with_reacts():
    conn = connect_to_database()
    cursor = conn.cursor()
    try:
        cursor.execute("EXEC santova.GetCommentsWithReacts")
        results = cursor.fetchall()

        comments_dict = {}

        for row in results:
            comment_id = row[0]
            comment_text = row[1] or ""
            user_id = row[2]
            user_name = row[3] or "Unknown User"
            created_date = row[4]
            parent_id = row[5]
            r_id = row[6]  # can be None
            emoji_name = row[7] or ""
            reaction_count = row[8] or 0

            if comment_id not in comments_dict:
                comments_dict[comment_id] = {
                    "CommentID": comment_id,
                    "CommentText": comment_text,
                    "UserID": user_id,
                    "UserName": user_name,
                    "CreatedDate": created_date,
                    "ParentID": parent_id,
                    "Reactions": [],
                }

            if r_id:
                comments_dict[comment_id]["Reactions"].append({
                    "R_Id": r_id,
                    "EmojiName": emoji_name,
                    "ReactionCount": reaction_count,
                })

        return list(comments_dict.values())

    finally:
        cursor.close()
        conn.close()




@discussion_bp.route("/api/get-comments", methods=["GET"])
@token_required
def get_comments_route(user_id, user_name):
    try:
        data = get_comments_with_reacts()
        return jsonify({"success": True, "data": data})
    except Exception as e:
        import traceback
        print("Error fetching comments:", str(e))
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


# Get All React List
def get_all_emojis():
    """
    Fetch all emojis from santova.Reacts using GetAllReacts SP.
    """
    conn = connect_to_database()
    cursor = conn.cursor()
    try:
        # Execute stored procedure
        cursor.execute("EXEC santova.GetAllReacts")
        results = cursor.fetchall()
        # Convert to list of dicts
        return [{"R_Id": row[0], "EmojiName": row[1]} for row in results]
    finally:
        cursor.close()
        conn.close()

@discussion_bp.route("/api/get-all-reacts", methods=["GET"])
@token_required
def get_all_reacts_route(user_id, user_name):
    """
    API to get the list of all emojis (React list)
    """
    data = get_all_emojis()
    return jsonify({"success": True, "data": data})



def insert_reaction(comment_id, user_id, r_id):
    """
    Inserts a reaction for a comment by a user.
    """
    conn = connect_to_database()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "EXEC santova.InsertCmtReaction @CommentID=%s, @UserID=%s, @R_Id=%s",
            (comment_id, user_id, r_id)
        )
        conn.commit()
        return True, "Reaction added successfully."
    except Exception as e:
        conn.rollback()
        return False, str(e)
    finally:
        cursor.close()
        conn.close()

# insert mapped reaction count per count
@discussion_bp.route("/api/react-comment", methods=["POST"])
@token_required
def react_comment_route(user_id, user_name):
    """
    Body JSON: { "CommentID": 1, "R_Id": 2 }
    """
    data = request.json
    comment_id = data.get("CommentID")
    r_id = data.get("R_Id")

    if not comment_id or not r_id:
        return jsonify({"success": False, "message": "CommentID and R_Id are required"}), 400

    success, message = insert_reaction(comment_id, user_id, r_id)
    if success:
        return jsonify({"success": True, "message": message})
    else:
        return jsonify({"success": False, "message": message}), 500

