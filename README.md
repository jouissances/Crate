# Crate - Music Discovery App

A crate-digging inspired music discovery app that allows users to create and share themed radio stations with a minimalist retro design.

## Features
- User authentication with email and Spotify
- Create and host themed radio stations (mixtapes)
- Personalize stations with cover art, quotes, sound bites, moods, and book references
- Live broadcasting with real-time chat and tipping functionality
- Browse and discover stations by genre, mood, or book references
- Spotify integration for music playback

## Project Structure
- `/backend` - FastAPI backend for authentication, station management, and Spotify integration
- `/frontend` - React frontend with minimalist retro design

## Setup Instructions
### Backend
```sh
cd backend
poetry install
poetry run fastapi dev app/main.py
```

### Frontend
```sh
cd frontend
npm install
npm run dev
```

### Environment Variables
Backend environment variables (store in `.env` file):
- `SPOTIFY_CLIENT_ID` - Your Spotify API client ID
- `SPOTIFY_CLIENT_SECRET` - Your Spotify API client secret
- `SPOTIFY_REDIRECT_URI` - Redirect URI for Spotify OAuth
