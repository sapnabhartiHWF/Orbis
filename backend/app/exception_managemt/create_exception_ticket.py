import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from databaseconnection import db_connect
import pymssql

def create_exception_ticket(subject: str, message: str, botname: str, status: str, serverity: str, assginname: str, schema: str = "AirlineProcessHeaderDetail"):
    """
    Create an exception ticket.
    
    Args:
        subject: Exception subject
        message: Exception message
        botname: Bot name
        status: Exception status
        serverity: Exception severity
        assginname: Assignee name
        schema: Database schema name (AirlineProcessHeaderDetail for ICAT URL, santova for others)
    """
    conn = db_connect()
    cursor = conn.cursor()
    try:
        cursor.execute(
            f"EXEC {schema}.create_exception_ticket @subject=%s, @message=%s, @botname=%s, @status=%s, @serverity=%s, @assginname=%s",
            (subject, message, botname, status, serverity, assginname)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()


def get_exception_ticket(schema: str = "AirlineProcessHeaderDetail"):
    """
    Get all exception tickets.
    
    Args:
        schema: Database schema name (AirlineProcessHeaderDetail for ICAT URL, santova for others)
    """
    conn = db_connect()
    cursor = conn.cursor()
    try:
        cursor.execute(f"EXEC {schema}.GetTicketExceptionData")
        rows = cursor.fetchall()
        columns = [col[0] for col in cursor.description]
        exception_tickets = [dict(zip(columns, row)) for row in rows]
        return exception_tickets
    except Exception as e:
        raise e
    finally:
        cursor.close()
        conn.close()

#create_exception_ticket("Exception 123", "The AWB NOT Found in airline", "Bwi", "Open", "High", "Pawan")
#print(get_exception_ticket())