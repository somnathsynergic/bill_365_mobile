from fastapi import APIRouter
from config.database import connect
from models.master_model import createResponse
from models.form_model import LoginFlag, UserLogin,LoginStatus,CreatePIN,Token,TokenResponse,TokenData
# from models.otp_model import generateOTP
from utils import get_hashed_password
import uuid
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import  OAuth2PasswordBearer,OAuth2PasswordRequestForm
from passlib.context import CryptContext
from typing import Optional, Dict,List
from datetime import datetime, timedelta
# from jose import jwt
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi import FastAPI, Query

import random
import requests
import urllib.parse
import json
# testing git
userRouter = APIRouter()
# In a file like `config.py` or directly in your main file
SECRET_KEY = "your-secret-key"  # Replace with a strong, randomly generated key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
REFRESH_SECRET_KEY = "anotherverysecretkey_for_refresh"
import json
import firebase_admin
from firebase_admin import credentials, messaging


cred = credentials.Certificate('key.json')
firebase_admin.initialize_app(cred)

# def create_access_token(data: dict, expires_delta: timedelta | None = None):
#     to_encode = data.copy()
#     if expires_delta:
#         expire = datetime.utcnow() + expires_delta
#     else:
#         expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
#     to_encode.update({"exp": expire})
#     encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
#     return encoded_jwt

# def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
#     to_encode = data.copy()
#     # Add a unique identifier for this refresh token
#     jti = str(uuid.uuid4())
#     to_encode.update({"jti": jti})
#     if expires_delta:
#         expire = datetime.utcnow() + expires_delta
#     else:
#         expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
#     to_encode.update({"exp": expire, "iat": datetime.utcnow()})
#     encoded = jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
#     return encoded, jti


def send_welcome_notification(fcm_token, title, body, data=None):
    # Build the message
    message = messaging.Message(
        notification=messaging.Notification(title=title, body=body),
        data=data or {},  # optional custom key-values
        token=fcm_token
    )
    # Send the message
    response = messaging.send(message)
    # print('Successfully sent message:', response)

class ConnectionManager:
    def __init__(self):
        # map session_id -> WebSocket
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        # caller must have websocket.accept() before connect()
        self.active_connections[session_id] = websocket

    def disconnect(self, session_id: str):
        self.active_connections.pop(session_id, None)

    async def send_to_session(self, session_id: str, message: dict):
        ws = self.active_connections.get(session_id)
        if not ws:
            return False
        try:
            await ws.send_text(json.dumps(message))
            return True
        except Exception:
            # failed send -> cleanup
            self.disconnect(session_id)
            return False

    async def close_session(self, session_id: str, code: int = 1000):
        ws = self.active_connections.get(session_id)
        if ws:
            try:
                await ws.close(code=code)
            finally:
                self.disconnect(session_id)

manager = ConnectionManager()

@userRouter.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Expect session_id in query params (or use token header)
    session_id = websocket.query_params.get("session_id")
    if not session_id:
        await websocket.close(code=4000)
        return

    # Optionally: validate session_id with DB here
    await websocket.accept()
    await manager.connect(session_id, websocket)

    try:
        while True:
            data = await websocket.receive_text()
            # handle incoming messages...
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        manager.disconnect(session_id)
    except Exception:
        manager.disconnect(session_id)




# Verify Phone no and active status
#------------------------------------------------------------------------------------------------------
@userRouter.post('/verify_phone/{phone_no}')
async def verify(phone_no:int):
    conn = connect()
    cursor = conn.cursor()
    query = f"SELECT COUNT(*)phone_no FROM md_user WHERE user_id=phone_no AND user_type in ('U','M') AND phone_no={phone_no}"
    cursor.execute(query)
    records = cursor.fetchall()
    # print(records)
    result = createResponse(records, cursor.column_names, 1)
    conn.close()
    cursor.close()
    # return result
    if records==[(0,)]:
       resData= {"status":0, "data":"invalid phone"}
    else:
        resData= {
        "status":1,
        "data":"valid phone no."
        }
    return resData
     
   
@userRouter.post('/verify_active/{phone_no}')
async def verify(phone_no:int):
    conn = connect()
    cursor = conn.cursor()
    query = f"SELECT COUNT(*)active_flag FROM md_user WHERE active_flag='N' AND user_id={phone_no}"
    cursor.execute(query)
    records = cursor.fetchall()
    # print(records)
    # result = createResponse(records, cursor.column_names, 1)
    conn.close()
    cursor.close()
    if records==[(0,)]:
        resData= {"status":-1, "data":"Already registered or invalid phone"}
    else:
        resData= {
        "status":1,
        "data":"registered successfully"
        }
    return resData 

# Create PIN
#-------------------------------------------------------------------------------------------------------------
@userRouter.post('/create_pin')
async def register(data:CreatePIN):
    password=data.PIN
    haspass=get_hashed_password(password)
    conn = connect()
    cursor = conn.cursor()
    query = f"UPDATE md_user SET password='{haspass}', active_flag='Y' where user_id='{data.phone_no}'"
    cursor.execute(query)
    conn.commit()
    conn.close()
    cursor.close()
    # print(cursor.rowcount)
    if cursor.rowcount==1:
        resData= {"status":1, "data":"Pin inserted"}
    else:
        resData= {
        "status":0,
        "data":"invalid phone"
        }
    return resData 

# Generate OTP
#-------------------------------------------------------------------------------------------------------------
@userRouter.post('/otp/{phone_no}') 
async def OTP(phone_no:int):
    return {"status":1, "data":"1234"}

# USER LOGIN
# def authenticate_user(username: str, password: str):
#     user = fake_users_db.get(username)
#     if not user or not verify_password(password, user["hashed_password"]):
#         return None
#     return user

# @userRouter.post("/token")
# async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
#     user = authenticate_user(form_data.username, form_data.password)
#     if not user:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Incorrect username or password",
#             headers={"WWW-Authenticate": "Bearer"},
#         )
#     access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
#     access_token = create_access_token(
#         data={"sub": user["username"]}, expires_delta=access_token_expires
#     )
#     return {"access_token": access_token, "token_type": "bearer"}

@userRouter.post('/update_login_status')
async def update_login_status(data:LoginStatus):
    conn = connect()
    cursor = conn.cursor()
    query = f"update md_user set login_flag = 'Y' where user_id = '{data.user_id}'"
    cursor.execute(query)
    conn.commit()
    conn.close()
    cursor.close()
    if cursor.rowcount>0:
        resData={"suc":1, "msg":"User login flag updated"}
    else:
        resData={"suc":0, "msg":"failed to update login_flag"}

    return resData

#-----------------------------------------------------------------------------------------------------------  
@userRouter.post('/login')
async def login(data_login:UserLogin):
    # print(data_login.user_id,data_login.fcm_token)
    # print(data_login)
    conn = connect()
    cursor = conn.cursor()
    query = f"SELECT a.*, b.*, c.* FROM md_user a, md_branch b, md_company c WHERE a.user_id='{data_login.user_id}' AND b.id=a.br_id AND c.id=a.comp_id AND a.active_flag='Y' AND a.user_type in ('U','M')"
    cursor.execute(query)
    records = cursor.fetchone()
   

    if cursor.rowcount>0:
        result = createResponse(records, cursor.column_names, 0)
        conn.close()
        cursor.close()

        conn = connect()
        cursor = conn.cursor()
        query = f"select count(*)no_of_user from md_user where comp_id={result['comp_id']}"
        cursor.execute(query)
        records = cursor.fetchone()
        result1 = createResponse(records, cursor.column_names, 0)
        # print(result1,'result1')
        conn.close()
        cursor.close()

        conn = connect()
        cursor = conn.cursor()
        query = f"select fcm_token from md_user where comp_id = {result['comp_id']} AND user_id='{data_login.user_id}' AND user_type in ('U','M')"
        cursor.execute(query)
        print(query,'query')
        records = cursor.fetchone()
        result2 = createResponse(records, cursor.column_names, 0)
        print(result2,'result2')
        # print(result2)
        # if result2 and data_login.fcm_token != result2['fcm_token']:
        #     conn = connect()
        #     cursor = conn.cursor()
        #     print(data_login.fcm_token)
        #     query = f"update md_user set fcm_token='{data_login.fcm_token}' where user_id='{data_login.user_id}'"
        #     if result2['fcm_token']:
        #         message = messaging.Message(
        #             token=result2['fcm_token'],
        #             notification=messaging.Notification(
        #                 title="Logout Alert!",
        #                 body="Your device will be logged out soon!"
        #     ),
        #     data= {}
        #     )
        #         response = messaging.send(message)
        #     cursor.execute(query)
        #     # print(query)
        #     conn.commit()
            

        # print(result['max_user'],'max_user')
        if cursor.rowcount>0:
            conn.close()
            cursor.close()
            print(result1['no_of_user'],'result1' ,result['max_user'])
            if result1['no_of_user'] <= result['max_user']:
                res_dt = {"suc": 1, "msg": result, "user": result1['no_of_user']+1}
               
            else:
                res_dt = {"suc": 0, "msg": "Max user limit reached"}
        
        else:
            res_dt = {"suc": 0, "msg": "error while selecting no_of_user"}
    else:
        res_dt = {"suc": 0, "msg": "No user found"}

    return res_dt

@userRouter.post('/login_test')
async def login(data_login:UserLogin):
    conn = connect()
    cursor = conn.cursor()
    query = f"SELECT a.*, b.*, c.* FROM md_user a, md_branch b, md_company c WHERE a.user_id='{data_login.user_id}' AND b.id=a.br_id AND c.id=a.comp_id AND a.active_flag='Y' AND a.user_type in ('U','M')"
    cursor.execute(query)
    records = cursor.fetchone()
    print(records)
   

    if cursor.rowcount>0:
        result = createResponse(records, cursor.column_names, 0)
        conn.close()
        cursor.close()

        conn = connect()
        cursor = conn.cursor()
        query = f"select count(*)no_of_user from md_user where comp_id={result['comp_id']}"
        cursor.execute(query)
        records = cursor.fetchone()
        result1 = createResponse(records, cursor.column_names, 0)
        # print(result1,'result1')
        conn.close()
        cursor.close()

        conn = connect()
        cursor = conn.cursor()
        query = f"select fcm_token from md_user where comp_id = {result['comp_id']} AND user_id='{data_login.user_id}' AND user_type in ('U','M')"
        cursor.execute(query)
        print(query,'query')
        records = cursor.fetchone()
        result2 = createResponse(records, cursor.column_names, 0)
        print(result2,'result2')
        # print(result2)
        # if result2 and data_login.fcm_token != result2['fcm_token']:
        #     conn = connect()
        #     cursor = conn.cursor()
        #     print(data_login.fcm_token)
        #     query = f"update md_user set fcm_token='{data_login.fcm_token}' where user_id='{data_login.user_id}'"
        #     if result2['fcm_token']:
        #         message = messaging.Message(
        #             token=result2['fcm_token'],
        #             notification=messaging.Notification(
        #                 title="Logout Alert!",
        #                 body="Your device will be logged out soon!"
        #     ),
        #     data= {}
        #     )
        #         response = messaging.send(message)
        #     cursor.execute(query)
        #     # print(query)
        #     conn.commit()
            

        # print(result['max_user'],'max_user')
        otp = random.randint(1000, 9999)
        print(otp)
        default_text = f"https://bulksms.sssplsales.in/api/api_http.php?username=SYNERGIC&password=SYN@526RGC&senderid=SYNGIC&to={int(data_login.user_id)}&text=OTP for mobile verification is {otp}. This code is valid for 5 minutes. Please do not share this OTP with anyone.-SYNGIC&route=Informative&type=text"
        print(default_text)
        try:
            response = requests.get(default_text)
            
            print(response,'response')
            send_msg = response.text
        except Exception as e:
            send_msg = f"Error sending SMS: {str(e)}"

        sms = {
            "suc": 1,
            "msg": send_msg,
            "otp": otp
        }
        print(sms)
        if cursor.rowcount>0:
            conn.close()
            cursor.close()
            print(result1['no_of_user'] ,result['max_user'])
            if result1['no_of_user'] <= result['max_user']:
                res_dt = {"suc": 1, "msg": result, "user": result1['no_of_user']+1,'otp':otp}
               
            else:
                res_dt = {"suc": 0, "msg": "Max user limit reached"}
        
        else:
            res_dt = {"suc": 0, "msg": "error while selecting no_of_user"}
    else:
        res_dt = {"suc": 0, "msg": "No user found"}

    return res_dt

#=================================================================================================
#Logout 
@userRouter.post('/logout')
async def logout(flag:LoginFlag):
    conn = connect()
    cursor = conn.cursor()
    # print(flag)
    query = f"update md_user set login_flag = 'N' where comp_id={flag.comp_id} and br_id={flag.br_id} and user_id='{flag.user_id}' and user_type in ('U','M')"

    cursor.execute(query)
    conn.commit()
    conn.close()
    cursor.close()
    if cursor.rowcount>0:
        resData = {
            "status":1,
            "data":"logged out successfully"
        }
    else:
        resData = {
            "status":0,
            "data":"No user Found"
        }

    return resData

#sending login otp to frontend
@userRouter.get('/send_otp/{phone_no}') 
async def OTP(phone_no:int):
    otp = random.randint(1000, 9999)
    # print(otp)
    default_text = f"https://bulksms.sssplsales.in/api/api_http.php?username=SYNERGIC&password=SYN@526RGC&senderid=SYNGIC&to={phone_no}&text=OTP for mobile verification is {otp}. This code is valid for 5 minutes. Please do not share this OTP with anyone.-SYNGIC&route=Informative&type=text"
    try:
        response = requests.get(default_text)
        # print(response)
        send_msg = response.text
    except Exception as e:
        send_msg = f"Error sending SMS: {str(e)}"
    return {
        "suc": 1,
        "msg": send_msg,
        "otp": otp
    }

   
    