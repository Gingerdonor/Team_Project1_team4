import numpy as np
import requests
import xml.etree.ElementTree as ET
import socket
from _thread import *
from tensorflow.keras.models import load_model
from tensorflow.keras.metrics import MeanSquaredError
from flask import Flask, render_template, request, jsonify
import os
import json

# CUDA 오류 메시지 숨기기 (선택 사항)
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CALENDAR_FILE = os.path.join(BASE_DIR, 'cal.csv')
MODEL0_FILE = os.path.join(BASE_DIR, 'sky3000.h5')
MODEL1_FILE = os.path.join(BASE_DIR, 'earth3000.h5')

# <-- 2. 캐시 디렉터리 설정 코드 추가
SAJU_CACHE_DIR = os.path.join(BASE_DIR, 'saju_cache')
# 'saju_cache' 폴더가 없으면 생성
os.makedirs(SAJU_CACHE_DIR, exist_ok=True)

app = Flask(__name__)

sky = {'갑':1,'을':2,'병':3,'정':4,'무':5,'기':6,'경':7,'신':8,'임':9,'계':10}
earth = {'자':1,'축':2,'인':3,'묘':4,'진':5,'사':6,'오':7,'미':8,'신':9,'유':10,'술':11,'해':12}

# 모델 로드
try:
    model0 = load_model(MODEL0_FILE, custom_objects={'mse': MeanSquaredError})
    model1 = load_model(MODEL1_FILE, custom_objects={'mse': MeanSquaredError})
except IOError as e:
    print(f"Error loading models: {e}")
    print("Ensure 'sky3000.h5' and 'earth3000.h5' are in the same directory as app.py")
    exit()

# 점수 변수
p1=8
p11=9.5
p2=7
p21=8.2
p3=6
p31=7.2
p41 = 10
p42 = 8
p43 = 6
p5=8
p6=8
p7=0
p71=10
p8=0
p81=10
p82=6
p83=4

# Open API 키
open_api_key = open('open_api_key.txt').readline().strip()

def getKeybyvalue(list, val):
  for key, value in list.items():
    if value == val:
        return key
def get_one_hot(target, nb_classes):
  t =np.array(target).reshape(-1)
  res = np.eye(nb_classes)[np.array(t).reshape(-1)]
  return res.reshape(list(t.shape)+[nb_classes])

def calculate(token0, token1, gender0, gender1, s):
  score = s.item()
  a1 = token0[1]
  a2 = token0[3]
  a3 = token0[5]
  b1 = token1[1]
  b2 = token1[3]
  b3 = token1[5]
  sal0=[0,0,0,0,0,0,0,0]
  sal1=[0,0,0,0,0,0,0,0]

  if a3==3:
    if a1==6 or a1==9:
      if gender0==1:
        score -= p1
        sal0[0] += p1
      else:
        score -= p11
        sal0[0] += p11
    if a2==6 or a2==9:
      if gender0==1:
        score -= p1
        sal0[0] += p1
      else:
        score -= p11
        sal0[0] += p11
  if a3==7:
    if a1==2 or a1==5 or a1==7:
      if gender0==1:
        score -= p1
        sal0[0] += p1
      else:
        score -= p11
        sal0[0] += p11
      if a2==2 or a2==5 or a2==7:
          if gender0==1:
            score -= p1
            sal0[0] += p1
          else:
            score -= p11
            sal0[0] += p11
  if a3==2:
      if a1==7 or a1==8 or a1==11:
          if gender0==1:
            score -= p1
            sal0[0] += p1
          else:
            score -= p11
            sal0[0] += p11
      if a2==7 or a2==8 or a2==11:
          if gender0==1:
            score -= p1
            sal0[0] += p1
          else:
            score -= p11
            sal0[0] += p11
  if b3==3:
      if b1==6 or b1==9:
          if gender1==1:
            score -= p1
            sal1[0] += p1
          else:
            score -= p11
            sal1[0] += p11
      if b2==6 or b2==9:
          if gender1==1:
            score -= p1
            sal1[0] += p1
          else:
            score -= p11
            sal1[0] += p11
  if b3==7:
      if b1==2 or b1==5 or b1==7:
          if gender1==1:
            score -= p1
            sal1[0] += p1
          else:
            score -= p11
            sal1[0] += p11
      if b2==2 or b2==5 or b2==7:
          if gender1==1:
            score -= p1
            sal1[0] += p1
          else:
            score -= p11
            sal1[0] += p11
  if b3==2:
      if b1==7 or b1==8 or b1==11:
          if gender1==1:
            score -= p1
            sal1[0] += p1
          else:
            score -= p11
            sal1[0] += p11
      if b2==7 or b2==8 or b2==11:
          if gender1==1:
            score -= p1
            sal1[0] += p1
          else:
            score -= p11
            sal1[0] += p11

  if a3==1:
      if a1==10 or a2==10:
        if gender0==1:
            score -= p2
            sal0[1] += p2
        else:
            score -= p21
            sal0[1] += p21
  if a3==2:
      if a1==7 or a2==7:
        if gender0==1:
            score -= p2
            sal0[1] += p2
        else:
            score -= p21
            sal0[1] += p21
  if a3==3:
      if a1==8 or a2==8:
        if gender0==1:
            score -= p2
            sal0[1] += p2
        else:
            score -= p21
            sal0[1] += p21
  if a3==4:
      if a1==9 or a2==9:
        if gender0==1:
            score -= p2
            sal0[1] += p2
        else:
            score -= p21
            sal0[1] += p21
  if a3==5:
      if a1==12 or a2==12:
        if gender0==1:
            score -= p2
            sal0[1] += p2
        else:
            score -= p21
            sal0[1] += p21
  if a3==6:
      if a1==11 or a2==11:
        if gender0==1:
            score -= p2
            sal0[1] += p2
        else:
            score -= p21
            sal0[1] += p21
  if a3==7:
      if a1==2 or a2==2:
        if gender0==1:
            score -= p2
            sal0[1] += p2
        else:
            score -= p21
            sal0[1] += p21
  if a3==8:
      if a1==3 or a2==3:
        if gender0==1:
            score -= p2
            sal0[1] += p2
        else:
            score -= p21
            sal0[1] += p21
  if a3==9:
      if a1==4 or a2==4:
        if gender0==1:
            score -= p2
            sal0[1] += p2
        else:
            score -= p21
            sal0[1] += p21
  if a3==10:
      if a1==1 or a2==1:
        if gender0==1:
            score -= p2
            sal0[1] += p2
        else:
            score -= p21
            sal0[1] += p21
  if a3==11:
      if a1==6 or a2==6:
        if gender0==1:
            score -= p2
            sal0[1] += p2
        else:
            score -= p21
            sal0[1] += p21
  if a3==12:
      if a1==5 or a2==5:
        if gender0==1:
            score -= p2
            sal0[1] += p2
        else:
            score -= p21
            sal0[1] += p21
  if b3==1:
      if b1==10 or b2==10:
        if gender1==1:
            score -= p2
            sal1[1] += p2
        else:
            score -= p21
            sal1[1] += p21
  if b3==2:
      if b1==7 or b2==7:
        if gender1==1:
            score -= p2
            sal1[1] += p2
        else:
            score -= p21
            sal1[1] += p21
  if b3==3:
      if b1==8 or b2==8:
        if gender1==1:
            score -= p2
            sal1[1] += p2
        else:
            score -= p21
            sal1[1] += p21
  if b3==4:
      if b1==9 or b2==9:
        if gender1==1:
            score -= p2
            sal1[1] += p2
        else:
            score -= p21
            sal1[1] += p21
  if b3==5:
      if b1==12 or b2==12:
          score -= p2
          sal1[1] += p2
  if b3==6:
      if b1==11 or b2==11:
        if gender1==1:
            score -= p2
            sal1[1] += p2
        else:
            score -= p21
            sal1[1] += p21
  if b3==7:
      if b1==2 or b2==2:
        if gender1==1:
            score -= p2
            sal1[1] += p2
        else:
            score -= p21
            sal1[1] += p21
  if b3==8:
      if b1==3 or b2==3:
        if gender1==1:
            score -= p2
            sal1[1] += p2
        else:
            score -= p21
            sal1[1] += p21
  if b3==9:
      if b1==4 or b2==4:
        if gender1==1:
            score -= p2
            sal1[1] += p2
        else:
            score -= p21
            sal1[1] += p21
  if b3==10:
      if b1==1 or b2==1:
        if gender1==1:
            score -= p2
            sal1[1] += p2
        else:
            score -= p21
            sal1[1] += p21
  if b3==11:
      if b1==6 or b2==6:
        if gender1==1:
            score -= p2
            sal1[1] += p2
        else:
            score -= p21
            sal1[1] += p21
  if b3==12:
      if b1==5 or b2==5:
        if gender1==1:
            score -= p2
            sal1[1] += p2
        else:
            score -= p21
            sal1[1] += p21

  if (a1==1 and a2==10) or (a1==2 and a2==7) or (a1==3 and a2==8) or (a1==4 and a2==9) or (a1==5 and a2==12) or (a1==6 and a2==11) or (a1==10 and a2==1) or (a1==7 and a2==2) or (a1==8 and a2==3) or (a1==9 and a2==4) or (a1==12 and a2==5) or (a1==11 and a2==6):
    if gender0==1:
      score -= p2
      sal0[1] += p2
    else:
      score -= p21
      sal0[1] += p21
  if (b1==1 and b2==10) or (b1==2 and b2==7) or (b1==3 and b2==8) or (b1==4 and b2==9) or (b1==5 and b2==12) or (b1==6 and b2==11) or (b1==10 and b2==1) or (b1==7 and b2==2) or (b1==8 and b2==3) or (b1==9 and b2==4) or (b1==12 and b2==5) or (b1==11 and b2==6):
    if gender1==1:
      score -= p2
      sal1[1] += p2
    else:
      score -= p21
      sal1[1] += p21

  if a1==1:
      if a2==8:
          score -= p3
          sal0[2] += p3
      if a3==8:
          score -= p3
          sal0[2] += p3
  if a1==2:
      if a2==7:
          score -= p3
          sal0[2] += p3
      if a3==7:
          score -= p3
          sal0[2] += p3
  if a1==3:
      if a2==10:
          score -= p3
          sal0[2] += p3
      if a3==10:
          score -= p3
          sal0[2] += p3
  if a1==4:
      if a2==9:
          score -= p3
          sal0[2] += p3
      if a3==9:
          score -= p3
          sal0[2] += p3
  if a1==5:
      if a2==12:
          score -= p3
          sal0[2] += p3
      if a3==12:
          score -= p3
          sal0[2] += p3
  if a1==6:
      if a2==11:
          score -= p3
          sal0[2] += p3
      if a3==11:
          score -= p3
          sal0[2] += p3
  if a1==7:
      if a2==2:
          score -= p3
          sal0[2] += p3
      if a3==2:
          score -= p3
          sal0[2] += p3
  if a1==8:
      if a2==1:
          score -= p3
          sal0[2] += p3
      if a3==1:
          score -= p3
          sal0[2] += p3
  if a1==9:
      if a2==4:
          score -= p3
          sal0[2] += p3
      if a3==4:
          score -= p3
          sal0[2] += p3
  if a1==10:
      if a2==3:
          score -= p3
          sal0[2] += p3
      if a3==3:
          score -= p3
          sal0[2] += p3
  if a1==11:
      if a2==6:
          score -= p3
          sal0[2] += p3
      if a3==6:
          score -= p3
          sal0[2] += p3
  if a1==12:
      if a2==5:
          score -= p3
          sal0[2] += p3
      if a3==5:
          score -= p3
          sal0[2] += p3
  if a2==1:
      if a1==8:
          score -= p3
          sal0[2] += p3
      if a3==8:
          score -= p3
          sal0[2] += p3
  if a2==2:
      if a1==7:
          score -= p3
          sal0[2] += p3
      if a3==7:
          score -= p3
          sal0[2] += p3
  if a2==3:
      if a1==10:
          score -= p3
          sal0[2] += p3
      if a3==10:
          score -= p3
          sal0[2] += p3
  if a2==4:
      if a1==9:
          score -= p3
          sal0[2] += p3
      if a3==9:
          score -= p3
          sal0[2] += p3
  if a2==5:
      if a1==12:
          score -= p3
          sal0[2] += p3
      if a3==12:
          score -= p3
          sal0[2] += p3
  if a2==6:
      if a1==11:
          score -= p3
          sal0[2] += p3
      if a3==11:
          score -= p3
          sal0[2] += p3
  if a2==7:
      if a1==2:
          score -= p3
          sal0[2] += p3
      if a3==2:
          score -= p3
          sal0[2] += p3
  if a2==8:
      if a1==1:
          score -= p3
          sal0[2] += p3
      if a3==1:
          score -= p3
          sal0[2] += p3
  if a2==9:
      if a1==4:
          score -= p3
          sal0[2] += p3
      if a3==4:
          score -= p3
          sal0[2] += p3
  if a2==10:
      if a1==3:
          score -= p3
          sal0[2] += p3
      if a3==3:
          score -= p3
          sal0[2] += p3
  if a2==11:
      if a1==6:
          score -= p3
          sal0[2] += p3
      if a3==6:
          score -= p3
          sal0[2] += p3
  if a2==12:
      if a1==5:
          score -= p3
          sal0[2] += p3
      if a3==5:
          score -= p3
          sal0[2] += p3
  if a3==1:
      if a1==8:
          score -= p3
          sal0[2] += p3
      if a2==8:
          score -= p3
          sal0[2] += p3
  if a3==2:
      if a1==7:
          score -= p3
          sal0[2] += p3
      if a2==7:
          score -= p3
          sal0[2] += p3
  if a3==3:
      if a1==10:
          score -= p3
          sal0[2] += p3
      if a2==10:
          score -= p3
          sal0[2] += p3
  if a3==4:
      if a1==9:
          score -= p3
          sal0[2] += p3
      if a2==9:
          score -= p3
          sal0[2] += p3
  if a3==5:
      if a1==12:
          score -= p3
          sal0[2] += p3
      if a2==12:
          score -= p3
          sal0[2] += p3
  if a3==6:
      if a1==11:
          score -= p3
          sal0[2] += p3
      if  a2==11:
          score -=p3
          sal0[2] += p3
  if a3==7:
      if a1==2:
          score -= p3
          sal0[2] += p3
      if a2==2:
          score -= p3
          sal0[2] += p3
  if a3==8:
      if a1==1:
          score -= p3
          sal0[2] += p3
      if a2==1:
          score -= p3
          sal0[2] += p3
  if a3==9:
      if a1==4:
          score -= p3
          sal0[2] += p3
      if a2==4:
          score -= p3
          sal0[2] += p3
  if a3==10:
      if a1==3:
          score -= p3
          sal0[2] += p3
      if a2==3:
          score -= p3
          sal0[2] += p3
  if a3==11:
      if a1==6:
          score -= p3
          sal0[2] += p3
      if a2==6:
          score -= p3
          sal0[2] += p3
  if a3==12:
      if a1==5:
          score -= p3
          sal0[2] += p3
      if a2==5:
          score -= p3
          sal0[2] += p3
  if b1==1:
      if b2==8:
          score -= p3
          sal1[2] += p3
      if b3==8:
          score -= p3
          sal1[2] += p3
  if b1==2:
      if b2==7:
          score -= p3
          sal1[2] += p3
      if b3==7:
          score -= p3
          sal1[2] += p3
  if b1==3:
      if b2==10:
          score -= p3
          sal1[2] += p3
      if b3==10:
          score -= p3
          sal1[2] += p3
  if b1==4:
      if b2==9:
          score -= p3
          sal1[2] += p3
      if b3==9:
          score -= p3
          sal1[2] += p3
  if b1==5:
      if b2==12:
          score -= p3
          sal1[2] += p3
      if b3==12:
          score -= p3
          sal1[2] += p3
  if b1==6:
      if b2==11:
          score -= p3
          sal1[2] += p3
      if b3==11:
          score -= p3
          sal1[2] += p3
  if b1==7:
      if b2==2:
          score -= p3
          sal1[2] += p3
      if b3==2:
          score -= p3
          sal1[2] += p3
  if b1==8:
      if b2==1:
          score -= p3
          sal1[2] += p3
      if b3==1:
          score -= p3
          sal1[2] += p3
  if b1==9:
      if b2==4:
          score -= p3
          sal1[2] += p3
      if b3==4:
          score -= p3
          sal1[2] += p3
  if b1==10:
      if b2==3:
          score -= p3
          sal1[2] += p3
      if b3==3:
          score -= p3
          sal1[2] += p3
  if b1==11:
      if b2==6:
          score -= p3
          sal1[2] += p3
      if b3==6:
          score -= p3
          sal1[2] += p3
  if b1==12:
      if b2==5:
          score -= p3
          sal1[2] += p3
      if b3==5:
          score -= p3
          sal1[2] += p3
  if b2==1:
      if b1==8:
          score -= p3
          sal1[2] += p3
      if b3==8:
          score -= p3
          sal1[2] += p3
  if b2==2:
      if b1==7:
          score -= p3
          sal1[2] += p3
      if b3==7:
          score -= p3
          sal1[2] += p3
  if b2==3:
      if b1==10:
          score -= p3
          sal1[2] += p3
      if b3==10:
          score -= p3
          sal1[2] += p3
  if b2==4:
      if b1==9:
          score -= p3
          sal1[2] += p3
      if b3==9:
          score -= p3
          sal1[2] += p3
  if b2==5:
      if b1==12:
          score -= p3
          sal1[2] += p3
      if b3==12:
          score -= p3
          sal1[2] += p3
  if b2==6:
      if b1==11:
          score -= p3
          sal1[2] += p3
      if b3==11:
          score -= p3
          sal1[2] += p3
  if b2==7:
      if b1==2:
          score -= p3
          sal1[2] += p3
      if b3==2:
          score -= p3
          sal1[2] += p3
  if b2==8:
      if b1==1:
          score -= p3
          sal1[2] += p3
      if b3==1:
          score -= p3
          sal1[2] += p3
  if b2==9:
      if b1==4:
          score -= p3
          sal1[2] += p3
      if b3==4:
          score -= p3
          sal1[2] += p3
  if b2==10:
      if b1==3:
          score -= p3
          sal1[2] += p3
      if b3==3:
          score -= p3
          sal1[2] += p3
  if b2==11:
      if b1==6:
          score -= p3
          sal1[2] += p3
      if b3==6:
          score -= p3
          sal1[2] += p3
  if b2==12:
      if b1==5:
          score -= p3
          sal1[2] += p3
      if b3==5:
          score -= p3
          sal1[2] += p3
  if b3==1:
      if b1==8:
          score -= p3
          sal1[2] += p3
      if b2==8:
          score -= p3
          sal1[2] += p3
  if b3==2:
      if b1==7:
          score -= p3
          sal1[2] += p3
      if b2==7:
          score -= p3
          sal1[2] += p3
  if b3==3:
      if b1==10:
          score -= p3
          sal1[2] += p3
      if b2==10:
          score -= p3
          sal1[2] += p3
  if b3==4:
      if b1==9:
          score -= p3
          sal1[2] += p3
      if b2==9:
          score -= p3
          sal1[2] += p3
  if b3==5:
      if b1==12:
          score -= p3
          sal1[2] += p3
      if b2==12:
          score -= p3
          sal1[2] += p3
  if b3==6:
      if b1==11:
          score -= p3
          sal1[2] += p3
      if b2==11:
          score -=p3
          sal1[2] += p3
  if b3==7:
      if b1==2:
          score -= p3
          sal1[2] += p3
      if b2==2:
          score -= p3
          sal1[2] += p3
  if b3==8:
      if b1==1:
          score -= p3
          sal1[2] += p3
      if b2==1:
          score -= p3
          sal1[2] += p3
  if b3==9:
      if b1==4:
          score -= p3
          sal1[2] += p3
      if b2==4:
          score -= p3
          sal1[2] += p3
  if b3==10:
      if b1==3:
          score -= p3
          sal1[2] += p3
      if b2==3:
          score -= p3
          sal1[2] += p3
  if b3==11:
      if b1==6:
          score -= p3
          sal1[2] += p3
      if b2==6:
          score -= p3
          sal1[2] += p3
  if b3==12:
      if b1==5:
          score -= p3
          sal1[2] += p3
      if b2==5:
          score -= p3
          sal1[2] += p3

  t = abs(a3-a2)
  if t == 6:
      score -= p41
      sal0[3] += p41
  t = abs(a3-a1)
  if t == 6:
      score -= p42
      sal0[3] += p42
  t = abs(a1-a2)
  if t == 6:
    score -= p43
    sal0[3] += p43
  t = abs(b3-b2)
  if t == 6:
      score -= p41
      sal1[3] += p41
  t = abs(b3-b1)
  if t == 6:
      score -= p42
      sal1[3] += p42
  t = abs(b1-b2)
  if t == 6:
    score -= p43
    sal1[3] += p43


  if a3==1:
      if a1==4 or a2==4:
          score -= p5
          sal0[4] += p5
  if a3==2:
      if a1==11 or a2==11:
          score -= p5
          sal0[4] += p5
  if a3==3:
      if a1==6 or a2==6:
          score -= p5
          sal0[4] += p5
  if a3==4:
      if a1==1 or a2==1:
          score -= p5
          sal0[4] += p5
  if a3==6:
      if a1==9 or a2==9:
          score -= p5
          sal0[4] += p5
  if a3==8:
      if a1==11 or a2==11:
          score -= p5
          sal0[4] += p5
  if a3==9:
      if a1==6 or a2==6:
          score -= p5
          sal0[4] += p5
  if a3==11:
      if a1==8 or a2==8:
          score -= p5
          sal0[4] += p5
  if b3==1:
      if b1==4 or b2==4:
          score -= p5
          sal1[4] += p5
  if b3==2:
      if b1==11 or b2==11:
          score -= p5
          sal1[4] += p5
  if b3==3:
      if b1==6 or b2==6:
          score -= p5
          sal1[4] += p5
  if b3==4:
      if b1==1 or b2==1:
          score -= p5
          sal1[4] += p5
  if b3==6:
      if b1==9 or b2==9:
          score -= p5
          sal1[4] += p5
  if b3==8:
      if b1==11 or b2==11:
          score -= p5
          sal1[4] += p5
  if b3==9:
      if b1==6 or b2==6:
          score -= p5
          sal1[4] += p5
  if b3==11:
      if b1==8 or b2==8:
          score -= p5
          sal1[4] += p5

  if (a1==1 and a2==4) or (a1==2 and a2==11) or (a1==3 and a2==6) or (a1==6 and a2==9) or (a1==8 and a2==11):
      score -= p5
      sal0[4] += p5
  if (a1==4 and a2==1) or (a1==11 and a2==2) or (a1==6 and a2==3) or (a1==9 and a2==6) or (a1==11 and a2==8):
      score -= p5
      sal0[4] += p5
  if (b1==1 and b2==4) or (b1==2 and b2==11) or (b1==3 and b2==6) or (b1==6 and b2==9) or (b1==8 and b2==11):
      score -= p5
      sal1[4] += p5
  if (b1==4 and b2==1) or (b1==11 and b2==2) or (b1==6 and b2==3) or (b1==9 and b2==6) or (b1==11 and b2==8):
      score -= p5
      sal1[4] += p5

  if a3==7:
      if a1==4 or a2==4:
          score -= p6
          sal0[5] += p6
  if a3==5:
      if a1==2 or a2==2:
          score -= p6
          sal0[5] += p6
  if a3==4:
      if a1==7 or a2==7:
          score -= p6
          sal0[5] += p6
  if a3==2:
      if a1==5 or a2==5:
          score -= p6
          sal0[5] += p6
  if b3==7:
      if b1==4 or b2==4:
          score -= p6
          sal1[5] += p6
  if b3==5:
      if b1==2 or b2==2:
          score -= p6
          sal1[5] += p6
  if b3==4:
      if b1==7 or b2==7:
          score -= p6
          sal1[5] += p6
  if b3==2:
      if b1==5 or b2==5:
          score -= p6
          sal1[5] += p6
  if (a1==7 and a2==4) or (a1==5 and a2==2) or (a1==4 and a2==7) or (a1==2 and a2==5):
    score -= p6
    sal0[5] += p6
  if (b1==7 and b2==4) or (b1==5 and b2==2) or (b1==4 and b2==7) or (b1==2 and b2==5):
      score -= p6
      sal1[5] += p6


  if (token0[4]==5 and a3==5) or (token0[4]==4 and a3==2) or (token0[4]==3 and a3==11) or (token0[4]==2 and a3==8) or (token0[4]==1 and a3==5) or (token0[4]==10 and a3==2) or (token0[4]==9 and a3==11):
    if gender0==1:
      score -= p7
      sal0[6] += p7
    else:
      score -= p71
      sal0[6] += p71

  if (token1[4]==5 and b3==5) or (token1[4]==4 and b3==2) or (token1[4]==3 and b3==11) or (token1[4]==2 and b3==8) or (token1[4]==1 and b3==5) or (token1[4]==10 and b3==2) or (token1[4]==9 and b3==11):
    if gender1==1:
      score -= p7
      sal1[6] += p7
    else:
      score -= p71
      sal1[6] += p71

  if ( gender0 != 1 ) and ( ( token0[4] == 9 and a3 == 5 ) or ( token0[4] == 5 and a3 == 11 ) or ( token0[4] == 7 and a3 == 5 ) or ( token0[4] == 7 and a3 == 11 ) ):
    score -= p81
    sal0[7] += p81

  if ( gender0 !=1 ) and ( ( token0[2] == 9 and a2 == 5 ) or ( token0[2] == 5 and a2 == 11 ) or ( token0[2] == 7 and a2 == 5 ) or ( token0[4] == 7 and a2 == 11 )  ):
    score -= p82
    sal0[7] += p82

  if ( gender0 !=1 ) and ( ( token0[0] == 9 and a1 == 5 ) or ( token0[0] == 5 and a1 == 11 ) or ( token0[0] == 7 and a1 == 5 ) or ( token0[0] == 7 and a1 == 11 ) ) :
    score -= p83
    sal0[7] += p83

  if ( gender1 != 1 ) and ( ( token1[4] == 9 and b3 == 5 ) or ( token1[4] == 5 and b3 == 11 ) or ( token1[4] == 7 and b3 == 5 ) or ( token1[4] == 7 and b3 == 11 ) ) :
      score -= p81
      sal1[7] += p81

  if ( gender1 !=1 ) and ( ( token1[2] == 9 and b2 == 5 ) or ( token1[2] == 5 and b2 == 11 ) or ( token1[2] == 7 and b2 ==5 ) or ( token1[2] == 7 and b2 == 11 ) ) :
      score -= p82
      sal1[7] += p82

  if ( gender1 !=1 ) and ( ( token1[0] == 9 and b1 == 5 ) or ( token1[0] == 5 and b1 == 11 ) or ( token1[0] == 7 and b1 == 5 ) or ( token1[0] == 7 and b1 == 11 ) ) :
      score -= p83
      sal1[7] += p83

  return score, sal0, sal1


def getCalendar(year, month, day, hour, min):
  y = int(year)
  m = int(month)
  d = int(day)
  h = int(hour)
  minute = int(min)

  n1 = y*100 + m
  n2 = d*10000 + h*100 + minute

  try:
    data = np.loadtxt(CALENDAR_FILE, delimiter=',', skiprows=1, encoding='euc-kr')
  except IOError as e:
      print(f"Error loading calendar file: {e}")
      print(f"Ensure '{CALENDAR_FILE}' is in the correct path.")
      return None # 오류 처리

  b_y = data[y-1904][1]
  d_y = data[y-1904][3]
  f_y = data[y-1904][5]
  h_y = data[y-1904][7]
  j_y = data[y-1904][9]
  l_y = data[y-1904][11]
  n_y = data[y-1904][13]
  p_y = data[y-1904][15]
  r_y = data[y-1904][17]
  t_y = data[y-1904][19]
  v_y = data[y-1904][21]
  x_y = data[y-1904][23]
  c_y = data[y-1904][2]
  e_y = data[y-1904][4]
  g_y = data[y-1904][6]
  i_y = data[y-1904][8]
  k_y = data[y-1904][10]
  m_y = data[y-1904][12]
  o_y = data[y-1904][14]
  q_y = data[y-1904][16]
  s_y = data[y-1904][18]
  u_y = data[y-1904][20]
  w_y = data[y-1904][22]
  y_y = data[y-1904][24]

  ry = (y-1904)%10
  ys = ry+1
  if n1<d_y:
      ys -= 1
  if n1==d_y and n2<e_y:
      ys -= 1
  if ys == 0:
      ys=10

  ry2 = (y-1990)%12
  if ry2==0:
      yg=3
  if ry2==1:
      yg=4
  if ry2==2:
      yg=5
  if ry2==3:
      yg=6
  if ry2==4:
      yg=7
  if ry2==5:
      yg=8
  if ry2==6:
      yg=9
  if ry2==7:
      yg=10
  if ry2==8:
      yg=11
  if ry2==9:
      yg=12
  if ry2==10:
      yg=1
  if ry2==11:
      yg=2
  if n1<d_y:
      yg -= 1
  if n1==d_y and n2<e_y:
      yg -= 1
  if yg==0:
      yg=12

  if n1==b_y:
      if n2<c_y:
          mg=11
      else:
          mg=12
  if n1==d_y:
      if n2<e_y:
          mg=12
      else:
          mg=1
  if n1==f_y:
      if n2<g_y:
          mg=1
      else:
          mg=2
  if n1==h_y:
      if n2<i_y:
          mg=2
      else:
          mg=3
  if n1==j_y:
      if n2<k_y:
          mg=3
      else:
          mg=4
  if n1==l_y:
      if n2<m_y:
          mg=4
      else:
          mg=5
  if n1==n_y:
      if n2<o_y:
          mg=5
      else:
          mg=6
  if n1==p_y:
      if n2<q_y:
          mg=6
      else:
          mg=7
  if n1==r_y:
      if n2<s_y:
          mg=7
      else:
          mg=8
  if n1==t_y:
      if n2<u_y:
          mg=8
      else:
          mg=9
  if n1==v_y:
      if n2<w_y:
          mg=9
      else:
          mg=10
  if n1==x_y:
      if n2<y_y:
          mg=10
      else:
          mg=11

  if ys==1 or ys==6:
      ms = 3+(mg-1)
  if ys==2 or ys==7:
      ms = 5+(mg-1)
  if ys==3 or ys==8:
      ms = 7+(mg-1)
  if ys==4 or ys==9:
      ms = 9+(mg-1)
  if ys==5 or ys==10:
      ms = 1+(mg-1)
  if ms>10:
      ms=ms-10

  yg = yg+2
  if yg==13:
      yg=1
  if yg==14:
      yg=2
  mg = mg+2
  if mg==13:
      mg=1
  if mg==14:
      mg=2

  return ys, yg, ms, mg

def calculate_sky(i,j):
  t0 = np.eye(10)[np.array(i-1).reshape(-1)]
  t0 = t0.flatten()
  t1 = np.eye(10)[np.array(j-1).reshape(-1)]
  t1 = t1.flatten()
  s = np.concatenate((t0,t1))
  s = s.reshape(1,20)
  pred = model0.predict(s)
  return pred

def calculate_earth(i,j):
  t0 = np.eye(12)[np.array(i-1).reshape(-1)]
  t0 = t0.flatten()
  t1 = np.eye(12)[np.array(j-1).reshape(-1)]
  t1 = t1.flatten()
  s = np.concatenate((t0,t1))
  s = s.reshape(1,24)
  pred = model1.predict(s)
  return pred

def get_saju_data(year, month, day):
    """
    웹에서 받은 년, 월, 일로 사주 데이터를 계산합니다. (JSON 캐시 기능 추가)
    """
    # 1. 캐시 파일명 및 경로 생성
    month_str = str(month).zfill(2)
    day_str = str(day).zfill(2)
    filename = f"{year}-{month_str}-{day_str}.json"
    cache_filepath = os.path.join(SAJU_CACHE_DIR, filename)

    # 2. 캐시 확인 (파일이 존재하면 파일 내용 반환)
    try:
        if os.path.exists(cache_filepath):
            print(f"--- [Cache HIT] {filename} 에서 로드 ---")
            with open(cache_filepath, 'r', encoding='utf-8') as f:
                saju = json.load(f)
            return saju
    except Exception as e:
        print(f"캐시 파일({filename}) 읽기 오류 (API 새로 호출): {e}")

    # 3. 캐시 없음 (API 호출)
    print(f"--- [Cache MISS] {filename} API에서 새로 호출 ---")
    params = 'solYear='+str(year)+'&solMonth='+month_str+'&solDay='+day_str+'&ServiceKey='
    open_url = 'http://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService/getLunCalInfo?'+params+open_api_key

    try:
        response = requests.get(open_url)
        response.raise_for_status() # HTTP 오류가 있으면 예외 발생
        root = ET.fromstring(response.text)
        
        # 'lunIljin' (일진) 데이터를 가져옵니다.
        day0_chars = root.find('.//item/lunIljin').text
        if day0_chars is None:
            raise Exception("API 응답에서 'lunIljin'를 찾을 수 없습니다.")

        # getCalendar 호출 (원본 코드와 동일하게 12시 0분 기준)
        calendar_data = getCalendar(year, month, day, 12, 0)
        if calendar_data is None:
            raise Exception("getCalendar 함수 실행 중 오류가 발생했습니다.")
            
        ys, ye, ms, me = calendar_data
        
        saju = []
        saju.append(ys)
        saju.append(ye)
        saju.append(ms)
        saju.append(me)
        saju.append(sky[day0_chars[0]])
        saju.append(earth[day0_chars[1]])
        
        # 4. API 결과를 캐시 파일에 저장
        try:
            with open(cache_filepath, 'w', encoding='utf-8') as f:
                json.dump(saju, f, ensure_ascii=False, indent=2)
            print(f"--- [Cache SAVE] {filename} 저장 완료 ---")
        except Exception as e:
            # 캐시 저장을 실패해도 프로그램은 중단되지 않음
            print(f"캐시 파일({filename}) 쓰기 오류: {e}") 
        
        return saju

    except requests.exceptions.RequestException as e:
        print(f"API 요청 오류: {e}")
        raise Exception(f"API 요청에 실패했습니다: {e}")
    except ET.ParseError as e:
        print(f"XML 파싱 오류: {e}")
        raise Exception(f"API 응답 파싱에 실패했습니다: {e}")
    except Exception as e:
        print(f"사주 데이터 생성 오류: {e}")
        raise e

def format_sal_analysis(sal_array):
  """
  sal 배열을 받아 분석 텍스트 리스트를 반환합니다. (print_sal() 대체)
  """
  ss =["열정 에너지 예술 중독", "예민 직감 영적 불안", "감정기복 갈등 오해 고독", "강함 용감 충동 변화", "책임감 의리 완벽 자존심 인내", "충돌 자유 고집", "카리스마 승부욕 용감 외로움", "의지 솔직 직설 개성 고집 독립심"]
  analysis = []
  for i, v in enumerate(sal_array):
    if v > 0:
      analysis.append(ss[i])
  
  if not analysis:
    return ["무난"]
  
  return analysis

# --- Flask 라우트 정의 ---

@app.route('/')
def index():
  """
  메인 페이지 (index.html)를 렌더링합니다.
  """
  return render_template('index.html')

@app.route('/personal')
def personal_analysis():
  """
  개인 분석 페이지 (index2.html)를 렌더링합니다.
  """
  return render_template('index2.html')

@app.route('/calculate', methods=['POST'])
def handle_calculation():
  """
  AJAX 요청을 받아 궁합 점수를 계산하고 JSON으로 반환합니다.
  """
  try:
    data = request.json
    
    # 데이터 파싱
    p0_year = data['p0_year']
    p0_month = data['p0_month']
    p0_day = data['p0_day']
    p0_gender = int(data['p0_gender'])
    
    p1_year = data['p1_year']
    p1_month = data['p1_month']
    p1_day = data['p1_day']
    p1_gender = int(data['p1_gender'])

    # 원본 스크립트의 유효성 검사 (2000~2021년)
    if not (1999 < int(p0_year) < 2022 and 1999 < int(p1_year) < 2022):
        return jsonify({'error': '연도는 2000년에서 2021년 사이여야 합니다.'}), 400

    # 사주 데이터 계산
    person0 = get_saju_data(p0_year, p0_month, p0_day)
    person1 = get_saju_data(p1_year, p1_month, p1_day)

    # 점수 계산 로직 (원본 __main__ 부분)
    ys = calculate_sky(person0[0], person1[0])
    ms = calculate_sky(person0[2], person1[2])
    ds = calculate_sky(person0[4], person1[4])
    ye = calculate_earth(person0[1], person1[1])
    me = calculate_earth(person0[3], person1[3])
    de = calculate_earth(person0[5], person1[5])

    score = (0.6*ys) + (4.5*ds) + (1.0*ye) + (1.5*me) + (4.5*de)
    org_score = score.item()
    
    score_final, sal0, sal1 = calculate(person0, person1, p0_gender, p1_gender, score)
    
    if sum(sal0)>0 and sum(sal1)>0:
        stress = 0.5*(106-org_score)+(org_score-score_final)*1.8
    else:
        stress = 0.5*(106-org_score)+(org_score-score_final)

    # 결과 포맷팅
    sal0_analysis = format_sal_analysis(sal0)
    sal1_analysis = format_sal_analysis(sal1)
    
    warning = '위험' if (score_final <= 35 and stress >= 40) else '양호'

    # JSON 응답 반환
    return jsonify({
        'original_score': org_score,
        'final_score': score_final,
        'stress_score': stress.item() if isinstance(stress, np.ndarray) else stress,
        'person0_analysis': sal0_analysis,
        'person1_analysis': sal1_analysis,
        'warning': warning
    })

  except Exception as e:
    print(f"Error in /calculate: {e}")
    return jsonify({'error': str(e)}), 500


# --- 앱 실행 ---
if __name__ == "__main__":
  app.run(debug=True)