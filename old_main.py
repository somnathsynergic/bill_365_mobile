from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from api.main import router as apiRouter
from admin.main import router as adminRouter
from fastapi.staticfiles import StaticFiles
# import ssl

# testing git
app = FastAPI()

# ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
# ssl_context.load_cert_chain('./cert/certificate.pem', keyfile='./cert/key.pem')

app.mount("/uploads", StaticFiles(directory="upload_file"), name="uploads")



origins = [
    "http://localhost",
    "http://localhost:3000",
    "https://billing.opentech4u.co.in",
    "https://admin.bill365.app"
]

  if __name__ == "__main__":
   uvicorn.run("main:app", host="0.0.0.0", port=3007, reload=True, ssl_keyfile='./cert/private-key.pem', ssl_certfile='./cert/apibilling.pem')

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(apiRouter)
app.include_router(adminRouter)

@app.get('/')
def index():
    return "Welcome to the billing app "