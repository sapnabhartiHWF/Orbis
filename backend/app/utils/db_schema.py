"""
Database Schema Utility
Centralized function to determine DBSCHEMA based on request Origin header.
"""
from flask import request


def get_db_schema() -> str:
    """
    Get DBSCHEMA based on Origin header from the current request.
    
    Returns:
        str: 
            - "ICAT" for https://orbis-icat.alphalogix.tech/ or localhost/development
            - "santova" for https://orbis-santova.alphalogix.tech/
            - "ICAT" by default (for all other cases)
    
    Usage:
        from app.utils.db_schema import get_db_schema
        DBSCHEMA = get_db_schema()
    """
    host = request.headers.get("Origin") or request.headers.get("Referer") or ""
    host_lower = host.lower() if host else ""
    
    # Default to ICAT (for localhost, empty, or any other cases)
    DBSCHEMA = "ICAT"
    
    if host_lower:
        # Check for exact ICAT production URL
        if "orbis-icat.alphalogix.tech" in host_lower:
            DBSCHEMA = "ICAT"
            print(f"[DBSCHEMA] ✅ ICAT production URL detected: '{host}' → Schema: 'ICAT'")
        # Check for exact santova production URL
        elif "orbis-santova.alphalogix.tech" in host_lower:
            DBSCHEMA = "santova"
            print(f"[DBSCHEMA] ⚠️ Santova production URL detected: '{host}' → Schema: 'santova'")
        # Check if it's localhost/127.0.0.1/local development
        elif any(local in host_lower for local in [
            "localhost", 
            "127.0.0.1", 
            "0.0.0.0", 
            "::1",
            "local"
        ]):
            DBSCHEMA = "ICAT"
            print(f"[DBSCHEMA] ✅ Localhost/development detected: '{host}' → Schema: 'ICAT' (default)")
        else:
            # Any other URL defaults to ICAT
            DBSCHEMA = "ICAT"
            print(f"[DBSCHEMA] ✅ Other host (defaulting to ICAT): '{host}' → Schema: 'ICAT'")
    else:
        # Empty host defaults to ICAT
        DBSCHEMA = "ICAT"
        print(f"[DBSCHEMA] ✅ Empty host → Schema: 'ICAT' (default)")
    
    return DBSCHEMA
