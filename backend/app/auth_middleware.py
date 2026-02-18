import jwt
import inspect
from flask import request, jsonify, current_app
from functools import wraps

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == "OPTIONS":
            return f(*args, **kwargs)

        token = None

        # Get token from "Authorization" header
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
            else:
                token = auth_header

        if not token:
            return jsonify({"message": "Token is missing!"}), 401

        try:
            decoded = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
            user_id = decoded.get("UserId")
            user_name = decoded.get("UserName")
            role_id = decoded.get("RoleId")

            if not user_id:
                return jsonify({"message": "Invalid token: user_id missing"}), 401

        except jwt.ExpiredSignatureError:
            return jsonify({
                "error": "TOKEN_EXPIRED",
                "message": "Session expired"
            }), 401

        except jwt.InvalidTokenError:
            return jsonify({
                "error": "INVALID_TOKEN",
                "message": "Invalid authentication token"
            }), 401

        request.user = {
            "UserId": user_id,
            "UserName": user_name,
            "RoleId": role_id,
            "CompanyIds": decoded.get("CompanyIds")
        }

        return f(*args, **kwargs)

    return decorated
