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


def airline_details(schema: str = "AirlineProcessHeaderDetail", bot_id: int = None):
    """
    Get airline details with flight numbers, statuses, and bot ID.
    
    Args:
        schema: Database schema name (AirlineProcessHeaderDetail for ICAT URL, santova for others)
        bot_id: Optional Bot ID to filter flight details
    """
    conn = db_connect()
    cursor = conn.cursor()

    query = f"""
        SELECT 
            fd.FlightNumber,
            fd.Status,
            fd.AirlineStatus,
            fd.BotId
        FROM {schema}.FlightDetails fd
    """
    
    params = []
    if bot_id:
        query += " WHERE fd.BotId = %s"
        params.append(bot_id)

    cursor.execute(query, tuple(params))

    details = cursor.fetchall()
    final_data = []

    for row in details:
        final_data.append({
            "Flight Number": row[0],
            "Flight Status": row[1],
            "Airline Status": row[2],
            "BotId": row[3]
        })

    cursor.close()
    conn.close()

    return final_data


def morgan_stanley_details(schema: str = "AirlineProcessHeaderDetail"):
    """
    Get Morgan Stanley details by calling stored procedure GetMorganStanley.
    
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

def operations_by_bot(schema: str, bot_id: int):
    """
    Return data based on BotId mapping
    BotId = 1 → Morgan Stanley
    BotId = 2 → Flight Details (BWI)
    """
    conn = db_connect()
    cursor = conn.cursor()
    final_data = []

    try:
        # 🏦 Morgan Stanley
        if bot_id == 1:
            cursor.execute(f"""
                SELECT *
                FROM {schema}.MorganStanley
                WHERE BotId = %s
                ORDER BY CreatedOn DESC
            """, (bot_id,))

            columns = [col[0] for col in cursor.description]
            for row in cursor.fetchall():
                final_data.append(dict(zip(columns, row)))

        # ✈️ Flight Details (BWI)
        elif bot_id == 2:
            cursor.execute(f"""
                SELECT 
                    FlightNumber,
                    Status,
                    AirlineStatus,
                    BotId
                FROM {schema}.FlightDetails
                WHERE BotId = %s
                ORDER BY CreatedOn DESC
            """, (bot_id,))

            for row in cursor.fetchall():
                final_data.append({
                    "Flight Number": row[0],
                    "Flight Status": row[1],
                    "Airline Status": row[2],
                    "BotId": row[3]
                })

        else:
            final_data = []

        return final_data

    finally:
        cursor.close()
        conn.close()

