from flask import Blueprint, request, jsonify, make_response, current_app
from app.Database.connection import connect_to_database
from app.utils.email_service import send_email_notification
import jwt
import datetime

auth_bp = Blueprint("auth", __name__)

def generate_jwt(user, company_ids):
    payload = {
        "UserId": user.get("UserId"),
        "UserName": f"{user.get('FirstName')} {user.get('LastName')}".strip(),
        "RoleId": user.get("RoleId"),
        "CompanyIds": company_ids,  # pass all mapped company IDs
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2),
        "iat": datetime.datetime.utcnow()
    }
    token = jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")
    return token

@auth_bp.route("/login", methods=["POST"])
def login():
    """
    First step of 2FA login: Validates email and password, generates OTP, and sends it via email.
    """
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    host = request.headers.get("Origin")
    DBSCHEMA = "santova"
    if host == "https://orbis-icat.alphalogix.tech":
        DBSCHEMA = "ICAT"

    if not email or not password:
        return jsonify({"message": "Email and password required"}), 400

    # Capture IP Address and User Agent for audit logging
    ip_address = request.remote_addr
    user_agent = request.headers.get("User-Agent", "")

    conn = connect_to_database()
    cursor = conn.cursor()
    try:
        # Execute checkLogin stored procedure
        # This validates credentials and generates OTP
        query = f"EXEC {DBSCHEMA}.checkLogin @email=%s, @password=%s, @IPAddress=%s, @UserAgent=%s"
        cursor.execute(query, (email, password, ip_address, user_agent))
        
        # Fetch results
        rows = cursor.fetchall()
        
        # Commit the transaction to save INSERT/UPDATE operations
        conn.commit()
        
        if not rows:
            return jsonify({"message": "Invalid credentials"}), 401

        columns = [column[0] for column in cursor.description]
        first_row = dict(zip(columns, rows[0]))
        
        # Check if credentials are invalid
        result = first_row.get("Result")
        if result == "INVALID_CREDENTIALS":
            return jsonify({"message": "Invalid credentials"}), 401

        # If OTP was generated successfully
        if result == "OTP_SENT":
            otp = first_row.get("OTP")
            
            # Send OTP via email
            subject = "Your Login OTP"
            body = f"""
Hello,

Your One-Time Password (OTP) for login is: {otp}

This OTP is valid for 5 minutes. Please do not share this OTP with anyone.

If you did not request this OTP, please ignore this email.

Best regards,
Santova Team
"""
            html_body = f"""
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #2563eb;">Login OTP</h2>
    <p>Hello,</p>
    <p>Your One-Time Password (OTP) for login is:</p>
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
      <h1 style="color: #1f2937; margin: 0; letter-spacing: 5px;">{otp}</h1>
    </div>
    <p>This OTP is valid for <strong>5 minutes</strong>. Please do not share this OTP with anyone.</p>
    <p>If you did not request this OTP, please ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="color: #6b7280; font-size: 12px;">Best regards,<br>Santova Team</p>
  </body>
</html>
"""
            
            # Send email
            email_sent = send_email_notification([email], subject, body, html_body)
            
            if not email_sent:
                current_app.logger.warning(f"Failed to send OTP email to {email}, but OTP was generated")
            
            return jsonify({
                "message": "OTP sent to your email address. Please check your inbox and enter the OTP to complete login.",
                "email": email  # Return email for verification step
            }), 200
        else:
            return jsonify({"message": "Unexpected error occurred"}), 500

    except Exception as e:
        current_app.logger.error(f"Login error: {e}")
        return jsonify({"message": "Internal Server Error", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_user_info(DBSCHEMA, user_id):
    """
    Retrieve user information.
    """
    conn = connect_to_database()
    cursor = conn.cursor()
    try:
        # Query to get user info
        # Note: some existing rows may have IsDeleted = NULL, so treat NULL as 0 (active)
        query = f"""
        SELECT 
            UserId,
            FirstName,
            LastName,
            Email,
            Mobile,
            ActiveStatus,
            ImageUrl,
            Country,
            State,
            City,
            RoleId,
            LastLoginTime
        FROM {DBSCHEMA}.SantovaUser
        WHERE UserId = %s AND ISNULL(IsDeleted, 0) = 0
        """
        cursor.execute(query, (user_id,))
        row = cursor.fetchone()
        
        if not row:
            return None
        
        columns = [column[0] for column in cursor.description]
        user = dict(zip(columns, row))
        
        return user
        
    except Exception as e:
        current_app.logger.error(f"Error fetching user info: {e}")
        return None
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    """
    Second step of 2FA login: Verifies OTP and completes login by returning JWT token and user info.
    """
    data = request.get_json()
    email = data.get("email")
    otp = data.get("otp")
    host = request.headers.get("Origin")
    DBSCHEMA = "santova"
    if host == "https://orbis-icat.alphalogix.tech":
        DBSCHEMA = "ICAT"

    if not email or not otp:
        return jsonify({"message": "Email and OTP are required"}), 400

    # Capture IP Address and User Agent for audit logging
    ip_address = request.remote_addr
    user_agent = request.headers.get("User-Agent", "")

    conn = connect_to_database()
    cursor = conn.cursor()
    try:
        # Execute VerifyLoginOTP stored procedure
        query = f"EXEC {DBSCHEMA}.VerifyLoginOTP @Email=%s, @OTP=%s, @IPAddress=%s, @UserAgent=%s"
        cursor.execute(query, (email, otp, ip_address, user_agent))
        
        # Fetch results
        rows = cursor.fetchall()
        
        # Commit the transaction
        conn.commit()
        
        if not rows:
            return jsonify({"message": "OTP verification failed"}), 401

        columns = [column[0] for column in cursor.description]
        first_row = dict(zip(columns, rows[0]))
        result = first_row.get("Result")
        
        # Check OTP verification result
        if result == "USER_NOT_FOUND":
            return jsonify({"message": "User not found"}), 404
        elif result == "OTP_EXPIRED":
            return jsonify({"message": "OTP has expired. Please request a new OTP."}), 401
        elif result == "OTP_INVALID":
            return jsonify({"message": "Invalid OTP. Please try again."}), 401
        elif result == "LOGIN_SUCCESS":
            # OTP verified successfully, SP returns user data with company mappings
            # The SP can return multiple rows (one per company mapping)
            company_ids = []
            company_names = []
            user = None
            
            # Process all rows to collect user info and companies
            for row in rows:
                row_dict = dict(zip(columns, row))
                
                # Take the first row for basic user info
                if user is None:
                    user = {
                        "UserId": row_dict.get("UserId"),
                        "FirstName": row_dict.get("FirstName"),
                        "LastName": row_dict.get("LastName"),
                        "Email": row_dict.get("Email"),
                        "RoleId": row_dict.get("RoleId")
                    }
                
                # Collect company information (may have multiple companies)
                company_id = row_dict.get("CompanyId")
                company_name = row_dict.get("CompanyName")
                
                if company_id and company_id not in company_ids:
                    company_ids.append(company_id)
                    if company_name:
                        company_names.append(company_name)

            if not user or not user.get("UserId"):
                return jsonify({"message": "User information not found"}), 404

            # Generate JWT token with company IDs
            token = generate_jwt(user, company_ids)

            user_info = {
                "UserId": user.get("UserId"),
                "FirstName": user.get("FirstName"),
                "LastName": user.get("LastName"),
                "Email": user.get("Email"),
                "RoleId": user.get("RoleId"),
                "CompanyIds": company_ids,
                "CompanyNames": company_names
            }

            response = make_response(jsonify({
                "message": "Login successful",
                "token": token,
                "user": user_info
            }))
            return response
        else:
            return jsonify({"message": "Unexpected error occurred"}), 500

    except Exception as e:
        current_app.logger.error(f"OTP verification error: {e}")
        return jsonify({"message": "Internal Server Error", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@auth_bp.route("/logout", methods=["POST"])
def logout():
    """
    Logout endpoint: Logs user logout in the database and clears session.
    """
    # Get user ID from JWT token
    token = None
    if "Authorization" in request.headers:
        auth_header = request.headers["Authorization"]
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
        else:
            token = auth_header

    if not token:
        return jsonify({"message": "Token is missing"}), 401

    try:
        # Decode token to get user ID
        decoded = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
        user_id = decoded.get("UserId")

        if not user_id:
            return jsonify({"message": "Invalid token"}), 401

        host = request.headers.get("Origin")
        DBSCHEMA = "santova"
        if host == "https://orbis-icat.alphalogix.tech":
            DBSCHEMA = "ICAT"

        # Call logout stored procedure
        conn = connect_to_database()
        cursor = conn.cursor()
        try:
            query = f"EXEC {DBSCHEMA}.logUserLogout @UserId=%s"
            cursor.execute(query, (user_id,))
            conn.commit()

            return jsonify({"message": "Logout successful"}), 200

        except Exception as e:
            current_app.logger.error(f"Logout error: {e}")
            return jsonify({"message": "Error logging out", "error": str(e)}), 500

        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"message": "Invalid token"}), 401
    except Exception as e:
        current_app.logger.error(f"Logout error: {e}")
        return jsonify({"message": "Internal Server Error", "error": str(e)}), 500
