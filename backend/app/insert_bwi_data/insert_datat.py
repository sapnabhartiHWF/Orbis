import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from databaseconnection import db_connect
import pymssql

def insert_bwi_data(data: dict):
    #print("Insert BWI Data Started", flush=True)
    conn = db_connect()
    cursor = conn.cursor()
    try:
        for idx, d in enumerate(data):
            #print(f"Processing item {idx + 1}: MAWB = {d.get('MAWB', 'NOT FOUND')}", flush=True)
            cursor.execute(
                "EXEC AirlineProcessHeaderDetail.InsertAirlineDataForAPI  @FlightNumber=%s, @FileNo=%s, @HouseBill=%s,@MAWB=%s",
                (d['FlightNumber'], d['FileNo'], d['HouseBill'], d['MAWB'])
            )
        conn.commit()
       # result_msg = f"Successfully inserted {len(data)} record(s)"
        #print(f"Insert BWI Data Completed Successfully: {result_msg}", flush=True)
        return "Data inserted successfully"
    except Exception as e:
        conn.rollback()
        #print(f"Error in insert_bwi_data: {str(e)}", flush=True)
        raise e
    finally:
        cursor.close()
        conn.close()

def send_email():
    sender_email = "reports@hybridworkforces.com"
    receiver_email = "pawan@hybridworkforces.com;prashant@hybridworkforces.com;puja@hybridworkforces.com"
    app_password = "hvig poid xedr nziy"   # App Password

    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = receiver_email
    msg["Subject"] = "API Trigger by Client"

    body = "Hello,\n\nAPI Trigger by Client. Please check the database and and Bot Logs for more details.\n\nThanks!"
    msg.attach(MIMEText(body, "plain"))

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, app_password)
        server.sendmail(sender_email, receiver_email, msg.as_string())
        server.quit()
        #print("Email sent successfully ✅")

    except Exception as e:
        print("Error:", e)