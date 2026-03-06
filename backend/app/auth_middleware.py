import jwt
from flask import request, jsonify, current_app
from functools import wraps

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == "OPTIONS":
            return f(*args, **kwargs)

        token = None

        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            token = (
                auth_header.split(" ")[1]
                if auth_header.startswith("Bearer ")
                else auth_header
            )

        if not token:
            return jsonify({"message": "Token is missing!"}), 401

        try:
            decoded = jwt.decode(
                token,
                current_app.config["SECRET_KEY"],
                algorithms=["HS256"]
            )

            user_id = decoded.get("UserId")
            if not user_id:
                return jsonify({"message": "Invalid token: UserId missing"}), 401

            request.user = {
                "UserId":     user_id,
                "UserName":   decoded.get("UserName"),
                "RoleId":     decoded.get("RoleId"),
                "RoleName":   decoded.get("RoleName", ""),  # ← from JWT
                "CompanyIds": decoded.get("CompanyIds"),
            }

        except jwt.ExpiredSignatureError:
            return jsonify({
                "error":   "TOKEN_EXPIRED",
                "message": "Session expired"
            }), 401

        except jwt.InvalidTokenError:
            return jsonify({
                "error":   "INVALID_TOKEN",
                "message": "Invalid authentication token"
            }), 401

        return f(*args, **kwargs)

    return decorated