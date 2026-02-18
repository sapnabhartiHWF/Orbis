def is_user_assigned(cursor, file_id, user_id, DBSCHEMA):
    """
    Check if a user is assigned to a file.
    
    Args:
        cursor: Database cursor
        file_id: File ID to check
        user_id: User ID to check
        DBSCHEMA: Database schema name (ICAT or santova)
    
    Returns:
        bool: True if user is assigned to the file, False otherwise
    """
    cursor.execute(
        f"EXEC {DBSCHEMA}.IsUserAssignedToFile @FileID=%s, @UserID=%s",
        (file_id, user_id)
    )
    row = cursor.fetchone()
    return bool(row and row[0] == 1)
