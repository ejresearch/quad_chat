"""
Database connection and helper functions for ASHER (local use)
Uses SQLite for zero-configuration local storage
"""

import sqlite3
import json
import os
from contextlib import contextmanager
from pathlib import Path

# Database file location - in data/ directory
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
DB_PATH = DATA_DIR / "asher.db"


def dict_factory(cursor, row):
    """Convert SQLite rows to dictionaries"""
    fields = [column[0] for column in cursor.description]
    return {key: value for key, value in zip(fields, row)}


@contextmanager
def get_db():
    """Get a database connection with automatic cleanup"""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = dict_factory
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def query(sql, params=None, fetch_one=False):
    """Execute a query and return results as dictionaries"""
    # Convert %s to ? for SQLite
    sql = sql.replace('%s', '?')
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(sql, params or ())
        if fetch_one:
            row = cur.fetchone()
            return row if row else None
        return cur.fetchall()


def query_one(sql, params=None):
    """Execute a query and return a single result"""
    sql = sql.replace('%s', '?')
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(sql, params or ())
        return cur.fetchone()


def execute(sql, params=None):
    """Execute a query without returning results"""
    sql = sql.replace('%s', '?')
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(sql, params or ())


def execute_returning(sql, params=None):
    """Execute an INSERT and return the inserted row"""
    import re

    sql = sql.replace('%s', '?')

    # Remove RETURNING clause for SQLite
    if 'RETURNING' in sql.upper():
        sql = re.split(r'\bRETURNING\b', sql, flags=re.IGNORECASE)[0].strip()

    with get_db() as conn:
        cur = conn.cursor()
        sql_upper = sql.upper()

        if 'INSERT INTO' in sql_upper:
            # Extract table name using regex
            match = re.search(r'INSERT\s+INTO\s+(\w+)', sql, re.IGNORECASE)
            table = match.group(1) if match else None

            cur.execute(sql, params or ())
            row_id = cur.lastrowid

            if table and row_id:
                cur.execute(f"SELECT * FROM {table} WHERE id = ?", (row_id,))
                return cur.fetchone()

        elif 'UPDATE' in sql_upper:
            # Extract table name using regex
            match = re.search(r'UPDATE\s+(\w+)', sql, re.IGNORECASE)
            table = match.group(1) if match else None

            cur.execute(sql, params or ())

            # The ID is the last parameter
            row_id = params[-1] if params else None
            if table and row_id:
                cur.execute(f"SELECT * FROM {table} WHERE id = ?", (row_id,))
                return cur.fetchone()

        return None


def init_db():
    """Initialize database tables if they don't exist"""
    with get_db() as conn:
        cur = conn.cursor()

        # Conversations table (no user_id - local single-user)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT DEFAULT 'New Conversation',
                system_prompt TEXT DEFAULT '',
                documents TEXT DEFAULT '[]',
                provider_settings TEXT DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Messages table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                model TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Enable foreign keys
        cur.execute("PRAGMA foreign_keys = ON")

        conn.commit()
        print(f"Database initialized at {DB_PATH}")
