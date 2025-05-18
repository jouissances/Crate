from typing import Dict, List, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect
import json
import uuid

from app.models import ChatMessage, Tip, User, Track
from app.db import db

class ConnectionManager:
    def __init__(self):
        self.station_connections: Dict[str, Dict[str, WebSocket]] = {}
        self.user_connections: Dict[str, Dict[str, WebSocket]] = {}
        self.connection_info: Dict[str, Dict[str, str]] = {}
        
    async def connect_to_station(self, websocket: WebSocket, station_id: str, user_id: str):
        await websocket.accept()
        
        client_id = str(uuid.uuid4())
        
        if station_id not in self.station_connections:
            self.station_connections[station_id] = {}
        if user_id not in self.user_connections:
            self.user_connections[user_id] = {}
            
        self.station_connections[station_id][client_id] = websocket
        self.user_connections[user_id][client_id] = websocket
        self.connection_info[client_id] = {"user_id": user_id, "station_id": station_id}
        
        station = db.get_station(station_id)
        user = db.get_user(user_id)
        
        if station and user:
            await self.broadcast_to_station(
                station_id,
                {
                    "type": "listener_joined",
                    "data": {
                        "user_id": user_id,
                        "username": user.username,
                        "display_name": user.display_name
                    }
                }
            )
        
        return client_id
    
    async def disconnect(self, client_id: str):
        if client_id not in self.connection_info:
            return
            
        info = self.connection_info[client_id]
        user_id = info["user_id"]
        station_id = info["station_id"]
        
        if station_id in self.station_connections and client_id in self.station_connections[station_id]:
            del self.station_connections[station_id][client_id]
        
        if user_id in self.user_connections and client_id in self.user_connections[user_id]:
            del self.user_connections[user_id][client_id]
            
        del self.connection_info[client_id]
        
        user_still_in_station = False
        for cid, info in self.connection_info.items():
            if info["user_id"] == user_id and info["station_id"] == station_id:
                user_still_in_station = True
                break
                
        if not user_still_in_station:
            user = db.get_user(user_id)
            if user:
                await self.broadcast_to_station(
                    station_id,
                    {
                        "type": "listener_left",
                        "data": {
                            "user_id": user_id,
                            "username": user.username,
                            "display_name": user.display_name
                        }
                    }
                )
    
    async def broadcast_to_station(self, station_id: str, message: Dict[str, Any]):
        if station_id not in self.station_connections:
            return
            
        encoded_message = json.dumps(message)
        for websocket in self.station_connections[station_id].values():
            await websocket.send_text(encoded_message)
    
    async def send_personal_message(self, user_id: str, message: Dict[str, Any]):
        if user_id not in self.user_connections:
            return
            
        encoded_message = json.dumps(message)
        for websocket in self.user_connections[user_id].values():
            await websocket.send_text(encoded_message)
    
    async def handle_chat_message(self, user_id: str, station_id: str, content: str):
        user = db.get_user(user_id)
        if not user:
            return
            
        message_id = str(uuid.uuid4())
        chat_message = ChatMessage(
            id=message_id,
            user_id=user_id,
            station_id=station_id,
            content=content
        )
        
        await self.broadcast_to_station(
            station_id,
            {
                "type": "chat_message",
                "data": {
                    "id": message_id,
                    "user_id": user_id,
                    "username": user.username,
                    "display_name": user.display_name,
                    "content": content,
                    "created_at": chat_message.created_at.isoformat()
                }
            }
        )
    
    async def handle_tip(self, from_user_id: str, to_user_id: str, station_id: str, amount: float, message: Optional[str] = None):
        from_user = db.get_user(from_user_id)
        to_user = db.get_user(to_user_id)
        
        if not from_user or not to_user:
            return
            
        tip_id = str(uuid.uuid4())
        tip = Tip(
            id=tip_id,
            from_user_id=from_user_id,
            to_user_id=to_user_id,
            station_id=station_id,
            amount=amount,
            message=message
        )
        
        tip_data = {
            "id": tip_id,
            "from_user": {
                "id": from_user_id,
                "username": from_user.username,
                "display_name": from_user.display_name
            },
            "amount": amount,
            "message": message,
            "created_at": tip.created_at.isoformat()
        }
        
        await self.broadcast_to_station(
            station_id,
            {
                "type": "tip_received",
                "data": tip_data
            }
        )
        
        await self.send_personal_message(
            from_user_id,
            {
                "type": "tip_sent",
                "data": {
                    "to_user": {
                        "id": to_user_id,
                        "username": to_user.username,
                        "display_name": to_user.display_name
                    },
                    "amount": amount,
                    "station_id": station_id
                }
            }
        )

manager = ConnectionManager()
