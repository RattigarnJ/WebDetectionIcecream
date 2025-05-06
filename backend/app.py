from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS  
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import subprocess
import sys
import os
import torch
import torchvision.transforms as transforms
from PIL import Image
import torchvision.models as models
import torch.nn as nn
import torch.nn.functional as F
import io
import datetime
import jwt
from functools import wraps
import bcrypt
from database import init_db, get_user
import sqlite3
from werkzeug.security import generate_password_hash
from datetime import timedelta
import csv
import uuid
import threading


app = Flask(__name__)

CORS(app)  # ✅ อนุญาตให้ React เรียก API ได้

datestart = ""
datestop = ""
period = ""
mode = ""

app.config['SECRET_KEY'] = 'your_secret_key'
DATABASE = "users.db"

app.config['SECRET_KEY'] = 'your_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)

# -------------------- Database Model -------------------- #
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    plain_password = db.Column(db.String(128), nullable=True)  # ✅ เพิ่มคอลัมน์
    role = db.Column(db.String(20), nullable=False)

# -------------------- Database Functions -------------------- #
def get_db_connection():
    """ สร้างการเชื่อมต่อฐานข้อมูล """
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def get_user(username):
    """ ดึงข้อมูลผู้ใช้จากฐานข้อมูล """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    return user

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

    # เพิ่มผู้ใช้ 'Dev' ในกรณีที่ไม่มี
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", ("Dev",))
    if not cursor.fetchone():
        hashed_password = bcrypt.hashpw("10110".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor.execute("INSERT INTO users (username, password, plain_password,role) VALUES (?, ?, ?, ?)",
                       ("Dev", hashed_password, 10110 ,"Dev"))
        conn.commit()
    conn.close()

def hash_passwords():
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()

    cursor.execute("SELECT username, password FROM users")
    users = cursor.fetchall()

    for username, password in users:
        if isinstance(password, int) or not password.startswith("$2b$"):  # ตรวจสอบว่ารหัสผ่านถูกเข้ารหัสหรือยัง
            password = str(password)  # แปลงเป็น string เผื่อเป็นตัวเลข
            hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            cursor.execute("UPDATE users SET password = ? WHERE username = ?", (hashed_password, username))
            print(f"Updated {username}'s password to bcrypt")

    conn.commit()
    conn.close()

# -------------------- Middleware ตรวจสอบ token -------------------- #
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')

        if token and token.startswith("Bearer "):
            token = token.split(" ")[1]  # แยกเฉพาะ token ออกมา

        if not token:
            print("⛔ No token provided")
            print("🔍 Request Headers:", request.headers)  # Debug headers
            return jsonify({'error': 'Token is missing!'}), 403
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = get_user(data['username'])

            if not current_user:
                print("⛔ User not found")
                return jsonify({'error': 'User not found!'}), 403
            
            current_user = dict(current_user)
            print(f"🔍 Token Verified: {current_user}")

        except jwt.ExpiredSignatureError:
            print("⛔ Token expired")
            return jsonify({'error': 'Token has expired!'}), 403
        except jwt.InvalidTokenError:
            print("⛔ Invalid token")
            return jsonify({'error': 'Token is invalid!'}), 403

        return f(current_user, *args, **kwargs)

    return decorated
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')

        if token and token.startswith("Bearer "):
            token = token.split(" ")[1]  # แยกเฉพาะ token ออกมา

        if not token:
            print("⛔ No token provided")
            print("🔍 Request Headers:", request.headers)  # Debug headers
            return jsonify({'error': 'Token is missing!'}), 403
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = get_user(data['username'])

            if not current_user:
                print("⛔ User not found")
                return jsonify({'error': 'User not found!'}), 403
            
            current_user = dict(current_user)
            print(f"🔍 Token Verified: {current_user}")

        except jwt.ExpiredSignatureError:
            print("⛔ Token expired")
            return jsonify({'error': 'Token has expired!'}), 403
        except jwt.InvalidTokenError:
            print("⛔ Invalid token")
            return jsonify({'error': 'Token is invalid!'}), 403

        return f(current_user, *args, **kwargs)

    return decorated

# -------------------- API Register -------------------- #
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get("username")
    password = data.get("password")  # ✅ รหัสผ่านที่กรอก
    role = data.get("role")

    if not username or not password or not role:
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    existing_user = cursor.fetchone()

    if existing_user:
        conn.close()
        return jsonify({"error": "Username already exists"}), 400

    # ✅ เก็บ plain_password และ password ที่ถูกเข้ารหัส
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    cursor.execute("""
        INSERT INTO users (username, password, plain_password, role) 
        VALUES (?, ?, ?, ?)
    """, (username, hashed_password, password, role))
    
    conn.commit()
    conn.close()
    return jsonify({"message": "User registered successfully"}), 201


# -------------------- API Login -------------------- #
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = get_user(username)
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401

    print(f"Stored password in DB: {user['password']}")  # ✅ Debug จุดนี้

    # ตรวจสอบรหัสผ่านที่ถูกเข้ารหัส
    if bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        token = jwt.encode({'username': username, 'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)},
                   app.config['SECRET_KEY'], algorithm="HS256")

        return jsonify({'token': token, 'role': user['role']})
    else:
        return jsonify({'error': 'Invalid credentials'}), 401
    
# decode('utf-8')

# API Protected Route
@app.route('/protected', methods=['GET'])
@token_required
def protected_route(current_user):
    return jsonify({'message': 'This is a protected route', 'user': current_user})

# -------------------- API ดึงรายชื่อผู้ใช้ -------------------- #
@app.route('/users', methods=['GET'])
def get_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, password, plain_password, role FROM users")
    users = cursor.fetchall()
    conn.close()

    return jsonify([dict(user) for user in users])  # ✅ ส่ง plain_password ไปด้วย

# -------------------- API อัปเดตผู้ใช้ -------------------- #
@app.route('/update-user', methods=['POST'])
def update_user():
    """ อัปเดตข้อมูล user """
    data = request.json
    user_id = data.get("id")
    new_username = data.get("username")
    new_password = data.get("password")
    new_role = data.get("role")

    if not user_id or not new_username or not new_password or not new_role:
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        cursor.execute("""
            UPDATE users 
            SET username = ?, password = ?, plain_password = ?, role = ? 
            WHERE id = ?
        """, (new_username, hashed_password, new_password, new_role, user_id))

        conn.commit()
        conn.close()
        return jsonify({"message": "User updated successfully"})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "Username already exists"}), 400
    


#-----------------------------DELETE------------------------------------------

@app.route('/delete-user/<int:user_id>', methods=['DELETE'])
@token_required
def delete_user(current_user, user_id):
    """ ลบข้อมูลผู้ใช้จากฐานข้อมูล """
    print(f"🔍 Current User: {current_user}")
    print(f"🔍 Current Role: {current_user['role']}")
    
    if current_user['role'] not in ['Dev', 'Admin']:
        print("⛔ Unauthorized access")
        return jsonify({"error": "Unauthorized access"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user_to_delete = cursor.fetchone()
    
    if not user_to_delete:
        conn.close()
        return jsonify({"error": "User not found"}), 404

    try:
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        cursor.close()  # ✅ ปิด Cursor ก่อน Commit
        conn.commit()
        conn.close()
        print("✅ User deleted successfully")
        return jsonify({"message": "User deleted successfully"}), 200
    except Exception as e:
        conn.close()
        print(f"❌ Failed to delete user: {str(e)}")
        return jsonify({"error": f"Failed to delete user: {str(e)}"}), 500



# ---------------------------- RPA Part
# @app.route('/run_rpa', methods=['POST'])
# def run_rpa():
#     try:
#         data = request.json
#         row = str(data.get("row", "")).strip()
#         column = str(data.get("column", "")).strip()
#         month1 = str(data.get("month1", "")).strip()
#         year1 = str(data.get("year1", "")).strip()
#         periodday = str(data.get("periodday", "")).strip()
#         moderun = str(data.get("moderun", "")).strip()

#         if moderun == "st":
#             if not all([row, column, month1, year1, periodday]):
#                 return jsonify({"error": "❌ Missing parameters"}), 400

#             print(f"📌 Running RPA with params: {row}, {column}, {month1}, {year1}, {periodday}")

#             if os.name == "nt":  # Windows
#                 subprocess.Popen(
#                     [sys.executable, "rpa_pullperiodst.py", row, column, month1, year1, periodday],
#                     creationflags=subprocess.CREATE_NEW_CONSOLE  # ✅ เปิดหน้าต่างใหม่
#             )

#             return jsonify({"message": "RPA started successfully"}), 200
        
#         elif moderun == "ld":
#             if not all([row, column, month1, year1, periodday]):
#                 return jsonify({"error": "❌ Missing parameters"}), 400

#             print(f"📌 Running RPA with params: {row}, {column}, {month1}, {year1}, {periodday}")

#             if os.name == "nt":  # Windows
#                 subprocess.Popen(
#                     [sys.executable, "rpa_pullperiodld.py", row, column, month1, year1, periodday],
#                     creationflags=subprocess.CREATE_NEW_CONSOLE  # ✅ เปิดหน้าต่างใหม่
#             )

#             return jsonify({"message": "✅ RPA started successfully"}), 200

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

rpa_running = False
rpa_message = "กำลังดำเนินการ RPA..."

@app.route('/run_rpa', methods=['POST'])
def run_rpa():
    global rpa_running, rpa_message
    try:
        data = request.json
        row = str(data.get("row", "")).strip()
        column = str(data.get("column", "")).strip()
        month1 = str(data.get("month1", "")).strip()
        year1 = str(data.get("year1", "")).strip()
        periodday = str(data.get("periodday", "")).strip()
        moderun = str(data.get("moderun", "")).strip()

        if rpa_running:
            return jsonify({"error": "❌ RPA is already running"}), 400

        if moderun not in ["st", "ld"]:
            return jsonify({"error": "❌ Invalid moderun value"}), 400

        if not all([row, column, month1, year1, periodday]):
            return jsonify({"error": "❌ Missing parameters"}), 400

        print(f"📌 Running RPA with params: {row}, {column}, {month1}, {year1}, {periodday}")

        rpa_running = True
        rpa_message = "กำลังดำเนินการ RPA..."

        def execute_rpa():
            global rpa_running, rpa_message
            try:
                script = "rpa_pullperiodst.py" if moderun == "st" else "rpa_pullperiodld.py"
                if os.name == "nt":  # Windows
                    subprocess.run(
                        [sys.executable, script, row, column, month1, year1, periodday],
                        creationflags=subprocess.CREATE_NEW_CONSOLE,
                        check=True
                    )
                else:  # Linux/Mac
                    subprocess.run(
                        [sys.executable, script, row, column, month1, year1, periodday],
                        check=True
                    )
                rpa_message = "RPA เสร็จสิ้น"
            except Exception as e:
                rpa_message = f"ข้อผิดพลาด: {str(e)}"
            finally:
                rpa_running = False

        threading.Thread(target=execute_rpa, daemon=True).start()
        return jsonify({"message": "✅ RPA started successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/rpa_status', methods=['GET'])
def rpa_status():
    return jsonify({"running": rpa_running, "message": rpa_message})

# ---------------------------- GETTING INFO Part

# Getting info for show images from showst & showld
@app.route('/getinfoshow', methods=['POST'])
def getdateshow():
    global datestart
    global datestop
    global period
    global mode

    data = request.json
    datestart = str(data.get("datestart", "")).strip()
    datestop = str(data.get("datestop", "")).strip()
    period = str(data.get("period", "")).strip()
    mode = str(data.get("mode", "")).strip()

    # แปลงวันที่
    try:
        start_date = datetime.datetime.strptime(datestart, "%Y-%m-%d").date()
        end_date = datetime.datetime.strptime(datestop, "%Y-%m-%d").date()

    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400
    
    global modetext
    
    if mode == 'ld':
        mode = "LyingdownContract"
        modetext = "HORIZONTAL FREEZER "
    elif mode == 'st':
        mode = "StandingContract"
        modetext = "VERTICAL FREEZER "

    global IMAGE_DIR
    global csv_file_path

    # กำหนด path สำหรับ CSV
    # csv_file_path = f"C:/Users/Ratti/Documents/IceCreamDetection/{mode}/CSV_file/{start_date}_csv.csv"
    csv_file_path = [
        f"C:/Users/Ratti/Documents/IceCreamDetection/{mode}/CSV_file/{(start_date + timedelta(days=i)).strftime('%Y-%m-%d')}_csv.csv"
        for i in range((end_date - start_date).days + 1)
    ]

    global CSV_DIR

    CSV_DIR = []
    current_date = start_date
    while current_date <= end_date:
        dir_path = f"C:/Users/Ratti/Documents/IceCreamDetection/{mode}/CSV_file/{current_date.strftime('%Y-%m-%d')}_csv.csv"
        CSV_DIR.append(dir_path)
        current_date += timedelta(days=1)  # เพิ่มวันละ 1


    IMAGE_DIR = []
    current_date = start_date
    while current_date <= end_date:
        dir_path = f"C:/Users/Ratti/Documents/IceCreamDetection/{mode}/IMAGE_file/{current_date.strftime('%Y-%m-%d')}"
        IMAGE_DIR.append(dir_path)
        current_date += timedelta(days=1)  # เพิ่มวันละ 1

    datestart = start_date
    datestop = end_date


    return jsonify({
        "message": "บันทึก",
        "datestart": str(start_date.strftime("%d/%m/%Y")),
        "datestop": str(end_date.strftime("%d/%m/%Y")),
        "period": period,
        "mode": mode,
        "image_dirs": IMAGE_DIR,
        "csv_file_path": csv_file_path,
        "modetext": modetext
    })

# endpoint ใหม่สำหรับส่งข้อมูลไป ShowReport
@app.route('/get_report_info', methods=['GET'])
def get_report_info():

    global datestart
    global datestop
    global modetext

    report_data = {
        "datestart": str(datestart.strftime("%d/%m/%Y")),
        "datestop": str(datestop.strftime("%d/%m/%Y")),
        "modetext": str(modetext)
    }
    return jsonify(report_data), 200

# ---------------------------- AI PREDICTION Part

model_path = "C:/Users/Ratti/myicecreamapp/backend/resnet50_checkpoint_0.pth"

# โหลดโครงสร้าง ResNet50 (ใช้ `weights=None` แทน `pretrained=False`)
model = models.resnet50(weights=None)

# โหลด checkpoint
checkpoint = torch.load(model_path, map_location=torch.device("cpu"))

# **กำหนด output layer ให้ตรง**
num_classes = checkpoint["model_state_dict"]["fc.weight"].shape[0]  # ดึงจำนวนคลาสจาก checkpoint
model.fc = torch.nn.Linear(2048, num_classes)  # แก้ output layer

# โหลด state_dict
model.load_state_dict(checkpoint["model_state_dict"])
model.eval()  # ตั้งค่าเป็นโหมดประเมินผล

STATIC_DIR = "C:/Users/Ratti/myicecreamapp/backend/static/images"

# ตรวจสอบว่า static folder มีอยู่หรือไม่
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR)

# 🔹 **แปลงรูปก่อน Predict**
def preprocess_image(image_path):
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    image = Image.open(image_path).convert("RGB")
    return transform(image).unsqueeze(0)

# 🔹 **รันโมเดลเพื่อทำนาย**
def predict_image(image_path):
    image_tensor = preprocess_image(image_path)
    with torch.no_grad():
        output = model(image_tensor)
        _, predicted = torch.max(output, 1)
    return predicted.item()

from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True

@app.route('/predict_all', methods=['GET'])
def predict_all():
    global IMAGE_DIR

    if not IMAGE_DIR or not isinstance(IMAGE_DIR, list):
        return jsonify({"error": "Image directories not set. Please call /getinfoshow first"}), 400

    predictions = []
    seen_paths = set()

    for dir_path in IMAGE_DIR:
        if not os.path.exists(dir_path):
            print(f"Directory not found: {dir_path}")
            continue

        for foldername, subfolders, filenames in os.walk(dir_path):
            for filename in filenames:
                if filename.lower().endswith((".png", ".jpg", ".jpeg")):
                    image_path = os.path.join(foldername, filename)

                    try:
                        # สร้างชื่อไฟล์ไม่ซ้ำ
                        unique_id = str(uuid.uuid4())[:8]
                        static_filename = f"{unique_id}_{filename}"
                        static_path = os.path.join(STATIC_DIR, static_filename)

                        # ถ้ายังไม่มีไฟล์ static ให้เซฟ
                        if not os.path.exists(static_path):
                            os.makedirs(os.path.dirname(static_path), exist_ok=True)
                            with Image.open(image_path) as img:
                                img.save(static_path)

                        prediction = predict_image(image_path)
                        static_url = f"http://127.0.0.1:5000/static/images/{static_filename}"

                        if static_url not in seen_paths:
                            seen_paths.add(static_url)
                            predictions.append({
                                "filename": filename,
                                "path": static_url,
                                "prediction": prediction
                            })
                        else:
                            print(f"Duplicate path skipped: {static_url}")

                    except Exception as e:
                        print(f"❌ Error processing image {image_path}: {e}")
                        continue  # ข้ามไฟล์ที่พังไป

    if not predictions:
        return jsonify({"error": "No valid images found in any directory"}), 404

    print("Predictions sent:", predictions)
    return jsonify(predictions)

@app.route('/get_csv_data', methods=['GET'])
def get_csv_data():
    global csv_file_path
    data = []

    if not csv_file_path:
        return jsonify({"error": "No CSV files specified"}), 400

    try:
        for file_path in csv_file_path:
            if not os.path.exists(file_path):
                print(f"File not found: {file_path}")  # Log ไฟล์ที่หายไป
                continue  # ข้ามไฟล์ที่ไม่มี

            with open(file_path, mode='r', encoding='utf-8') as csv_file:
                csv_reader = csv.DictReader(csv_file)
                print("CSV Headers:", csv_reader.fieldnames)  # Debug headers
                for row in csv_reader:
                    data.append({
                        "สถานะการเข้างาน": row.get("สถานะการเข้างาน", "-"),
                        "จองโดย": row.get("จองโดย", "-"),
                        "หมายเลขงาน": row.get("หมายเลขงาน", "-"),
                        "รหัสร้าน": row.get("รหัสร้าน", "-"),
                        "ชื่อร้าน": row.get("ชื่อร้าน", "-"),
                        "โซน": row.get("โซน", "-"),
                        "ทีม": row.get("ทีม", "-"),
                        "สัญญา": row.get("สัญญา", "-"),
                        "ผู้รับผิดชอบงาน": row.get("ผู้รับผิดชอบงาน", "-"),
                        "แผนเข้างาน": row.get("แผนเข้างาน", "-"),
                        "เวลาเริ่มงาน": row.get("เวลาเริ่มงาน", "-"),
                        "เวลาปิดงาน": row.get("เวลาปิดงาน", "-"),
                        "ข้อเสนอแนะ": row.get("ข้อเสนอแนะ", "-"),
                        "ข้อเสนอแนะเพิ่มเติม": row.get("ข้อเสนอแนะเพิ่มเติม", "-")
                    })

        if not data:
            return jsonify({"message": "No data found in CSV files"}), 200

        return jsonify(data)

    except KeyError as e:
        return jsonify({"error": f"CSV column not found: {str(e)}"}), 500
    except UnicodeDecodeError as e:
        return jsonify({"error": f"Encoding error: {str(e)}. Try 'tis-620' encoding."}), 500
    except Exception as e:
        return jsonify({"error": f"Error reading CSV: {str(e)}"}), 500

#   *** Long times Process for prediction images
# 304 status - image used to show before (previous process)

if __name__ == '__main__':
    app.run(debug=True, port=5000) 

# if __name__ == '__main__':
#     app.run(host='127.0.0.1', port=5000, debug=False)
