"""
Database Schema Utility
Provides shared functions to determine which database schema to use based on the request origin.
"""
from flask import request


def get_airline_schema():
    """
    Get AirlineProcessHeaderDetail schema for ICAT URLs, same logic as get_db_schema().
    These endpoints (Bots, Operations, Exceptions) use AirlineProcessHeaderDetail schema for ICAT URL,
    and default to "santova" for other URLs (though tables may not exist there).
    
    Returns:
        str: "AirlineProcessHeaderDetail" for ICAT URLs (https://orbis-icat.alphalogix.tech/), 
             "santova" for other URLs (same logic as get_db_schema)
    """
    host = request.headers.get("Origin") or request.headers.get("Referer") or ""
    SCHEMA = "santova"  # Default schema for non-ICAT URLs (same as get_db_schema)
    
    # Check for ICAT schema - support multiple possible origins (same logic as get_db_schema)
    icat_origins = [
        "https://orbis-icat.alphalogix.tech",
        "http://orbis-icat.alphalogix.tech",
        "orbis-icat.alphalogix.tech",
        "icat.alphalogix.tech"
    ]
    
    # Check if host contains any ICAT identifier (same logic as get_db_schema)
    if host:
        host_lower = host.lower()
        # Check for exact match or contains ICAT
        if any(icat_origin.lower() in host_lower for icat_origin in icat_origins) or "icat" in host_lower:
            SCHEMA = "AirlineProcessHeaderDetail"
            print(f"Using AirlineProcessHeaderDetail schema for origin: {host}")
        else:
            print(f"Using santova schema for origin: {host}")
    else:
        print("No Origin/Referer header found, defaulting to santova schema")
    
    return SCHEMA

