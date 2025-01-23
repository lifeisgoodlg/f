from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image
import torch
import os
import requests
import pathlib

# Windows 경로 문제 해결
temp = pathlib.PosixPath
pathlib.PosixPath = pathlib.WindowsPath

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
   CORSMiddleware,
   allow_origins=["*"],  
   allow_credentials=True,
   allow_methods=["*"],
   allow_headers=["*"],
)

# 모델 파일 경로 및 URL
MODEL_PATH = "best10_01.pt"
MODEL_URL = "https://drive.google.com/uc?id=1NtRbnCAb0I0ZtVuvsaJJ8eoQ64VYvnfm"

# 모델 파일 다운로드 함수
def download_model():
   if not os.path.exists(MODEL_PATH):
       try:
           response = requests.get(MODEL_URL, stream=True)
           if response.status_code == 200:
               with open(MODEL_PATH, "wb") as f:
                   for chunk in response.iter_content(chunk_size=8192):
                       f.write(chunk)
               print("모델 파일이 성공적으로 다운로드되었습니다.")
           else:
               raise HTTPException(status_code=500, detail="모델 파일 다운로드에 실패했습니다.")
       except Exception as e:
           raise HTTPException(status_code=500, detail=f"다운로드 중 오류 발생: {str(e)}")

# 모델 로드
def load_model():
   try:
       model = torch.hub.load('ultralytics/yolov5', 'custom', path=MODEL_PATH)
       print("모델이 성공적으로 로드되었습니다.")
       return model
   except Exception as e:
       raise HTTPException(status_code=500, detail=f"모델 로드 중 오류 발생: {str(e)}")

# 전역 변수로 모델 선언
model = None

@app.on_event("startup")
async def startup_event():
   global model
   download_model()
   model = load_model()

@app.post("/detect")
async def detect_food(file: UploadFile = File(...)):
   try:
       print(f"Received file: {file.filename}, content_type: {file.content_type}")
       image = Image.open(file.file)
       results = model(image)
       
       if results.pandas().xyxy[0].shape[0] > 0:
           df = results.pandas().xyxy[0]
           result_dict = df.to_dict(orient="records")
           print(f"Detection results: {result_dict}")
           return JSONResponse(content=result_dict)
       else:
           return {"message": "탐지된 결과가 없습니다."}
   except Exception as e:
       print(f"Error during detection: {str(e)}")
       raise HTTPException(status_code=500, detail=f"탐지 중 오류 발생: {str(e)}")

@app.get("/")
def read_root():
   return {"message": "FastAPI 음식 탐지 서버입니다."}