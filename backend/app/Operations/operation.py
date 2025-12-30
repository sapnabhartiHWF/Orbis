import pymssql
from app.databaseconnection import db_connect


def db_summary_report(schema: str = "AirlineProcessHeaderDetail"):
    """
    Get summary report with bot counts and flight details.
    
    Args:
        schema: Database schema name (AirlineProcessHeaderDetail for ICAT URL, santova for others)
    """
    conn = db_connect()
    cursor = conn.cursor()
    cursor.execute(f"Select count(b.Name) as 'Total Bot' from {schema}.Bots b")
    total_bot = cursor.fetchall()[0][0]
    cursor.execute(f"Select count(b.Name) as 'Total ActiveBot' from {schema}.Bots b where b.IsActive = 1")
    active_bot = cursor.fetchall()[0][0]
    cursor.execute(f"select Count(*) as 'Success' from {schema}.FlightDetails fd where fd.Status = 'Done'")
    total_success = cursor.fetchall()[0][0]
    cursor.execute(f"select Count(*) as 'Exception' from {schema}.FlightDetails fd where fd.Status = 'Exception'")
    total_exception = cursor.fetchall()[0][0]
    cursor.execute(f"select Count(*) as 'production_ready' from {schema}.Bots b where b.IsActive = 0")
    production_ready_bot = cursor.fetchall()[0][0]

    conn.close()
    cursor.close()
    report = {
        "Total Bot": total_bot,
        "Total ActiveBot": active_bot,
        "Total Success": total_success,
        "Total Exception": total_exception,
        "Production Ready Bot": production_ready_bot
    }
    return report


def airline_details(schema: str = "AirlineProcessHeaderDetail"):
    """
    Get airline details with flight numbers and statuses.
    
    Args:
        schema: Database schema name (AirlineProcessHeaderDetail for ICAT URL, santova for others)
    """
    conn = db_connect()
    cursor = conn.cursor()
    cursor.execute(f"select fd.FlightNumber,fd.Status,fd.AirlineStatus from {schema}.FlightDetails fd")
    details = cursor.fetchall()
    final_data = []
    for row in details:
        final_data.append({
            "Flight Number": row[0],
            "Flight Status": row[1],
            "Airline Status": row[2]
        })
    conn.close()
    cursor.close()
    return final_data


def morgan_stanley_details(schema: str = "AirlineProcessHeaderDetail"):
    """
    Get Morgan Stanley details by calling stored procedure SP_GetMorganStanley.
    
    Args:
        schema: Database schema name (AirlineProcessHeaderDetail for ICAT URL, santova for others)
    
    Returns:
        list: All records from the MorganStanley table
    """
    conn = db_connect()
    cursor = conn.cursor()
    try:
        # Call stored procedure with dynamic schema
        cursor.execute(f"EXEC {schema}.SP_GetMorganStanley")
        details = cursor.fetchall()
        
        # Get column names from cursor description
        columns = [column[0] for column in cursor.description]
        
        final_data = []
        for row in details:
            # Create dictionary mapping column names to values
            row_dict = {}
            for i, col_name in enumerate(columns):
                row_dict[col_name] = row[i] if row[i] is not None else None
            final_data.append(row_dict)
        
        return final_data
    except Exception as e:
        print(f"Error fetching Morgan Stanley details: {e}")
        raise e
    finally:
        conn.close()
        cursor.close()
