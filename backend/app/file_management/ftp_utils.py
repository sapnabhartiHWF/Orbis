"""
FTP Utility Module for File Management
Handles FTP upload and download operations integrated with the file management system.
"""
import ftplib
import os
from typing import Tuple, Optional


class FTPManager:
    """FTP Manager for file operations"""
    
    def __init__(self, host: str, username: str, password: str, port: int = 21):
        """
        Initialize FTP Manager.
        
        Args:
            host: FTP server hostname or IP address
            username: FTP username
            password: FTP password
            port: FTP server port (default: 21)
        """
        self.host = host
        self.username = username
        self.password = password
        self.port = port
    
    def _connect(self) -> ftplib.FTP:
        """
        Establish connection to FTP server.
        
        Returns:
            ftplib.FTP: Connected FTP instance
        """
        ftp = ftplib.FTP()
        ftp.connect(self.host, self.port)
        ftp.login(self.username, self.password)
        # Set passive mode (recommended for most firewalls)
        ftp.set_pasv(True)
        return ftp
    
    def _ensure_directory(self, ftp: ftplib.FTP, remote_path: str):
        """
        Ensure remote directory exists, create if it doesn't.
        
        Args:
            ftp: FTP connection instance
            remote_path: Remote directory path (e.g., '/morgan_stanley/process_name')
        """
        try:
            # Normalize path
            remote_path = remote_path.replace('\\', '/')
            if not remote_path.startswith('/'):
                remote_path = '/' + remote_path
            
            # Split path into parts
            parts = [p for p in remote_path.split('/') if p]
            current_path = '/'
            
            # Navigate to root first
            ftp.cwd('/')
            
            # Create each directory if it doesn't exist
            for part in parts:
                current_path = os.path.join(current_path, part).replace('\\', '/')
                try:
                    ftp.cwd(current_path)
                except ftplib.error_perm:
                    # Directory doesn't exist, create it
                    try:
                        ftp.mkd(current_path)
                        ftp.cwd(current_path)
                    except ftplib.error_perm as e:
                        # Directory might have been created by another process
                        print(f"Warning: Could not create directory {current_path}: {e}")
                        try:
                            ftp.cwd(current_path)
                        except:
                            raise
        
        except Exception as e:
            print(f"Error ensuring remote directory {remote_path}: {str(e)}")
            raise
    
    def upload_file(self, local_file_path: str, remote_directory: str, remote_filename: Optional[str] = None) -> Tuple[bool, str]:
        """
        Upload a file to FTP server.
        
        Args:
            local_file_path: Path to local file to upload
            remote_directory: Remote directory path (e.g., '/morgan_stanley/process_name')
            remote_filename: Remote filename (default: same as local filename)
            
        Returns:
            Tuple[bool, str]: (success, message)
        """
        ftp = None
        try:
            if not os.path.exists(local_file_path):
                return False, f"Local file not found: {local_file_path}"
            
            # Use provided remote filename or extract from local path
            if not remote_filename:
                remote_filename = os.path.basename(local_file_path)
            
            # Connect to FTP
            ftp = self._connect()
            
            # Ensure remote directory exists
            self._ensure_directory(ftp, remote_directory)
            
            # Change to remote directory
            ftp.cwd(remote_directory)
            
            # Upload file in binary mode
            with open(local_file_path, 'rb') as file:
                ftp.storbinary(f'STOR {remote_filename}', file)
            
            remote_path = f"{remote_directory}/{remote_filename}".replace('//', '/')
            return True, f"Successfully uploaded to {remote_path}"
        
        except Exception as e:
            error_msg = f"FTP upload error: {str(e)}"
            print(error_msg)
            return False, error_msg
        
        finally:
            if ftp:
                try:
                    ftp.quit()
                except:
                    try:
                        ftp.close()
                    except:
                        pass
    
    def download_file(self, remote_file_path: str, local_file_path: str) -> Tuple[bool, str]:
        """
        Download a file from FTP server.
        
        Args:
            remote_file_path: Remote file path (e.g., '/morgan_stanley/process_name/file.txt')
            local_file_path: Local path to save the file
            
        Returns:
            Tuple[bool, str]: (success, message)
        """
        ftp = None
        try:
            # Connect to FTP
            ftp = self._connect()
            
            # Extract directory and filename
            remote_dir = os.path.dirname(remote_file_path).replace('\\', '/')
            remote_filename = os.path.basename(remote_file_path)
            
            if not remote_dir or remote_dir == '.':
                remote_dir = '/'
            
            # Change to remote directory
            if remote_dir != '/':
                ftp.cwd(remote_dir)
            
            # Ensure local directory exists
            local_dir = os.path.dirname(local_file_path)
            if local_dir:
                os.makedirs(local_dir, exist_ok=True)
            
            # Download file
            with open(local_file_path, 'wb') as file:
                ftp.retrbinary(f'RETR {remote_filename}', file.write)
            
            return True, f"Successfully downloaded from {remote_file_path}"
        
        except Exception as e:
            error_msg = f"FTP download error: {str(e)}"
            print(error_msg)
            return False, error_msg
        
        finally:
            if ftp:
                try:
                    ftp.quit()
                except:
                    try:
                        ftp.close()
                    except:
                        pass
    
    def delete_file(self, remote_file_path: str) -> Tuple[bool, str]:
        """
        Delete a file from FTP server.
        
        Args:
            remote_file_path: Remote file path (e.g., '/morgan_stanley/process_name/file.txt')
            
        Returns:
            Tuple[bool, str]: (success, message)
        """
        ftp = None
        try:
            # Connect to FTP
            ftp = self._connect()
            
            # Extract directory and filename
            remote_dir = os.path.dirname(remote_file_path).replace('\\', '/')
            remote_filename = os.path.basename(remote_file_path)
            
            if not remote_dir or remote_dir == '.':
                remote_dir = '/'
            
            # Change to remote directory
            if remote_dir != '/':
                ftp.cwd(remote_dir)
            
            # Delete file
            ftp.delete(remote_filename)
            
            return True, f"Successfully deleted {remote_file_path}"
        
        except Exception as e:
            error_msg = f"FTP delete error: {str(e)}"
            print(error_msg)
            return False, error_msg
        
        finally:
            if ftp:
                try:
                    ftp.quit()
                except:
                    try:
                        ftp.close()
                    except:
                        pass


def get_ftp_manager(schema: str = None) -> Optional[FTPManager]:
    """
    Get FTP Manager instance from environment variables based on database schema.
    Reads FTP credentials from .env file.
    
    Schema-based credential selection (strict):
        - ICAT schema → uses C_FTP_HOST, C_FTP_USERNAME, C_FTP_PASSWORD, C_FTP_PORT
        - santova schema → uses S_FTP_HOST, S_FTP_USERNAME, S_FTP_PASSWORD, S_FTP_PORT
        - Schema must be explicitly "ICAT" or "santova" (no fallback)
    
    Args:
        schema: Database schema name ("ICAT" or "santova"). Required - must be one of these values.
    
    Returns:
        Optional[FTPManager]: FTP Manager instance or None if credentials not configured
    """
    import os
    from dotenv import load_dotenv
    
    # Load environment variables from .env file
    load_dotenv()
    
    # Determine which credential set to use based on schema (strict schema-based selection)
    if schema and schema.upper() == "ICAT":
        # Use C_FTP_* credentials for ICAT schema
        host = os.environ.get("C_FTP_HOST")
        username = os.environ.get("C_FTP_USERNAME")
        password = os.environ.get("C_FTP_PASSWORD")
        port = os.environ.get("C_FTP_PORT", "21")
        credential_set = "C_FTP_*"
    elif schema and schema.lower() == "santova":
        # Use S_FTP_* credentials for santova schema
        host = os.environ.get("S_FTP_HOST")
        username = os.environ.get("S_FTP_USERNAME")
        password = os.environ.get("S_FTP_PASSWORD")
        port = os.environ.get("S_FTP_PORT", "21")
        credential_set = "S_FTP_*"
    else:
        # No fallback - schema must be explicitly "ICAT" or "santova"
        print(f"Warning: Invalid or missing schema '{schema}'. Schema must be 'ICAT' or 'santova'. FTP upload/download will be disabled.")
        return None
    
    # Only create FTP manager if all required credentials are present
    if host and username and password:
        try:
            port_int = int(port)
            print(f"Using FTP credentials from {credential_set} for schema: {schema or 'default'}")
            return FTPManager(host, username, password, port_int)
        except ValueError:
            print(f"Warning: Invalid FTP port '{port}', using default port 21")
            return FTPManager(host, username, password, 21)
    
    # Log warning if FTP is not configured (but don't fail)
    print(f"Warning: FTP credentials not found for schema '{schema}'. Expected {credential_set} variables. FTP upload/download will be disabled.")
    return None

