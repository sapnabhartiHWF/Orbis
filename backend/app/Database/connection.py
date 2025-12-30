import pymssql
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def connect_to_database():
    """
    Establish a connection to the database using pymssql.
    Reads database credentials from environment variables.
    
    Returns:
        pymssql.Connection: A connection object to the database.
    """
    try:
        # Read database credentials from environment variables
        server = os.environ.get("server")
        user = os.environ.get("user")
        password = os.environ.get("password")
        database = os.environ.get("database")
        
        conn = pymssql.connect(server=server,
                               user=user,
                               password=password,
                               database=database)
        print("Connection successful")
        return conn
    except pymssql.Error as e:
        print(f"Error connecting to the database: {e}")
        return None