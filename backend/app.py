from flask import Flask, request, jsonify
from app.rulebook.rulebookendpoint import rulebook_bp
from flask_cors import CORS
from flask_compress import Compress
from app.file_management.uploadpopup_api import process_api
from app.file_management.process_onboarding import process_onboarding_bp
from app.auth import auth_bp
from app.file_management.file_management import file_bp
from app.notifications import team_notifications_bp
from app.discussion import discussion_bp
from dotenv import load_dotenv
import os
from app.User import user_bp
from app.TeamAssignment import team_assignment_bp
from app.Operations.operationapi import operation_bp
from app.Tickets import tickets_bp
from app.exception_managemt.create_exception_endpoint import exception_blueprint
from app.Bots.Bots import bots_bp
from app.center_of_excellence.process_stages import process_stages_bp
from app.center_of_excellence import stages_approval  
from app.center_of_excellence import deleteStage  
from app.center_of_excellence.download_apis import download_bp
from app.center_of_excellence import update_stages
from app.center_of_excellence import resubmitStages
from app.center_of_excellence.automationRoadmap import automation_roadmap_bp
from app.insert_bwi_data.insert_bwi_endpoint import insert_bwi_blueprint
from app.file_management.RPA_User.Rpa_AssignTask import assignment_bp
from app.extractedEmailData import emails_bp
from app.SLA.sla_service import sla_bp
from app.RpaLead.RpaLead import rpa_lead_bp
from config import Config

load_dotenv()
app = Flask(__name__)

# Load configuration (including UiPath settings) from Config
app.config.from_object(Config)
app.secret_key = os.environ.get("SECRET_KEY")
if not app.secret_key:
    raise RuntimeError("SECRET_KEY is not set! Set it as an environment variable.")
Compress(app)

# Configure CORS for frontend origins
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
             "http://localhost:8080",
            "http://127.0.0.1:8080",
            "http://192.168.29.23:8080",
            "https://icatui-b74o.onrender.com",
            "https://newsantova.onrender.com",
            "http://192.168.29.65:8080",
            "http://172.26.80.1:8080/",
            "http://172.25.224.1:8080/",
            "http://172.23.208.1:8080/",
            "https://orbis-santova.alphalogix.tech",
            "https://orbis-icat.alphalogix.tech"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
}, supports_credentials=True)

@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")
    allowed_origins = [
        "http://192.168.29.65:8080",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "https://orbis-santova.alphalogix.tech",
        "https://newsantova.onrender.com",
        "https://orbis-icat.alphalogix.tech"
    ]
    if origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    # Handle preflight requests
    if request.method == "OPTIONS":
        response.status_code = 200
    return response

# Register Blueprints
app.register_blueprint(rulebook_bp)
app.register_blueprint(process_api)
app.register_blueprint(process_onboarding_bp)
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(file_bp) 
app.register_blueprint(team_notifications_bp)
app.register_blueprint(discussion_bp)
app.register_blueprint(user_bp)
app.register_blueprint(team_assignment_bp)
app.register_blueprint(operation_bp)
app.register_blueprint(tickets_bp)
app.register_blueprint(exception_blueprint)
app.register_blueprint(bots_bp)
app.register_blueprint(process_stages_bp)
app.register_blueprint(download_bp)
app.register_blueprint(automation_roadmap_bp)
app.register_blueprint(insert_bwi_blueprint)
app.register_blueprint(assignment_bp)
app.register_blueprint(emails_bp)
app.register_blueprint(sla_bp)
app.register_blueprint(rpa_lead_bp)
if __name__ == "__main__":
    app.run('0.0.0.0', debug=False, port=8000)
