from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from starlette.middleware.cors import CORSMiddleware
from typing import List
import crud
from models import Habit, Badge, DeviceToken
from datetime import date, timedelta
from database import SessionLocal, engine
import models, schemas, auth
from auth import get_password_hash
from sqlalchemy import DateTime
from sqlalchemy import func
import httpx
from fastapi import Body
from apscheduler.schedulers.background import BackgroundScheduler
import requests



models.Base.metadata.create_all(bind=engine)
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or list your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = auth.authenticate_user(db, user.email, user.password)
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    return {"message": "Login successful", "user_id": db_user.id}

@app.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully", "user_id": new_user.id}
#HABITS
@app.get("/habits", response_model=List[schemas.HabitOut])
def list_habits(user_id: int, db: Session = Depends(get_db)):
    # TEMP: using user_id directly (in real apps use JWT)
    return crud.get_habits(db, user_id)

@app.post("/habits", response_model=schemas.HabitOut)
def create_habit(habit: schemas.HabitCreate, user_id: int, db: Session = Depends(get_db)):
    return crud.create_habit(db, user_id, habit)

@app.patch("/habits/{habit_id}", response_model=schemas.HabitOut)
def update_habit(habit_id: int, habit: schemas.HabitUpdate, user_id: int, db: Session = Depends(get_db)):
    db_habit = crud.update_habit(db, habit_id, habit, user_id)
    if not db_habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    return db_habit

@app.delete("/habits/{habit_id}")
def delete_habit(habit_id: int, user_id: int, db: Session = Depends(get_db)):
    success = crud.delete_habit(db, habit_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Habit not found")
    return {"ok": True}
#FRIENDS
@app.post("/friends/request", response_model=schemas.FriendOut)
def friend_request(payload: schemas.FriendRequestCreate, user_id: int, db: Session = Depends(get_db)):
    # user_id passed as query param (TEMP) — replace with JWT in prod
    fr, err = crud.send_friend_request(db, user_id, payload.target_email)
    if fr is None and err:
        raise HTTPException(status_code=400, detail=err)
    if fr is None:
        raise HTTPException(status_code=404, detail="Target not found")
    return fr

@app.post("/friends/accept/{friendship_id}", response_model=schemas.FriendOut)
def accept_request(friendship_id: int, user_id: int, db: Session = Depends(get_db)):
    fr = crud.accept_friend_request(db, user_id, friendship_id)
    if not fr:
        raise HTTPException(status_code=404, detail="Friend request not found or unauthorized")
    return fr

@app.get("/friends/list", response_model=List[schemas.FriendOut])
def friends_list(user_id: int, db: Session = Depends(get_db)):
    frs = crud.list_friends(db, user_id)
    return frs

@app.get("/friends/requests", response_model=List[schemas.FriendOut])
def friends_requests(user_id: int, db: Session = Depends(get_db)):
    reqs = crud.list_friend_requests(db, user_id)
    return reqs

# MESSAGES
@app.get("/messages", response_model=List[schemas.MessageOut])
def get_messages(user_id: int, friend_id: int, db: Session = Depends(get_db)):
    msgs = crud.get_messages_between(db, user_id, friend_id)
    return msgs

@app.post("/messages", response_model=schemas.MessageOut)
def send_message(payload: schemas.MessageCreate, user_id: int, db: Session = Depends(get_db)):
    # payload.receiver_id is the friend id
    m = crud.create_message(db, user_id, payload.receiver_id, payload.content)
    return m

@app.post("/friends/request", response_model=schemas.FriendOut)
def friend_request(payload: schemas.FriendRequestCreate, user_id: int, db: Session = Depends(get_db)):
    print("Friend request:", user_id, payload.target_email)
    fr, err = crud.send_friend_request(db, user_id, payload.target_email)
    if fr is None and err:
        raise HTTPException(status_code=400, detail=err)
    if fr is None:
        raise HTTPException(status_code=404, detail="Target not found")
    return fr

#PROFILE


@app.get("/users/{user_id}/stats")
def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    today = date.today()
    weekly = []

    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        count_done = db.query(Habit).filter(
            Habit.user_id == user_id,
            func.date(Habit.last_completed) == day
        ).count()
        weekly.append(count_done)

    habits = db.query(Habit).filter(Habit.user_id == user_id).all()
    current_streak = max([h.streak_count for h in habits], default=0)
    longest_streak = max([h.streak_count for h in habits], default=0)

    return {
        "weekly": weekly,
        "current_streak": current_streak,
        "longest_streak": longest_streak
    }
@app.get("/users/{user_id}/badges")
def get_user_badges(user_id: int, db: Session = Depends(get_db)):
    badges = db.query(Badge).filter(Badge.user_id == user_id).all()
    return [{"badge_type": b.badge_type, "habit_id": b.habit_id, "earned_at": b.earned_at} for b in badges]

@app.post("/devices/register")
def register_device(user_id: int, token: str, db: Session = Depends(get_db)):
    existing = db.query(DeviceToken).filter(DeviceToken.token == token).first()
    if not existing:
        db_token = DeviceToken(user_id=user_id, token=token)
        db.add(db_token)
        db.commit()
    return {"ok": True}


EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

@app.post("/notify")
def send_notification(user_id: int = Body(...), title: str = Body(...), body: str = Body(...), db: Session = Depends(get_db)):
    # Get user device token from DB
    device = db.query(DeviceToken).filter(DeviceToken.user_id == user_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="No device token for user")

    # Send notification via Expo
    message = {
        "to": device.token,
        "sound": "default",
        "title": title,
        "body": body,
    }

    with httpx.Client() as client:
        response = client.post(EXPO_PUSH_URL, json=message)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Expo push failed")
        return {"ok": True, "expo_response": response.json()}

def send_daily_reminders():
    db = SessionLocal()
    try:
        # Get all users
        users = db.query(models.User).all()
        for user in users:
            # Check if user has any habit not done today
            habits = db.query(models.Habit).filter(models.Habit.user_id == user.id).all()
            needs_reminder = any(
                (h.last_completed is None or h.last_completed.date() != date.today())
                for h in habits
            )
            if needs_reminder:
                # Call your own notify endpoint
                requests.post("http://localhost:8000/notify", json={
                    "user_id": user.id,
                    "title": "Habit Reminder",
                    "body": "Don't forget to complete your habits today!"
                })
    finally:
        db.close()

scheduler = BackgroundScheduler()
scheduler.add_job(send_daily_reminders, 'cron', hour=9)  # Runs every day at 9 AM
scheduler.start()

 # TEMP: run once at startup for testing

@app.get("/users/{user_id}", response_model=schemas.UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user