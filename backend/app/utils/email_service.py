"""
Email service utility for sending notifications.
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app
from app.Database.connection import connect_to_database
from config import Config


def get_smtp_config():
    """
    Get SMTP configuration from Config class.
    """
    return {
        'smtp_server': Config.SMTP_SERVER or 'smtp.gmail.com',
        'smtp_port': Config.SMTP_PORT or 587,
        'smtp_username': Config.SMTP_USERNAME or '',
        'smtp_password': Config.SMTP_PASSWORD or '',
        'from_email': Config.FROM_EMAIL or Config.SMTP_USERNAME or '',
        'use_tls': Config.SMTP_USE_TLS
    }


def get_automation_engineer_emails(DBSCHEMA):
    """
    Get email addresses of all users with 'Automation Engineer' role using stored procedure.
    Returns a list of email addresses.
    """
    conn = None
    cursor = None
    emails = []
    
    try:
        conn = connect_to_database()
        cursor = conn.cursor()
        
        # Call stored procedure to get Automation Engineer emails
        cursor.execute(f"EXEC {DBSCHEMA}.GetAutomationEngineerEmails")
        
        rows = cursor.fetchall()
        emails = [row[0] for row in rows if row[0] and row[0].strip()]
        
        if emails:
            current_app.logger.info(f"Found {len(emails)} Automation Engineer(s) to notify")
        else:
            current_app.logger.warning("No Automation Engineer emails found from stored procedure")
        
    except Exception as e:
        current_app.logger.error(f"Error fetching Automation Engineer emails from stored procedure: {str(e)}")
        # Return empty list on error - don't fail the upload
        emails = []
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
    
    return emails


def send_email_notification(to_emails, subject, body, html_body=None):
    """
    Send email notification to specified recipients.
    
    Args:
        to_emails: List of recipient email addresses
        subject: Email subject
        body: Plain text email body
        html_body: Optional HTML email body
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    if not to_emails:
        current_app.logger.warning("No recipient emails provided for notification")
        return False
    
    config = get_smtp_config()
    
    # Check if SMTP is configured
    if not config['smtp_username'] or not config['smtp_password']:
        current_app.logger.warning("SMTP not configured. Email notification skipped.")
        return False
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = config['from_email']
        msg['To'] = ', '.join(to_emails)
        msg['Subject'] = subject
        
        # Add plain text part
        text_part = MIMEText(body, 'plain')
        msg.attach(text_part)
        
        # Add HTML part if provided
        if html_body:
            html_part = MIMEText(html_body, 'html')
            msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(config['smtp_server'], config['smtp_port']) as server:
            if config['use_tls']:
                server.starttls()
            server.login(config['smtp_username'], config['smtp_password'])
            server.send_message(msg)
        
        current_app.logger.info(f"Email notification sent successfully to {len(to_emails)} recipient(s)")
        return True
        
    except Exception as e:
        current_app.logger.error(f"Error sending email notification: {str(e)}")
        return False


def send_file_upload_notification(DBSCHEMA, file_name, process_name, uploaded_by, file_type, file_size, description=None):
    """
    Send email notification to Automation Engineers when a new file is uploaded.
    
    Args:
        DBSCHEMA: Database schema name
        file_name: Name of the uploaded file
        process_name: Name of the process/company
        uploaded_by: Name of the user who uploaded the file
        file_type: Type of file (document, video, flowchart, image)
        file_size: Size of the file
        description: Optional file description
    """
    # Get Automation Engineer emails
    engineer_emails = get_automation_engineer_emails(DBSCHEMA)
    
    if not engineer_emails:
        current_app.logger.warning("No Automation Engineer emails found. Notification not sent.")
        return False
    
    # Format file size
    def format_file_size(size_bytes):
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.2f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.2f} TB"
    
    formatted_size = format_file_size(file_size)
    
    # Email subject
    subject = f"New File Uploaded: {file_name}"
    
    # Plain text body
    body = f"""
A new file has been uploaded to the system.

File Details:
- File Name: {file_name}
- Process/Company: {process_name}
- File Type: {file_type}
- File Size: {formatted_size}
- Uploaded By: {uploaded_by}
"""
    
    if description:
        body += f"- Description: {description}\n"
    
    body += "\nPlease review the file in the File Management system."
    
    # HTML body
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #2563eb;">New File Uploaded</h2>
        <p>A new file has been uploaded to the system.</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">File Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 8px 0;"><strong>File Name:</strong> {file_name}</li>
            <li style="margin: 8px 0;"><strong>Process/Company:</strong> {process_name}</li>
            <li style="margin: 8px 0;"><strong>File Type:</strong> {file_type}</li>
            <li style="margin: 8px 0;"><strong>File Size:</strong> {formatted_size}</li>
            <li style="margin: 8px 0;"><strong>Uploaded By:</strong> {uploaded_by}</li>
            {f'<li style="margin: 8px 0;"><strong>Description:</strong> {description}</li>' if description else ''}
          </ul>
        </div>
        
        <p>Please review the file in the File Management system.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">This is an automated notification from the File Management system.</p>
      </body>
    </html>
    """
    
    return send_email_notification(engineer_emails, subject, body, html_body)

