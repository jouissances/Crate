from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from typing import List, Optional
import json

from app.models import User, Station, Track, UserRole, AuthProvider
from app.auth import (
    UserCreate, UserLogin, Token, 
    get_password_hash, authenticate_user, create_access_token, 
    get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES, jwt, SECRET_KEY, ALGORITHM
)
from app.db import db
from app.spotify import spotify_service
from app.ws import manager

app = FastAPI(title="Crate API")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.post("/api/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    if db.get_user_by_email(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    password_hash = get_password_hash(user_data.password)
    user = db.create_user({
        "email": user_data.email,
        "username": user_data.username,
        "display_name": user_data.display_name,
        "password_hash": password_hash,
        "role": user_data.role,
        "auth_provider": AuthProvider.EMAIL
    })
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username,
        "role": user.role
    }

@app.post("/api/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username,
        "role": user.role
    }

@app.get("/api/auth/spotify")
async def spotify_auth():
    auth_url = spotify_service.get_auth_url()
    return {"auth_url": auth_url}

@app.get("/api/auth/spotify/callback")
async def spotify_callback(code: str):
    token_info = spotify_service.get_access_token(code)
    user_profile = spotify_service.get_user_profile(token_info["access_token"])
    
    user = db.get_user_by_email(user_profile["email"])
    if not user:
        user = db.create_user({
            "email": user_profile["email"],
            "username": user_profile["id"],
            "display_name": user_profile["display_name"],
            "auth_provider": AuthProvider.SPOTIFY,
            "spotify_connected": True,
            "spotify_id": user_profile["id"],
            "role": UserRole.LISTENER
        })
    else:
        user.spotify_connected = True
        user.spotify_id = user_profile["id"]
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username,
        "role": user.role
    }

@app.get("/api/users/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@app.post("/api/stations")
async def create_station(
    station_data: dict,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.DJ:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only DJs can create stations"
        )
    
    station = db.create_station({
        "name": station_data["name"],
        "description": station_data.get("description"),
        "dj_id": current_user.id,
        "mood": station_data.get("mood"),
        "currently_reading": station_data.get("currently_reading"),
        "quote": station_data.get("quote")
    })
    
    return station

@app.get("/api/stations")
async def get_all_stations():
    return db.get_all_stations()

@app.get("/api/stations/{station_id}")
async def get_station(station_id: str):
    station = db.get_station(station_id)
    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Station not found"
        )
    return station

@app.get("/api/stations/dj/{dj_id}")
async def get_dj_stations(dj_id: str):
    return db.get_stations_by_dj(dj_id)

@app.post("/api/stations/{station_id}/go-live")
async def start_live_session(
    station_id: str,
    current_user: User = Depends(get_current_user)
):
    station = db.get_station(station_id)
    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Station not found"
        )
        
    if station.dj_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the station DJ can go live"
        )
        
    live_session = db.create_live_session({
        "station_id": station_id,
        "dj_id": current_user.id
    })
    
    return live_session

@app.post("/api/stations/{station_id}/end-live")
async def end_live_session(
    station_id: str,
    current_user: User = Depends(get_current_user)
):
    station = db.get_station(station_id)
    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Station not found"
        )
        
    if station.dj_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the station DJ can end the live session"
        )
        
    session = db.end_live_session(station_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active live session found"
        )
        
    return session

@app.get("/api/live-sessions")
async def get_live_sessions():
    return db.get_active_live_sessions()

@app.get("/api/spotify/search")
async def search_tracks(query: str, limit: int = 10):
    tracks = spotify_service.search_tracks(query, limit)
    return tracks

@app.get("/api/spotify/recommendations")
async def get_recommendations(seed_tracks: str, limit: int = 10):
    seed_track_list = seed_tracks.split(",")
    tracks = spotify_service.get_recommendations(seed_track_list, limit)
    return tracks

@app.websocket("/ws/station/{station_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    station_id: str, 
    token: str = Query(...)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        user = db.get_user(user_id)
        
        if not user:
            await websocket.close(code=1008)  # Policy violation
            return
            
        client_id = await manager.connect_to_station(websocket, station_id, user_id)
        
        try:
            while True:
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                message_type = message_data.get("type")
                
                if message_type == "chat_message":
                    content = message_data.get("content")
                    if content:
                        await manager.handle_chat_message(user_id, station_id, content)
                
                elif message_type == "tip":
                    to_user_id = message_data.get("to_user_id")
                    amount = message_data.get("amount")
                    message = message_data.get("message")
                    
                    if to_user_id and amount:
                        await manager.handle_tip(user_id, to_user_id, station_id, amount, message)
                
                elif message_type == "track_update" and user.id == db.get_station(station_id).dj_id:
                    track_data = message_data.get("track")
                    if track_data:
                        await manager.broadcast_to_station(
                            station_id,
                            {
                                "type": "track_update",
                                "data": track_data
                            }
                        )
        except WebSocketDisconnect:
            await manager.disconnect(client_id)
    
    except Exception as e:
        await websocket.close(code=1011)  # Internal error
