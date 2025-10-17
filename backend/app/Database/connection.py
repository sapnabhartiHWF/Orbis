import pymssql

def connect_to_database():
    """
    Establish a connection to the database using pymssql.
    
    Returns:
        pymssql.Connection: A connection object to the database.
    """
    try:
        # conn = pymssql.connect(server="plesk6900.is.cc",
        #                        user="zoz",
        #                        password="Syon_Soft",
        #                        database="santova")
        conn = pymssql.connect(server="sql5097.site4now.net",
                               user="DB_A4EFFD_Hybridwf_admin",
                               password="yL3qjUOBX@seJyC",
                               database="DB_A4EFFD_Hybridwf")
        print("Connection successful")
        return conn
    except pymssql.Error as e:
        print(f"Error connecting to the database: {e}")
        return None