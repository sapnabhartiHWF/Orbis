from flask import Blueprint, jsonify, request
from .insert_datat import insert_bwi_data, send_email

insert_bwi_blueprint = Blueprint('insert_bwi', __name__)

@insert_bwi_blueprint.route('/api/insert-bwi',methods=['POST'])
def insert_bwi():
    #print("=== INSERT BWI ENDPOINT CALLED ===", flush=True)
    try:
        request_data = request.json
        print(f"Request received. Has data field: {'data' in request_data if request_data else False}", flush=True)
        if not request_data or 'data' not in request_data:
            return jsonify({'status': 'error', 'message': 'Missing "data" field in request'}), 400
        
        data = request_data['data']
        if not isinstance(data, list):
            return jsonify({'status': 'error', 'message': '"data" must be an array'}), 400
        
        if len(data) == 0:
            return jsonify({'status': 'error', 'message': 'Data array is empty'}), 400
        
        #print("Data: ", data, flush=True)
        result = insert_bwi_data(data)
        #print("Result: ", result, flush=True)
        send_email()
        return jsonify({'status': 'success', 'message': result})
    except KeyError as e:
        return jsonify({'status': 'error', 'message': f'Missing required field: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500