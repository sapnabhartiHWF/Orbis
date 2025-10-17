import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

def format_html_text(text):
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(text, "html.parser")
    # Get all text, separated by newlines
    text = soup.get_text(separator="\n", strip=True)
    return text    

def get_rulebook_data():
    """
    Retrieves the rulebook data from the database.
    
    Returns:
        list: A list of dictionaries containing rulebook data.
    """
    from Database import connect_to_database
    connection = connect_to_database()
    
    cursor = connection.cursor()
    cursor.callproc('santova.GetRuleBookForPlatForm')
    
    rulebook_data = []
    for row in cursor.fetchall():
        rulebook_data.append({
            'rule_id': row[0],
            'rule_version': row[1],
            'rule_status': row[2],
            'rule_description': row[3],
            'rule_subject': row[4],
            'rule': format_html_text(row[5]),
            'rule_stage': row[6],
            'rule_process_name': row[7],
            'rule_process_owner': row[8]
        })
        #print(format_html_text(row[5]))
    
    cursor.close()
    connection.close()
    
    return rulebook_data

