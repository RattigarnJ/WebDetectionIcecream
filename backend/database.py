import sqlite3
import bcrypt

DATABASE = "users.db"

def get_db_connection():
    """ สร้างการเชื่อมต่อฐานข้อมูล """
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """ สร้างตารางผู้ใช้ในฐานข้อมูล ถ้าไม่มี """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            plain_password TEXT,  -- ✅ เพิ่มคอลัมน์นี้
            role TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def get_user(username):
    """ ดึงข้อมูลผู้ใช้จากฐานข้อมูล """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    return user
