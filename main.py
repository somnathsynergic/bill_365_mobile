from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from api.main import router as apiRouter
# from admin.main import router as adminRouter
from fastapi.staticfiles import StaticFiles

# In a file like `config.py` or directly in your main file
# SECRET_KEY = "your-secret-key"  # Replace with a strong, randomly generated key
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 30
# import ssl
# testing git
app = FastAPI()
app.mount("/uploads", StaticFiles(directory="upload_file"), name="uploads")

# ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
# ssl_context.load_cert_chain('./cert/certificate.pem', keyfile='./cert/key.pem')

origins = [ "*" ]



# origins = [
#    "http://localhost",
#    "http://localhost:3000",
#    "https://billing.opentech4u.co.in",
#    "https://admin.bill365.app"
# ]

if __name__ == "__main__":
  uvicorn.run("main:app", host="0.0.0.0", port=3007, reload=True)
  # uvicorn.run("main:app", host="0.0.0.0", port=3007, reload=True, ssl_keyfile='./cert/private-key.pem', ssl_certfile='./cert/apibilling.pem')

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(apiRouter)
# app.include_router(adminRouter)

@app.get('/')
def index():
    return "Welcome to the billing app "