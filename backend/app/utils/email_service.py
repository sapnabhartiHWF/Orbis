"""
Email service utility for sending notifications.
"""
import smtplib
import logging
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app, has_app_context
from app.Database.connection import connect_to_database
from config import Config

# Create a logger that works both inside and outside Flask context
logger = logging.getLogger(__name__)


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


def _get_logger():
    """
    Get logger that works both inside and outside Flask application context.
    """
    if has_app_context():
        return current_app.logger
    return logger


def get_automation_engineer_emails(DBSCHEMA):
    """
    Get email addresses of all users with 'Automation Engineer' role using stored procedure.
    Returns a list of email addresses.
    """
    conn = None
    cursor = None
    emails = []
    log = _get_logger()
    
    try:
        conn = connect_to_database()
        cursor = conn.cursor()
        
        # Call stored procedure to get Automation Engineer emails
        cursor.execute(f"EXEC {DBSCHEMA}.GetAutomationEngineerEmails")
        
        rows = cursor.fetchall()
        emails = [row[0].strip() for row in rows if row[0] and row[0].strip() and '@' in row[0]]
        
        # Remove duplicates
        emails = list(set(emails))
        
        if emails:
            log.info(f"Found {len(emails)} Automation Engineer(s) to notify")
        else:
            log.warning("No Automation Engineer emails found from stored procedure")
        
    except Exception as e:
        log.error(f"Error fetching Automation Engineer emails from stored procedure: {str(e)}")
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
    log = _get_logger()
    
    if not to_emails:
        log.warning("No recipient emails provided for notification")
        return False
    
    config = get_smtp_config()
    
    # Check if SMTP is configured
    if not config['smtp_username'] or not config['smtp_password']:
        log.warning("SMTP not configured. Email notification skipped.")
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
        
        log.info(f"Email notification sent successfully to {len(to_emails)} recipient(s)")
        return True
        
    except Exception as e:
        log.error(f"Error sending email notification: {str(e)}")
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
    log = _get_logger()
    
    # Get Automation Engineer emails using stored procedure
    automation_engineer_emails = get_automation_engineer_emails(DBSCHEMA)
    
    if not automation_engineer_emails:
        log.warning("No Automation Engineer emails found. Notification not sent.")
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
    log.info(f"Preparing to send file upload notification. Recipients: {automation_engineer_emails}, Subject: {subject}")
    
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
    
    return send_email_notification(automation_engineer_emails, subject, body, html_body)


def notify_automation_engineers_on_file_upload(DBSCHEMA, file_name, process_name, uploaded_by, file_type, file_size, description=None):
    """
    Send email notification to Automation Engineers asynchronously when a new file is uploaded.
    This function handles the async execution in a background thread.
    
    This is a convenience wrapper that should be called from file upload routes.
    All email sending logic is encapsulated here to prevent accidental removal.
    
    Args:
        DBSCHEMA: Database schema name
        file_name: Name of the uploaded file
        process_name: Name of the process/company
        uploaded_by: Name of the user who uploaded the file
        file_type: Type of file (document, video, flowchart, image)
        file_size: Size of the file
        description: Optional file description
    
    Returns:
        None (runs asynchronously in background thread)
    """
    log = _get_logger()
    
    def send_email_async():
        """Internal function to send email in background thread."""
        try:
            send_file_upload_notification(
                DBSCHEMA=DBSCHEMA,
                file_name=file_name,
                process_name=process_name,
                uploaded_by=uploaded_by,
                file_type=file_type or "document",
                file_size=file_size,
                description=description
            )
        except Exception as e:
            log.error(f"Error sending file upload email notification: {str(e)}")
    
    # Send email in background thread (non-blocking)
    threading.Thread(target=send_email_async, daemon=True).start()


def send_rule_change_notification(DBSCHEMA, rule_id, proposed_subject, proposed_description, requested_by_name):
    """
    Send email notification to Automation Engineers when a rule change is requested.

    Args:
        DBSCHEMA: Database schema name
        rule_id: The ID of the rule
        proposed_subject: The subject of the proposed change
        proposed_description: The description of the proposed change
        requested_by_name: Name of the user requesting the change
    """
    log = _get_logger()
    
    # Get Automation Engineer emails using stored procedure
    automation_engineer_emails = get_automation_engineer_emails(DBSCHEMA)
    
    if not automation_engineer_emails:
        log.warning("No Automation Engineer emails found. Rule change notification not sent.")
        return False
    
    # Determine application name
    app_name = "Orbis-Santova" if DBSCHEMA == "santova" else "Orbis-ICAT"

    # Email subject
    subject = f"Rule Change Request: Rule {rule_id} ({app_name})"
    log.info(f"Preparing to send rule change notification. Recipients: {automation_engineer_emails}, Subject: {subject}")
    
    # Plain text body
    body = f"""
A rule change request has been submitted for {app_name}.

Request Details:
- Application: {app_name}
- Rule ID: {rule_id}
- Requested By: {requested_by_name}
- Proposed Subject: {proposed_subject}
- Proposed Description: {proposed_description}

Please review the request in the Rulebook system.
"""
    
    # HTML body
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #2563eb;">Rule Change Request Received</h2>
        <p>A new rule change request has been submitted for <strong>{app_name}</strong>.</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Request Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 8px 0;"><strong>Application:</strong> {app_name}</li>
            <li style="margin: 8px 0;"><strong>Rule ID:</strong> {rule_id}</li>
            <li style="margin: 8px 0;"><strong>Requested By:</strong> {requested_by_name}</li>
            <li style="margin: 8px 0;"><strong>Proposed Subject:</strong> {proposed_subject}</li>
            <li style="margin: 8px 0;"><strong>Proposed Description:</strong> {proposed_description}</li>
          </ul>
        </div>
        
        <p>Please review the request in the Rulebook Tab.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">This is an automated notification from the Rulebook system.</p>
      </body>
    </html>
    """
    
    return send_email_notification(automation_engineer_emails, subject, body, html_body)


def notify_automation_engineers_on_rule_change(DBSCHEMA, rule_id, proposed_subject, proposed_description, requested_by_name):
    """
    Send email notification to Automation Engineers asynchronously when a rule change is requested.
    This function handles the async execution in a background thread.
    
    Args:
        DBSCHEMA: Database schema name
        rule_id: The ID of the rule
        proposed_subject: The subject of the proposed change
        proposed_description: The description of the proposed change
        requested_by_name: Name of the user requesting the change
    
    Returns:
        None (runs asynchronously in background thread)
    """
    log = _get_logger()
    
    def send_email_async():
        """Internal function to send email in background thread."""
        try:
            send_rule_change_notification(
                DBSCHEMA=DBSCHEMA,
                rule_id=rule_id,
                proposed_subject=proposed_subject,
                proposed_description=proposed_description,
                requested_by_name=requested_by_name
            )
        except Exception as e:
            log.error(f"Error sending rule change email notification: {str(e)}")
    
    # Send email in background thread (non-blocking)
    threading.Thread(target=send_email_async, daemon=True).start()
    
