from flask import Blueprint, request, jsonify, send_file
from app.Database.connection import connect_to_database
from app.auth_middleware import token_required
import json
import os
import re
from datetime import datetime
from werkzeug.utils import secure_filename

tickets_bp = Blueprint('tickets_bp', __name__)

UPLOAD_FOLDER = os.path.join("uploads", "tickets")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Maximum file size: 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024

def sanitize_filename(filename):
    """Sanitize filename to prevent directory traversal and other security issues."""
    # Remove any path components
    filename = os.path.basename(filename)
    # Use werkzeug's secure_filename
    filename = secure_filename(filename)
    # Remove any remaining dangerous characters
    filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
    return filename

@tickets_bp.route('/api/add_ticket', methods=['POST'])
@token_required
def add_ticket(user_id, user_name):
    """
    Add a new ticket with optional file attachment.
    Uses user_id from JWT token for CreatedById.
    """
    conn = None
    cursor = None
    attachment_path = None
    
    try:
        # Get DBSCHEMA from Origin header
        host = request.headers.get("Origin")
        DBSCHEMA = "santova"
        if host == "https://orbis-icat.alphalogix.tech":
            DBSCHEMA = "ICAT"

        # ✅ Handle multipart/form-data
        title = request.form.get("Title")
        description = request.form.get("Description")
        type_ = request.form.get("Type")
        priority = request.form.get("Priority")
        assigned_user_ids = request.form.get("AssignedUserIds")

        # ✅ Input validation
        if not title or not title.strip():
            return jsonify({"success": False, "message": "Title is required"}), 400
        # Description, Type, and Priority are optional

        # ✅ Handle file upload with security checks
        file = request.files.get("Attachment")
        if file and file.filename:
            # Sanitize filename first
            safe_filename = sanitize_filename(file.filename)
            if not safe_filename:
                return jsonify({"success": False, "message": "Invalid filename"}), 400

            # Check file size (read content to check size, then save)
            try:
                # Try to get content length from Content-Length header if available
                content_length = request.headers.get('Content-Length')
                if content_length:
                    file_size = int(content_length)
                    if file_size > MAX_FILE_SIZE:
                        return jsonify({
                            "success": False,
                            "message": f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / (1024*1024)}MB"
                        }), 400
            except (ValueError, TypeError):
                pass  # If we can't determine size from header, proceed with save

            # Create unique filename with timestamp
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            filename = f"{timestamp}_{safe_filename}"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            
            # Save file and check actual size
            file.save(filepath)
            actual_size = os.path.getsize(filepath)
            
            if actual_size > MAX_FILE_SIZE:
                # Remove the file if it's too large
                try:
                    os.remove(filepath)
                except:
                    pass
                return jsonify({
                    "success": False,
                    "message": f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / (1024*1024)}MB"
                }), 400
            
            attachment_path = filepath

        # Parse assigned_user_ids if it's a JSON string
        assigned_user_ids_parsed = assigned_user_ids
        if assigned_user_ids and isinstance(assigned_user_ids, str):
            try:
                assigned_user_ids_parsed = json.loads(assigned_user_ids)
            except json.JSONDecodeError:
                # If not JSON, treat as comma-separated string
                assigned_user_ids_parsed = [uid.strip() for uid in assigned_user_ids.split(',') if uid.strip()]

        conn = connect_to_database()
        cursor = conn.cursor()

        # Use user_id from JWT token instead of form data
        # OPENJSON requires a valid JSON string, so use empty array instead of None
        if assigned_user_ids_parsed and len(assigned_user_ids_parsed) > 0:
            assigned_user_ids_json = json.dumps(assigned_user_ids_parsed)
        else:
            assigned_user_ids_json = "[]"  # Empty JSON array for OPENJSON
        
        # Execute stored procedure with parameters matching SP signature
        # SP Parameters: @Title, @Description, @Type, @Priority, @AttachmentPath, @CreatedById, @AssignedUserIds
        # Handle optional fields - use None/empty string if not provided
        description_value = description.strip() if description else None
        type_value = type_ if type_ else None
        priority_value = priority if priority else None
        
        cursor.execute(
            f"EXEC {DBSCHEMA}.InsertTicketWithAssignedUsers @Title = %s, @Description = %s, @Type = %s, @Priority = %s, @AttachmentPath = %s, @CreatedById = %s, @AssignedUserIds = %s",
            (title.strip(), description_value, type_value, priority_value, attachment_path, user_id, assigned_user_ids_json)
        )

        result = cursor.fetchall()
        conn.commit()

        # Format result as dictionary - SP returns: Tid, Title, Description, Type, Priority, CreatedById, CreatedByName, AssignedUsers
        if result:
            columns = [column[0] for column in cursor.description]
            ticket_dict = dict(zip(columns, result[0]))
            
            # Parse AssignedUsers JSON string from SP result
            if ticket_dict.get('AssignedUsers'):
                try:
                    assigned_users_json = ticket_dict['AssignedUsers']
                    if isinstance(assigned_users_json, str):
                        ticket_dict['AssignedUsers'] = json.loads(assigned_users_json)
                    elif assigned_users_json is None:
                        ticket_dict['AssignedUsers'] = []
                except (json.JSONDecodeError, TypeError):
                    ticket_dict['AssignedUsers'] = []
            else:
                ticket_dict['AssignedUsers'] = []
            
            # Add AttachmentPath to response if it exists (SP doesn't return it, but we have it)
            if attachment_path:
                ticket_dict['AttachmentPath'] = attachment_path
        else:
            ticket_dict = None

        return jsonify({"success": True, "ticket": ticket_dict}), 201

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error adding ticket: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@tickets_bp.route('/api/update_ticket', methods=['PUT'])
@token_required
def update_ticket(user_id, user_name):
    """
    Update an existing ticket with optional file attachment.
    Uses user_id from JWT token for UpdatedById.
    """
    conn = None
    cursor = None
    attachment_path = None
    
    try:
        # Get DBSCHEMA from Origin header
        host = request.headers.get("Origin")
        DBSCHEMA = "santova"
        if host == "https://orbis-icat.alphalogix.tech":
            DBSCHEMA = "ICAT"

        # ✅ Handle multipart/form-data
        tid = request.form.get("Tid")
        title = request.form.get("Title")
        description = request.form.get("Description")
        type_ = request.form.get("Type")
        priority = request.form.get("Priority")
        assigned_user_ids = request.form.get("AssignedUserIds")
        keep_existing_attachment = request.form.get("KeepExistingAttachment", "false").lower() == "true"

        # ✅ Input validation
        if not tid:
            return jsonify({"success": False, "message": "Ticket ID (Tid) is required"}), 400
        try:
            tid = int(tid)
        except ValueError:
            return jsonify({"success": False, "message": "Invalid ticket ID format"}), 400

        if not title or not title.strip():
            return jsonify({"success": False, "message": "Title is required"}), 400
        # Description, Type, and Priority are optional

        conn = connect_to_database()
        cursor = conn.cursor()

        # Get existing ticket data to check if anything actually changed
        cursor.execute(f"""
            SELECT Title, Description, Type, Priority, AttachmentPath 
            FROM {DBSCHEMA}.Tickets 
            WHERE Tid = %s AND ISNULL(IsDeleted, 0) = 0
        """, (tid,))
        existing_ticket = cursor.fetchone()
        
        if not existing_ticket:
            return jsonify({"success": False, "message": "Ticket not found"}), 404
        
        existing_title, existing_description, existing_type, existing_priority, existing_attachment_path = existing_ticket
        
        # Check if any fields actually changed
        title_changed = title.strip() != (existing_title or "").strip()
        description_changed = (description.strip() if description else "") != (existing_description or "").strip()
        type_changed = (type_ or "") != (existing_type or "")
        priority_changed = (priority or "") != (existing_priority or "")
        
        # Get existing attachment path if keeping it
        if keep_existing_attachment:
            existing_attachment_path = existing_attachment_path

        # Parse assigned_user_ids first (needed for change detection)
        assigned_user_ids_parsed = assigned_user_ids
        if assigned_user_ids and isinstance(assigned_user_ids, str):
            try:
                assigned_user_ids_parsed = json.loads(assigned_user_ids)
            except json.JSONDecodeError:
                # If not JSON, treat as comma-separated string
                assigned_user_ids_parsed = [uid.strip() for uid in assigned_user_ids.split(',') if uid.strip()]
        
        # Check if assigned users changed
        assigned_users_changed = False
        # Get existing assigned users
        cursor.execute(f"""
            SELECT UserId 
            FROM {DBSCHEMA}.TicketAssignedUser 
            WHERE Tid = %s
        """, (tid,))
        existing_assigned_user_ids = set([int(row[0]) for row in cursor.fetchall()])
        new_assigned_user_ids = set([int(uid) for uid in assigned_user_ids_parsed]) if assigned_user_ids_parsed else set()
        if existing_assigned_user_ids != new_assigned_user_ids:
            assigned_users_changed = True
        
        # Check if attachment changed
        attachment_changed = False
        
        # ✅ Handle file upload with security checks (if new file is provided)
        file = request.files.get("Attachment")
        if file and file.filename:
            attachment_changed = True
            # Sanitize filename first
            safe_filename = sanitize_filename(file.filename)
            if not safe_filename:
                return jsonify({"success": False, "message": "Invalid filename"}), 400

            # Check file size
            try:
                content_length = request.headers.get('Content-Length')
                if content_length:
                    file_size = int(content_length)
                    if file_size > MAX_FILE_SIZE:
                        return jsonify({
                            "success": False,
                            "message": f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / (1024*1024)}MB"
                        }), 400
            except (ValueError, TypeError):
                pass

            # Create unique filename with timestamp
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            filename = f"{timestamp}_{safe_filename}"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            
            # Save file and check actual size
            file.save(filepath)
            actual_size = os.path.getsize(filepath)
            
            if actual_size > MAX_FILE_SIZE:
                try:
                    os.remove(filepath)
                except:
                    pass
                return jsonify({
                    "success": False,
                    "message": f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / (1024*1024)}MB"
                }), 400
            
            attachment_path = filepath

            # Delete old attachment file if it exists and is different
            if existing_attachment_path and existing_attachment_path != attachment_path:
                try:
                    old_file_path = os.path.join(os.getcwd(), existing_attachment_path.replace('\\', '/'))
                    if os.path.exists(old_file_path):
                        os.remove(old_file_path)
                except Exception as e:
                    print(f"Warning: Could not delete old attachment file: {e}")
        else:
            # Use existing attachment if keeping it, otherwise set to None
            attachment_path = existing_attachment_path if keep_existing_attachment else None
            # Check if attachment was removed (changed from something to nothing)
            if not keep_existing_attachment and existing_attachment_path:
                attachment_changed = True
        
        # If nothing changed, return early without updating (prevents UpdatedDate from being set)
        if not (title_changed or description_changed or type_changed or priority_changed or attachment_changed or assigned_users_changed):
            # Fetch current ticket data to return
            cursor.execute(f"EXEC {DBSCHEMA}.GetTicketsWithAssignedUsers @Tid = %s", (tid,))
            result = cursor.fetchall()
            if result:
                columns = [column[0] for column in cursor.description]
                ticket_dict = dict(zip(columns, result[0]))
                
                # Parse AssignedUsers JSON string from SP result
                if ticket_dict.get('AssignedUsers'):
                    try:
                        assigned_users_json = ticket_dict['AssignedUsers']
                        if isinstance(assigned_users_json, str):
                            ticket_dict['AssignedUsers'] = json.loads(assigned_users_json)
                        elif assigned_users_json is None:
                            ticket_dict['AssignedUsers'] = []
                    except (json.JSONDecodeError, TypeError):
                        ticket_dict['AssignedUsers'] = []
                else:
                    ticket_dict['AssignedUsers'] = []
                
                return jsonify({
                    "success": True, 
                    "ticket": ticket_dict,
                    "message": "No changes detected"
                }), 200
            else:
                return jsonify({"success": False, "message": "Ticket not found"}), 404

        # OPENJSON requires a valid JSON string, so use empty array instead of None
        if assigned_user_ids_parsed and len(assigned_user_ids_parsed) > 0:
            assigned_user_ids_json = json.dumps(assigned_user_ids_parsed)
        else:
            assigned_user_ids_json = "[]"  # Empty JSON array for OPENJSON
        
        # Execute stored procedure with parameters matching SP signature
        # SP Parameters: @Tid, @Title, @Description, @Type, @Priority, @AttachmentPath, @UpdatedById, @AssignedUserIds
        # Handle optional fields - use None/empty string if not provided
        description_value = description.strip() if description else None
        type_value = type_ if type_ else None
        priority_value = priority if priority else None
        
        try:
            cursor.execute(
                f"EXEC {DBSCHEMA}.UpdateTicketWithAssignedUsers @Tid = %s, @Title = %s, @Description = %s, @Type = %s, @Priority = %s, @AttachmentPath = %s, @UpdatedById = %s, @AssignedUserIds = %s",
                (tid, title.strip(), description_value, type_value, priority_value, attachment_path, user_id, assigned_user_ids_json)
            )
            result = cursor.fetchall()
            conn.commit()
        except Exception as sp_error:
            conn.rollback()
            print(f"Stored procedure error: {sp_error}")
            return jsonify({"success": False, "message": f"Database error: {str(sp_error)}"}), 500

        # Format result as dictionary - SP returns: Tid, Title, Description, Type, Priority, AttachmentPath, CreatedById, CreatedDate, UpdatedById, UpdatedDate, IsDeleted, DownloadCount, UpdatedByName, AssignedUsers
        if result:
            columns = [column[0] for column in cursor.description]
            ticket_dict = dict(zip(columns, result[0]))
            
            # Parse AssignedUsers JSON string from SP result
            if ticket_dict.get('AssignedUsers'):
                try:
                    assigned_users_json = ticket_dict['AssignedUsers']
                    if isinstance(assigned_users_json, str):
                        ticket_dict['AssignedUsers'] = json.loads(assigned_users_json)
                    elif assigned_users_json is None:
                        ticket_dict['AssignedUsers'] = []
                except (json.JSONDecodeError, TypeError):
                    ticket_dict['AssignedUsers'] = []
            else:
                ticket_dict['AssignedUsers'] = []
        else:
            ticket_dict = None

        return jsonify({"success": True, "ticket": ticket_dict}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error updating ticket: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@tickets_bp.route('/api/get_tickets', methods=['GET'])
@token_required
def get_tickets(user_id, user_name):
    """
    Get tickets. If Tid is provided, returns specific ticket, otherwise returns all tickets.
    """
    conn = None
    cursor = None
    
    try:
        # Get DBSCHEMA from Origin header
        host = request.headers.get("Origin")
        DBSCHEMA = "santova"
        if host == "https://orbis-icat.alphalogix.tech":
            DBSCHEMA = "ICAT"

        tid = request.args.get("Tid")

        conn = connect_to_database()
        cursor = conn.cursor()

        if tid:
            try:
                tid = int(tid)
            except ValueError:
                return jsonify({"success": False, "message": "Invalid ticket ID format"}), 400
            cursor.execute(f"EXEC {DBSCHEMA}.GetTicketsWithAssignedUsers @Tid = %s", (tid,))
        else:
            cursor.execute(f"EXEC {DBSCHEMA}.GetTicketsWithAssignedUsers")

        result = cursor.fetchall()
        
        # Format results as dictionaries and parse JSON fields
        if result:
            columns = [column[0] for column in cursor.description]
            tickets = []
            for row in result:
                ticket_dict = dict(zip(columns, row))
                
                # Parse AssignedUsers JSON string if present
                if ticket_dict.get('AssignedUsers'):
                    try:
                        assigned_users_json = ticket_dict['AssignedUsers']
                        if isinstance(assigned_users_json, str):
                            ticket_dict['AssignedUsers'] = json.loads(assigned_users_json)
                        elif assigned_users_json is None:
                            ticket_dict['AssignedUsers'] = []
                    except (json.JSONDecodeError, TypeError):
                        ticket_dict['AssignedUsers'] = []
                else:
                    ticket_dict['AssignedUsers'] = []
                
                tickets.append(ticket_dict)
        else:
            tickets = []

        return jsonify({"success": True, "tickets": tickets}), 200

    except Exception as e:
        print(f"Error fetching tickets: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@tickets_bp.route('/api/delete_ticket', methods=['DELETE'])
@token_required
def delete_ticket(user_id, user_name):
    conn = None
    cursor = None

    try:
        host = request.headers.get("Origin")
        DBSCHEMA = "santova"
        if host == "https://orbis-icat.alphalogix.tech":
            DBSCHEMA = "ICAT"

        # ✅ Try reading JSON body
        data = request.get_json(silent=True)
        tid = None
        deleted_by_id = user_id

        if data:
            tid = data.get("Tid")
            deleted_by_id = data.get("DeletedById", user_id)

        # ✅ Fallback: read from query param if JSON missing
        if not tid:
            tid = request.args.get("Tid")

        if not tid:
            return jsonify({"success": False, "message": "Ticket ID (Tid) is required"}), 400

        conn = connect_to_database()
        cursor = conn.cursor()
        cursor.execute(f"EXEC {DBSCHEMA}.DeleteTicket %s, %s", (tid, deleted_by_id))
        conn.commit()

        return jsonify({"success": True, "message": "Ticket deleted successfully"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error deleting ticket: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@tickets_bp.route('/api/download_ticket_attachment', methods=['GET'])
@token_required
def download_ticket_attachment(user_id, user_name):
    """
    Download a ticket attachment file.
    Expects 'path' query parameter with the file path.
    Returns the file with original filename (without timestamp prefix).
    Updates DownloadCount in the database.
    """
    conn = None
    cursor = None
    
    try:
        # Get DBSCHEMA from Origin header
        host = request.headers.get("Origin")
        DBSCHEMA = "santova"
        if host == "https://orbis-icat.alphalogix.tech":
            DBSCHEMA = "ICAT"

        file_path = request.args.get("path")
        if not file_path:
            return jsonify({"success": False, "message": "File path is required"}), 400

        # Security: Normalize path separators and prevent directory traversal
        normalized_path = file_path.replace('\\', '/')
        
        # Remove any leading slashes
        if normalized_path.startswith('/'):
            normalized_path = normalized_path[1:]
        
        # Ensure path is within uploads/tickets directory
        if not normalized_path.startswith('uploads/tickets/'):
            # If it's just a filename, prepend the uploads/tickets path
            if '/' not in normalized_path:
                normalized_path = os.path.join("uploads", "tickets", normalized_path).replace('\\', '/')
            else:
                return jsonify({"success": False, "message": "Invalid file path"}), 400

        # Construct full file path
        full_path = os.path.join(os.getcwd(), normalized_path)
        
        # Security check: ensure file exists and is within allowed directory
        if not os.path.exists(full_path):
            return jsonify({"success": False, "message": "File not found"}), 404

        # Verify the file is actually in the uploads/tickets directory (prevent directory traversal)
        real_path = os.path.realpath(full_path)
        allowed_dir = os.path.realpath(os.path.join(os.getcwd(), "uploads", "tickets"))
        if not real_path.startswith(allowed_dir):
            return jsonify({"success": False, "message": "Access denied"}), 403

        # Get original filename (remove timestamp prefix if present)
        filename = os.path.basename(normalized_path)
        # Remove timestamp pattern: YYYYMMDDHHMMSS_ (14 digits followed by underscore)
        timestamp_pattern = re.compile(r'^\d{14}_')
        original_filename = timestamp_pattern.sub('', filename)

        # Update DownloadCount in database
        conn = connect_to_database()
        cursor = conn.cursor()
        
        # Update DownloadCount for the ticket with this attachment path
        cursor.execute(f"""
            UPDATE {DBSCHEMA}.Tickets
            SET DownloadCount = ISNULL(DownloadCount, 0) + 1
            WHERE AttachmentPath = %s AND ISNULL(IsDeleted, 0) = 0
        """, (file_path,))
        
        conn.commit()

        return send_file(
            full_path,
            as_attachment=True,
            download_name=original_filename,
            mimetype="application/octet-stream"
        )

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error downloading attachment: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@tickets_bp.route('/api/add_ticket_chat', methods=['POST'])
@token_required
def add_ticket_chat(user_id, user_name):
    """
    Add a chat message to a ticket.
    Uses user_id from JWT token for SendById.
    """
    conn = None
    cursor = None
    
    try:
        # Get DBSCHEMA from Origin header
        host = request.headers.get("Origin")
        DBSCHEMA = "santova"
        if host == "https://orbis-icat.alphalogix.tech":
            DBSCHEMA = "ICAT"

        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Request body is required"}), 400

        ticket_id = data.get("TicketId")
        send_to_id = data.get("SendToId")
        message = data.get("Message")
        parent_chat_id = data.get("ParentChatId")  # Optional, for replies

        # Input validation
        if not ticket_id:
            return jsonify({"success": False, "message": "TicketId is required"}), 400
        try:
            ticket_id = int(ticket_id)
        except (ValueError, TypeError):
            return jsonify({"success": False, "message": "Invalid TicketId format"}), 400

        if not message or not message.strip():
            return jsonify({"success": False, "message": "Message is required"}), 400

        # SendToId is optional (can be None for general ticket chat)
        send_to_id_value = None
        if send_to_id:
            try:
                send_to_id_value = int(send_to_id)
            except (ValueError, TypeError):
                return jsonify({"success": False, "message": "Invalid SendToId format"}), 400

        # ParentChatId is optional (for replies)
        parent_chat_id_value = None
        if parent_chat_id:
            try:
                parent_chat_id_value = int(parent_chat_id)
            except (ValueError, TypeError):
                return jsonify({"success": False, "message": "Invalid ParentChatId format"}), 400

        conn = connect_to_database()
        cursor = conn.cursor()

        # If SendToId is None (general chat), fetch the ticket creator's ID
        # This handles the case where SendToId column doesn't allow NULL
        if send_to_id_value is None:
            # Fetch the ticket creator's ID to use as SendToId for general chat
            cursor.execute(
                f"SELECT CreatedById FROM {DBSCHEMA}.Tickets WHERE Tid = %s",
                (ticket_id,)
            )
            ticket_result = cursor.fetchone()
            if ticket_result:
                send_to_id_value = ticket_result[0] if ticket_result[0] else user_id
            else:
                # Fallback to sender's ID if ticket not found
                send_to_id_value = user_id

        # Execute stored procedure
        cursor.execute(
            f"EXEC {DBSCHEMA}.InsertTicketChat @TicketId = %s, @SendById = %s, @SendToId = %s, @Message = %s, @ParentChatId = %s",
            (ticket_id, user_id, send_to_id_value, message.strip(), parent_chat_id_value)
        )

        result = cursor.fetchall()
        conn.commit()

        # Format result as dictionary
        if result:
            columns = [column[0] for column in cursor.description]
            chat_dict = dict(zip(columns, result[0]))
            return jsonify({"success": True, "chat": chat_dict}), 201
        else:
            return jsonify({"success": False, "message": "Failed to create chat message"}), 500

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error adding ticket chat: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@tickets_bp.route('/api/get_ticket_chat', methods=['GET'])
@token_required
def get_ticket_chat(user_id, user_name):
    """
    Get chat messages for a ticket.
    """
    conn = None
    cursor = None
    
    try:
        # Get DBSCHEMA from Origin header
        host = request.headers.get("Origin")
        DBSCHEMA = "santova"
        if host == "https://orbis-icat.alphalogix.tech":
            DBSCHEMA = "ICAT"

        ticket_id = request.args.get("TicketId")
        if not ticket_id:
            return jsonify({"success": False, "message": "TicketId is required"}), 400

        try:
            ticket_id = int(ticket_id)
        except (ValueError, TypeError):
            return jsonify({"success": False, "message": "Invalid TicketId format"}), 400

        conn = connect_to_database()
        cursor = conn.cursor()

        # Execute stored procedure
        cursor.execute(
            f"EXEC {DBSCHEMA}.GetTicketChat @TicketId = %s",
            (ticket_id,)
        )

        result = cursor.fetchall()

        # Format results as dictionaries and parse JSON fields
        if result:
            columns = [column[0] for column in cursor.description]
            chats = []
            for row in result:
                chat_dict = dict(zip(columns, row))
                
                # Parse Replies JSON string if present
                if chat_dict.get('Replies'):
                    try:
                        replies_json = chat_dict['Replies']
                        if isinstance(replies_json, str):
                            chat_dict['Replies'] = json.loads(replies_json)
                        elif replies_json is None:
                            chat_dict['Replies'] = []
                    except (json.JSONDecodeError, TypeError):
                        chat_dict['Replies'] = []
                else:
                    chat_dict['Replies'] = []
                
                chats.append(chat_dict)
        else:
            chats = []

        return jsonify({"success": True, "chats": chats}), 200

    except Exception as e:
        print(f"Error fetching ticket chat: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

