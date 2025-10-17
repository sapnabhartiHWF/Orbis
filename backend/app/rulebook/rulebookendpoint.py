from flask import Blueprint,jsonify
from .rulebook import get_rulebook_data

rulebook_blueprint = Blueprint('rulebook', __name__)

@rulebook_blueprint.route('/',methods=['GET'])
def index():
    return jsonify({'staus': 'success', 'message': get_rulebook_data()})
# ...existing code...