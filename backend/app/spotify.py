import os
from typing import Dict, List, Optional
import spotipy
from spotipy.oauth2 import SpotifyOAuth

SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID", "your-client-id")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET", "your-client-secret")
SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI", "http://localhost:8000/api/auth/spotify/callback")

class SpotifyService:
    def __init__(self):
        self.sp_oauth = SpotifyOAuth(
            client_id=SPOTIFY_CLIENT_ID,
            client_secret=SPOTIFY_CLIENT_SECRET,
            redirect_uri=SPOTIFY_REDIRECT_URI,
            scope="user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing streaming"
        )
        
        self.sp = spotipy.Spotify(
            auth_manager=spotipy.oauth2.SpotifyClientCredentials(
                client_id=SPOTIFY_CLIENT_ID,
                client_secret=SPOTIFY_CLIENT_SECRET
            )
        )
    
    def get_auth_url(self) -> str:
        """Get Spotify authorization URL"""
        return self.sp_oauth.get_authorize_url()
    
    def get_access_token(self, code: str) -> Dict:
        """Exchange authorization code for access token"""
        return self.sp_oauth.get_access_token(code)
    
    def get_user_profile(self, access_token: str) -> Dict:
        """Get Spotify user profile"""
        sp = spotipy.Spotify(auth=access_token)
        return sp.current_user()
    
    def search_tracks(self, query: str, limit: int = 10) -> List[Dict]:
        """Search for tracks"""
        results = self.sp.search(q=query, type="track", limit=limit)
        return results["tracks"]["items"]
    
    def get_track(self, track_id: str) -> Dict:
        """Get track details"""
        return self.sp.track(track_id)
    
    def get_recommendations(self, seed_tracks: List[str], limit: int = 10) -> List[Dict]:
        """Get track recommendations based on seed tracks"""
        results = self.sp.recommendations(seed_tracks=seed_tracks, limit=limit)
        return results["tracks"]

spotify_service = SpotifyService()
