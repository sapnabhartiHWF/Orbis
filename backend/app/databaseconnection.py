import pymssql
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def db_connect():
    # Read database credentials from environment variables
    server = os.environ.get("server_name")
    user = os.environ.get("username")
    password = os.environ.get("db_password")
    database = os.environ.get("database_name")
    port = int(os.environ.get("port", "1433"))
    
    return pymssql.connect(
        server=server,
        user=user,
        password=password,
        database=database,
        port=port
    )