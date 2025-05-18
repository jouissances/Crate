from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, HttpUrl, Field
from datetime import datetime

class UserRole(str, Enum):
    DJ = "dj"
    LISTENER = "listener"

class AuthProvider(str, Enum):
    EMAIL = "email"
    SPOTIFY = "spotify"

class Mood(BaseModel):
    text: Optional[str] = None
    emoji: Optional[str] = None

class Book(BaseModel):
    title: str
    author: str

class SoundBite(BaseModel):
    id: str
    name: str
    duration: int  # in seconds
    url: str
    created_at: datetime = Field(default_factory=datetime.now)

class User(BaseModel):
    id: str
    email: EmailStr
    username: str
    display_name: str
    profile_image: Optional[HttpUrl] = None
    role: UserRole
    auth_provider: AuthProvider
    spotify_connected: bool = False
    spotify_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

class Track(BaseModel):
    id: str
    spotify_id: str
    name: str
    artist: str
    album: str
    album_art: HttpUrl
    duration_ms: int
    preview_url: Optional[HttpUrl] = None
    added_at: datetime = Field(default_factory=datetime.now)

class Station(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    cover_art: Optional[HttpUrl] = None
    dj_id: str
    mood: Optional[Mood] = None
    currently_reading: Optional[Book] = None
    quote: Optional[str] = None
    sound_bites: List[SoundBite] = []
    tracks: List[Track] = []
    is_live: bool = False
    created_at: datetime = Field(default_factory=datetime.now)

class ChatMessage(BaseModel):
    id: str
    user_id: str
    station_id: str
    content: str
    created_at: datetime = Field(default_factory=datetime.now)

class Tip(BaseModel):
    id: str
    from_user_id: str
    to_user_id: str
    station_id: str
    amount: float
    message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

class TrackRecommendation(BaseModel):
    id: str
    user_id: str
    station_id: str
    spotify_id: str
    name: str
    artist: str
    message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

class Follow(BaseModel):
    follower_id: str
    followed_id: str
    created_at: datetime = Field(default_factory=datetime.now)

class WSConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, Any]] = {}
        self.station_listeners: Dict[str, Dict[str, Any]] = {}

class LiveSession(BaseModel):
    station_id: str
    started_at: datetime = Field(default_factory=datetime.now)
    dj_id: str
    active_listeners: int = 0
    current_track: Optional[Track] = None
    is_active: bool = True
