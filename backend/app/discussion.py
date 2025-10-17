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


def get_all_comments_from_db():
    """
    Fetch all comments, replies, mentions, and reactions using the SP.
    """
    conn = connect_to_database()
    cursor = conn.cursor()

    try:
        cursor.execute("EXEC santova.GetAllComment")
        columns = [col[0] for col in cursor.description]
        rows = cursor.fetchall()

        comments = []
        for row in rows:
            comment = dict(zip(columns, row))

            # Safely parse JSON fields
            for key in ["MentionedUsersInfo", "Reactions"]:
                if comment.get(key):
                    try:
                        comment[key] = json.loads(comment[key])
                    except:
                        comment[key] = []
                else:
                    comment[key] = []

            comments.append(comment)

        return comments

    except Exception as e:
        raise e

    finally:
        cursor.close()
        conn.close()


@discussion_bp.route("/api/get-comments", methods=["GET"])
@token_required
def get_comments_route(user_id, user_name):
    try:
        comments = get_all_comments_from_db()
        return jsonify({"success": True, "comments": comments}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


def insert_emoji_to_db(emoji_name: str):
    """
    Inserts a new emoji into santova.Reacts table.
    Returns new R_Id if successful.
    """
    if not emoji_name:
        raise ValueError("EmojiName is required")

    conn = connect_to_database()
    cursor = conn.cursor()

    try:
        sql = "INSERT INTO santova.Reacts (EmojiName) VALUES (%s); SELECT SCOPE_IDENTITY();"
        cursor.execute(sql, (emoji_name,))
        new_id = cursor.fetchone()[0]
        conn.commit()
        return new_id
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()


@discussion_bp.route("/api/insert-reactions", methods=["POST"])
@token_required
def add_emoji(user_id, user_name):
    """
    Adds a new emoji to the Reacts table.
    """
    data = request.json
    emoji_name = data.get("emojiName")

    if not emoji_name:
        return jsonify({"message": "EmojiName is required", "success": False}), 400

    try:
        new_id = insert_emoji_to_db(emoji_name)
        return jsonify({"message": "Emoji added successfully", "R_Id": new_id, "success": True})
    except Exception as e:
        return jsonify({"message": str(e), "success": False}), 500



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
