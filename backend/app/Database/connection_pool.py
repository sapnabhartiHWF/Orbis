"""
Database Connection Pool Manager
Provides connection reuse to reduce overhead from creating new connections.
Note: pymssql doesn't support native connection pooling, so we implement a simple pool.
"""
import pymssql
import os
import threading
from queue import Queue, Empty
from dotenv import load_dotenv
from contextlib import contextmanager

load_dotenv()

class ConnectionPool:
    """
    Simple connection pool for pymssql connections.
    Thread-safe implementation using Queue.
    """
    def __init__(self, min_size=2, max_size=10):
        self.min_size = min_size
        self.max_size = max_size
        self._pool = Queue(maxsize=max_size)
        self._created = 0
        self._lock = threading.Lock()
        
        # Database credentials
        self.server = os.environ.get("server")
        self.user = os.environ.get("user")
        self.password = os.environ.get("password")
        self.database = os.environ.get("database")
        
        # Pre-populate pool with minimum connections
        self._initialize_pool()
    
    def _create_connection(self):
        """Create a new database connection."""
        try:
            conn = pymssql.connect(
                server=self.server,
                user=self.user,
                password=self.password,
                database=self.database
            )
            return conn
        except pymssql.Error as e:
            print(f"Error creating database connection: {e}")
            return None
    
    def _initialize_pool(self):
        """Initialize the pool with minimum connections."""
        for _ in range(self.min_size):
            conn = self._create_connection()
            if conn:
                self._pool.put(conn)
                with self._lock:
                    self._created += 1
    
    def get_connection(self):
        """
        Get a connection from the pool.
        Creates a new connection if pool is empty and under max_size.
        """
        try:
            # Try to get connection from pool (non-blocking)
            conn = self._pool.get_nowait()
            # Test if connection is still alive
            try:
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                cursor.close()
                return conn
            except:
                # Connection is dead, create a new one
                conn.close()
                return self._create_connection()
        except Empty:
            # Pool is empty, create new connection if under max
            with self._lock:
                if self._created < self.max_size:
                    conn = self._create_connection()
                    if conn:
                        self._created += 1
                        return conn
            # Max connections reached, wait for one to be returned
            return self._pool.get(timeout=5)
    
    def return_connection(self, conn):
        """Return a connection to the pool."""
        if conn:
            try:
                # Check if connection is still valid
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                cursor.close()
                # Connection is valid, return to pool
                try:
                    self._pool.put_nowait(conn)
                except:
                    # Pool is full, close the connection
                    conn.close()
                    with self._lock:
                        self._created -= 1
            except:
                # Connection is invalid, close it
                try:
                    conn.close()
                except:
                    pass
                with self._lock:
                    self._created -= 1
    
    @contextmanager
    def get_connection_context(self):
        """
        Context manager for getting a connection.
        Automatically returns connection to pool when done.
        """
        conn = None
        try:
            conn = self.get_connection()
            yield conn
        finally:
            if conn:
                self.return_connection(conn)
    
    def close_all(self):
        """Close all connections in the pool."""
        while not self._pool.empty():
            try:
                conn = self._pool.get_nowait()
                conn.close()
            except Empty:
                break
        with self._lock:
            self._created = 0

# Global connection pool instance
_pool_instance = None
_pool_lock = threading.Lock()

def get_connection_pool():
    """Get or create the global connection pool instance."""
    global _pool_instance
    if _pool_instance is None:
        with _pool_lock:
            if _pool_instance is None:
                _pool_instance = ConnectionPool(min_size=2, max_size=10)
    return _pool_instance

def connect_to_database():
    """
    Get a connection from the pool.
    For backward compatibility, maintains the same interface.
    Note: Connections from pool should be returned using return_connection().
    """
    pool = get_connection_pool()
    return pool.get_connection()

def return_connection(conn):
    """Return a connection to the pool."""
    pool = get_connection_pool()
    pool.return_connection(conn)

