import pymssql
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def db_connect():
    """
    Establish a connection to the database using pymssql.
    Reads database credentials from environment variables.
    
    Environment Variables Required:
        - server_name: Database server hostname/IP
        - username: Database username
        - db_password: Database password
        - database_name: Database name
        - port: Database port (optional, defaults to 1433)
    
    Returns:
        pymssql.Connection: A connection object to the database, or None if connection fails.
    
    Raises:
        ValueError: If required environment variables are missing.
    """
    try:
        # Read database credentials from environment variables
        
        server = os.environ.get("server_name")
        user = os.environ.get("main_user_name")
        password = os.environ.get("db_password")
        database = os.environ.get("database_name")
        port_str = os.environ.get("port", "1433")
        
        # Validate required environment variables
        if not server:
            raise ValueError("Environment variable 'server_name' is not set")
        if not user:
            raise ValueError("Environment variable 'main_user_name' is not set")
        if not password:
            raise ValueError("Environment variable 'db_password' is not set")
        if not database:
            raise ValueError("Environment variable 'database_name' is not set")
        
        # Convert port to int with validation
        try:
            port = int(port_str)
        except (ValueError, TypeError):
            print(f"Warning: Invalid port value '{port_str}', using default port 1433")
            port = 1433
        
        # Attempt to connect to the database
        conn = pymssql.connect(
            server=server,
            user=user,
            password=password,
            database=database,
            #port=port
        )
        
        print(f"Database connection successful: {server}:{port}/{database}")
        return conn
        
    except ValueError as ve:
        # Missing or invalid environment variables
        print(f"Configuration error: {str(ve)}")
        raise
    except pymssql.Error as db_error:
        # Database connection errors
        print(f"Database connection error: {str(db_error)}")
        return None
    except Exception as e:
        # Unexpected errors
        print(f"Unexpected error connecting to database: {str(e)}")
        return None