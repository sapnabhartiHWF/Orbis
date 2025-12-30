from flask import Blueprint,jsonify
from .rulebook import get_rulebook_data
from flask import request
from app.auth_middleware import token_required

rulebook_blueprint = Blueprint('rulebook', __name__)

@rulebook_blueprint.route('/',methods=['GET'])
@token_required
def index(user_id, user_name):
    host = request.headers.get("Origin")
    DBSCHEMA = "santova"
    if host == "https://orbis-icat.alphalogix.tech":
        DBSCHEMA = "ICAT"
    return jsonify({'staus': 'success', 'message': get_rulebook_data(DBSCHEMA)})
# ...existing code...