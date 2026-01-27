# Music Calendar

## 🔥 Project Overview
**Music Calendar** is a personal music intelligence & calendar application. 

At its core, it’s a tool that:
*   Tracks **artists you care about**
*   Automatically keeps track of new releases and upcoming events
*   Shows all of this in a **calendar-style view**
*   Starts as a **personal-use app**, with potential to expand

This is *not* just a playlist app — it’s a **music tracking system**.

## 🎯 The Problem
*   Music info is scattered (Spotify, Instagram, posters, WhatsApp stories, random tweets).
*   Indie / underground artists don’t have reliable structured data.
*   There’s no single place to see "What’s dropping this month?" or "Who’s performing near me?".

**Music Calendar** becomes **one source of truth** for *your* music world.

## 🧠 Core Concept
1.  **Input**: You tell the app which artists and genres you care about.
2.  **Process**: 
    *   Stores artists in the database.
    *   Fetches structured data (Spotify).
    *   Supplements with missing info (scraping/external sources).
    *   Normalizes artists, releases, and events.
3.  **Output**: Displays everything in a **calendar + list format**.

---

## 🏗️ Architecture

```
User → Frontend (React + Vite)
     → Backend (Node/Express API)
     → PostgreSQL (Artists, Releases, Events)
     → Spotify API
     → Other sources (later)
```

### Tech Stack
*   **Frontend**: React, Vite, Axios
*   **Backend**: Node.js, Express, Postgres (pg), dotenv
*   **Database**: PostgreSQL 15 (Docker)
*   **Infrastructure**: Docker Compose

---

## 🚀 Roadmap

### ✅ Phase 1: Foundation (Completed)
*   [x] Backend Setup (Express, Routes, Controllers)
*   [x] Database Setup (PostgreSQL, Docker)
*   [x] Database Schema (`artists` table)
*   [x] Frontend Initialization (React + Vite)
*   [x] Basic Frontend-Backend Connection

### 🔜 Phase 2: Data & Integration (Next)
*   [ ] **Release Tracking**: Database schema for releases.
*   [ ] **Spotify Integration**: OAuth and metadata fetching.
*   [ ] **Event Tracking**: Schema for shows and listening sessions.

### Phase 3: UI & Experience
*   [ ] **Calendar View**: Monthly/weekly visualization.
*   [ ] **Artist Management**: UI to add/view artists.

### Phase 4: Advanced
*   [ ] **Background Sync**: Cron jobs for automatic updates.
*   [ ] **Indie Support**: Manual entries and "soft data".

---

## 🛠️ Getting Started

### Prerequisites
*   Node.js
*   Docker & Docker Compose

### Running the App

1.  **Start Database**:
    ```bash
    docker compose up -d
    ```

2.  **Initialize Database** (First time only):
    ```bash
    cd backend
    npm run db:init
    ```

3.  **Start Backend**:
    ```bash
    cd backend
    npm run dev
    ```

4.  **Start Frontend**:
    ```bash
    cd frontend
    npm run dev
    ```
