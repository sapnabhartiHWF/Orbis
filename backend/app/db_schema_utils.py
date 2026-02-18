"""
Database Schema Utility
Provides shared functions to determine which database schema to use based on the request origin.
"""
from flask import request


def get_bot_schema():
    """
    Get schema for Bots/Operations (uses db_connect - connects to db_Icat database).
    
    For ICAT URL: Returns "AirlineProcessHeaderDetail" (db_Icat database)
    For santova URL: Returns "santova" (db_Icat database)
    For localhost/development: Returns "AirlineProcessHeaderDetail" (default, db_Icat database)
    
    Returns:
        str: 
            - "AirlineProcessHeaderDetail" for https://orbis-icat.alphalogix.tech/ or localhost/development (default)
            - "santova" for https://orbis-santova.alphalogix.tech/
            - "AirlineProcessHeaderDetail" by default (for all other cases)
    """
    host = request.headers.get("Origin") or request.headers.get("Referer") or ""
    host_lower = host.lower() if host else ""
    
    # Default to AirlineProcessHeaderDetail (for localhost, empty, or ICAT hosts)
    # This matches the ICAT schema default logic
    SCHEMA = "AirlineProcessHeaderDetail"
    
    if host_lower:
        # Check for exact ICAT production URL
        if "orbis-icat.alphalogix.tech" in host_lower:
            SCHEMA = "AirlineProcessHeaderDetail"
            print(f"[BOT_SCHEMA] ✅ ICAT production URL detected: '{host}' → Schema: 'AirlineProcessHeaderDetail'")
        # Check for exact santova production URL
        elif "orbis-santova.alphalogix.tech" in host_lower:
            SCHEMA = "santova"
            print(f"[BOT_SCHEMA] ⚠️ Santova production URL detected: '{host}' → Schema: 'santova'")
        # Check if it's localhost/127.0.0.1/local development
        elif any(local in host_lower for local in [
            "localhost", 
            "127.0.0.1", 
            "0.0.0.0", 
            "::1",
            "local"
        ]):
            SCHEMA = "AirlineProcessHeaderDetail"
            print(f"[BOT_SCHEMA] ✅ Localhost/development detected: '{host}' → Schema: 'AirlineProcessHeaderDetail' (default - matching ICAT default)")
        else:
            # Any other URL defaults to AirlineProcessHeaderDetail (matching ICAT default)
            SCHEMA = "AirlineProcessHeaderDetail"
            print(f"[BOT_SCHEMA] ✅ Other host (defaulting to AirlineProcessHeaderDetail): '{host}' → Schema: 'AirlineProcessHeaderDetail'")
    else:
        # Empty host defaults to AirlineProcessHeaderDetail (matching ICAT default)
        SCHEMA = "AirlineProcessHeaderDetail"
        print(f"[BOT_SCHEMA] ✅ Empty host → Schema: 'AirlineProcessHeaderDetail' (default - matching ICAT default)")
    
    return SCHEMA

