from typing import Dict, List, Optional, Any
import uuid
from app.models import User, Station, Track, ChatMessage, Tip, TrackRecommendation, Follow, LiveSession

class InMemoryDB:
    def __init__(self):
        self.users: Dict[str, User] = {}
        self.stations: Dict[str, Station] = {}
        self.live_sessions: Dict[str, LiveSession] = {}
        self.recommendations: Dict[str, TrackRecommendation] = {}
        self.follows: List[Follow] = []
        
    def create_user(self, user_data: dict) -> User:
        user_id = str(uuid.uuid4())
        user = User(id=user_id, **user_data)
        self.users[user_id] = user
        return user

    def get_user(self, user_id: str) -> Optional[User]:
        return self.users.get(user_id)

    def get_user_by_email(self, email: str) -> Optional[User]:
        for user in self.users.values():
            if user.email == email:
                return user
        return None

    def create_station(self, station_data: dict) -> Station:
        station_id = str(uuid.uuid4())
        station = Station(id=station_id, **station_data)
        self.stations[station_id] = station
        return station

    def get_station(self, station_id: str) -> Optional[Station]:
        return self.stations.get(station_id)

    def update_station(self, station_id: str, data: dict) -> Optional[Station]:
        station = self.get_station(station_id)
        if not station:
            return None
            
        for key, value in data.items():
            setattr(station, key, value)
            
        self.stations[station_id] = station
        return station

    def get_stations_by_dj(self, dj_id: str) -> List[Station]:
        return [s for s in self.stations.values() if s.dj_id == dj_id]

    def get_all_stations(self) -> List[Station]:
        return list(self.stations.values())

    def create_live_session(self, session_data: dict) -> LiveSession:
        session = LiveSession(**session_data)
        station_id = session_data["station_id"]
        self.live_sessions[station_id] = session
        
        station = self.get_station(station_id)
        if station:
            station.is_live = True
            self.stations[station_id] = station
            
        return session

    def end_live_session(self, station_id: str) -> Optional[LiveSession]:
        session = self.live_sessions.get(station_id)
        if not session:
            return None
            
        session.is_active = False
        
        station = self.get_station(station_id)
        if station:
            station.is_live = False
            self.stations[station_id] = station
            
        return session

    def get_active_live_sessions(self) -> List[LiveSession]:
        return [s for s in self.live_sessions.values() if s.is_active]

    def create_follow(self, follower_id: str, followed_id: str) -> Follow:
        follow = Follow(follower_id=follower_id, followed_id=followed_id)
        self.follows.append(follow)
        return follow

    def get_followers(self, user_id: str) -> List[str]:
        return [f.follower_id for f in self.follows if f.followed_id == user_id]

    def get_following(self, user_id: str) -> List[str]:
        return [f.followed_id for f in self.follows if f.follower_id == user_id]

db = InMemoryDB()
