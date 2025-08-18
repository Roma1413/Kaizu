from sqlalchemy.orm import Session
import models, schemas
from datetime import datetime, timedelta, date
from typing import List, Optional

def get_habits(db: Session, user_id: int):
    return db.query(models.Habit).filter(models.Habit.user_id == user_id).all()

def create_habit(db: Session, user_id: int, habit: schemas.HabitCreate):
    db_habit = models.Habit(
        name=habit.name,
        done=habit.done or False,
        user_id=user_id
    )
    db.add(db_habit)
    db.commit()
    db.refresh(db_habit)
    return db_habit

def update_habit(db: Session, habit_id: int, habit: schemas.HabitUpdate, user_id: int):
    db_habit = db.query(models.Habit).filter(
        models.Habit.id == habit_id,
        models.Habit.user_id == user_id
    ).first()
    if not db_habit:
        return None

    # Update name if provided
    if habit.name is not None:
        db_habit.name = habit.name

    # If marking habit as done
    if habit.done is not None:
        db_habit.done = habit.done
        if habit.done:
            today = date.today()
            # Increment streak if last completed yesterday or before
            if not db_habit.last_completed or db_habit.last_completed.date() < today:
                # If last_completed is yesterday → increment streak
                if db_habit.last_completed and db_habit.last_completed.date() == today - timedelta(days=1):
                    db_habit.streak_count += 1
                else:
                    # Otherwise reset streak to 1
                    db_habit.streak_count = 1
                db_habit.last_completed = datetime.utcnow()

    db_habit.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_habit)
    return db_habit

def delete_habit(db: Session, habit_id: int, user_id: int):
    db_habit = db.query(models.Habit).filter(
        models.Habit.id == habit_id,
        models.Habit.user_id == user_id
    ).first()
    if not db_habit:
        return False
    db.delete(db_habit)
    db.commit()
    return True

# --- FRIENDS ---
def send_friend_request(db: Session, requester_id: int, target_email: str):
    target = db.query(models.User).filter(models.User.email == target_email).first()
    if not target:
        return None, "Target user not found"
    if target.id == requester_id:
        return None, "Cannot send request to yourself"

    existing = db.query(models.Friendship).filter(
        ((models.Friendship.user_id == requester_id) & (models.Friendship.friend_id == target.id)) |
        ((models.Friendship.user_id == target.id) & (models.Friendship.friend_id == requester_id))
    ).first()
    if existing:
        return existing, "Already exists"

    fr = models.Friendship(user_id=requester_id, friend_id=target.id, status="pending")
    db.add(fr)
    db.commit()
    db.refresh(fr)
    return fr, None

def accept_friend_request(db: Session, requester_id: int, friendship_id: int):
    fr = db.query(models.Friendship).filter(models.Friendship.id == friendship_id).first()
    if not fr:
        return None
    if fr.friend_id != requester_id:
        return None
    fr.status = "accepted"
    db.commit()
    return fr

def list_friends(db: Session, user_id: int) -> List[models.Friendship]:
    return db.query(models.Friendship).filter(
        ((models.Friendship.user_id == user_id) | (models.Friendship.friend_id == user_id)) &
        (models.Friendship.status == "accepted")
    ).all()

def list_friend_requests(db: Session, user_id: int) -> List[models.Friendship]:
    return db.query(models.Friendship).filter(
        models.Friendship.friend_id == user_id,
        models.Friendship.status == "pending"
    ).all()

# --- MESSAGES ---
def create_message(db: Session, sender_id: int, receiver_id: int, content: str) -> models.Message:
    m = models.Message(sender_id=sender_id, receiver_id=receiver_id, content=content)
    db.add(m)
    db.commit()
    db.refresh(m)
    return m

def get_messages_between(db: Session, user_id: int, friend_id: int, since_id: Optional[int] = None):
    q = db.query(models.Message).filter(
        ((models.Message.sender_id == user_id) & (models.Message.receiver_id == friend_id)) |
        ((models.Message.sender_id == friend_id) & (models.Message.receiver_id == user_id))
    ).order_by(models.Message.created_at.asc())
    if since_id:
        q = q.filter(models.Message.id > since_id)
    return q.all()