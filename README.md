# ✈️ TripoBD

[![Django](https://img.shields.io/badge/Django-5.2+-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Tailwind](https://img.shields.io/badge/Gemini_AI-API-Orange?style=for-the-badge&logo=google-gemini&logoColor=white)](https://ai.google.dev/)

**TripoBD** is a modern, feature-rich travel management and community planning platform tailored for tourism in Bangladesh. It bridges the gap between **Travelers**, **Tour Guides/Service Providers**, and **Administrators** by providing dedicated dashboards, a dynamic community feed, an AI-powered travel planner, and interactive "Tour Rooms" for collaborative group planning.

---

## 🌟 Key Features

### 👤 1. Traveler Dashboard & Settings
*   **Preferences & Badges:** Customize traveler profiles, select travel style preferences, and earn display badges (like *Explorer* and *Storyteller*) based on activity milestones.
*   **Trip Stories:** Author and publish rich stories of your trips with photos, liking, and commenting capabilities.
*   **Settings Hub:** Toggle dark/light display settings, manage blocked users, request data export, or request account deactivation.

### 👥 2. Tour Rooms (Collaborative Group Planner)
A live-action dashboard where group members plan trips together:
*   **Shared Chat:** Group chat specifically bound to the tour room.
*   **Shared Checklist:** Add, update, and complete items collaboratively.
*   **Live Polls:** Propose travel decisions and vote on them in real-time.
*   **Expense Splitter:** Log expenses, set split participants, and track payments individually.
*   **Interactive Map Pins:** Add pins directly on a shared Leaflet map to mark stops.
*   **Booking Notes:** Keep a record of flight/hotel confirmations and reservation details.

### 🤖 3. AI Travel Assistant
*   Uses **Gemini AI** to create customized, day-by-day travel itineraries.
*   Chat interface that remembers context during your session.
*   Save recommended itineraries directly to your profile with one click.

### 🤝 4. Community Feed & Social Circle
*   **Platform Feed:** Share stories, read reviews, and explore destinations.
*   **Groups Directory:** Create or join public/private groups, invite other travelers.
*   **Social Interactions:** Follow other travelers, view their leaderboards, and get notified about updates.

### 🗺️ 5. Tour Guide & Local Booking Portal
*   **Guide Verification:** Professional guides submit verification requests to Admins.
*   **Guide Dashboard:** Stats on total trips led, overall rating, recent bookings, and total earnings.
*   **Support Tickets:** Communicate directly with administrators.

### 🛡️ 6. Admin Control Center
*   **Analytics Dashboard:** View system stats, trending destinations, active user graphs.
*   **Moderation Panel:** Moderate flagged content, reviews, and stories.
*   **System Configuration:** Edit global site parameters, view system audit logs.
*   **CMS Management:** Update the Homepage, About page, FAQs, route mappings, and video tutorials dynamically.

---

## 🏗️ Tech Stack

*   **Backend:** Python 3.10+, Django 5.2+, Django REST Framework (DRF)
*   **Frontend:** React 19, Vite 8, React Router DOM v6, Leaflet Maps
*   **Database:** MySQL (configured with PyMySQL)
*   **Communications:** SMTP Email backend (supports OTP verification & transactional emails via Gmail SMTP)
*   **AI Integration:** Gemini API for intelligent routing and itinerary building

---

## 📂 Project Structure

```text
TripoBD/
│
├── Backend/                 # Django Web API
│   ├── api/                 # Django App for API endpoints (models, views, serializers)
│   │   ├── management/      # Custom django-admin commands (mock data seeding)
│   │   ├── migrations/      # Database migrations
│   │   ├── models.py        # Database models (Traveler, Guide, Booking, TourRoom, etc.)
│   │   ├── views.py         # Primary API endpoints
│   │   └── urls.py          # API Routing configuration
│   ├── config/              # Project settings, WSGI/ASGI configurations, URLs entrypoint
│   ├── media/               # Uploaded images (avatars, trip story images)
│   ├── .env.example         # Template for environment configuration
│   └── requirements.txt     # Python packages dependencies
│
├── Frontend/                # React Client Web App
│   ├── public/              # Static assets
│   ├── src/                 # React source code (components, pages, routing)
│   │   ├── components/      # Shared components (Navbar, Footer, Maps)
│   │   ├── pages/           # Page views (Admin Dashboard, TourRoom, AI Assistant, Feed)
│   │   └── main.jsx         # App entrypoint
│   ├── .env.example         # Template for client-side API configuration
│   ├── index.html           # HTML template
│   └── package.json         # Node.js dependencies & scripts
```

---

## ⚙️ Setup and Installation

Follow these steps to run TripoBD locally on your machine.

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [Python](https://www.python.org/) (v3.10 or higher)
*   [MySQL Server](https://www.mysql.com/downloads/) (running locally or remotely)
*   Gemini API Key (optional but required for the AI Planner feature)

---

### 1. Backend Setup (Django)

1.  **Navigate to the Backend directory:**
    ```bash
    cd Backend
    ```

2.  **Create a Virtual Environment:**
    *   **Windows (PowerShell/CMD):**
        ```bash
        python -m venv venv
        ```
    *   **macOS/Linux:**
        ```bash
        python3 -m venv venv
        ```

3.  **Activate the Virtual Environment:**
    *   **Windows (PowerShell):**
        ```bash
        .\venv\Scripts\Activate.ps1
        ```
    *   **Windows (CMD):**
        ```cmd
        .\venv\Scripts\activate.bat
        ```
    *   **macOS/Linux:**
        ```bash
        source venv/bin/activate
        ```

4.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Configure Environment Variables:**
    *   Duplicate `.env.example` and name the copy `.env`.
        ```bash
        cp .env.example .env
        ```
    *   Open `.env` and fill in your MySQL credentials and Gmail SMTP keys:
        ```ini
        DB_ENGINE=django.db.backends.mysql
        DB_NAME=tripo_db
        DB_USER=root
        DB_PASSWORD=your_mysql_password
        DB_HOST=localhost
        DB_PORT=3306

        EMAIL_HOST_USER=your_email@gmail.com
        EMAIL_HOST_PASSWORD=your_gmail_app_password
        DEFAULT_FROM_EMAIL=your_email@gmail.com
        DEBUG=True
        ```

6.  **Create the Database:**
    *   Log into MySQL CLI or a GUI tool (like phpMyAdmin, DBeaver) and create the database:
        ```sql
        CREATE DATABASE tripo_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        ```

7.  **Run Database Migrations:**
    ```bash
    python manage.py makemigrations api
    python manage.py migrate
    ```

8.  **Seed Database with Mock Data:**
    Populate the system with destinations, travel routes, guide listings, and dummy user profiles:
    ```bash
    python manage.py seed_data
    python manage.py seed_community
    python manage.py seed_dashboard
    ```

9.  **Start Django Development Server:**
    ```bash
    python manage.py runserver
    ```
    The API will now be running on `http://127.0.0.1:8000/`.

---

### 2. Frontend Setup (React + Vite)

1.  **Open a new terminal and navigate to the Frontend directory:**
    ```bash
    cd Frontend
    ```

2.  **Configure Environment Variables:**
    *   Duplicate `.env.example` and name the copy `.env.local`.
        ```bash
        cp .env.example .env.local
        ```
    *   Open `.env.local` and add your Gemini API Key and point the API base URL to the Django server:
        ```ini
        VITE_GEMINI_API_KEY=your_gemini_api_key_here
        VITE_API_BASE_URL=http://localhost:8000/api
        ```

3.  **Install Node Modules:**
    ```bash
    npm install
    ```

4.  **Start Development Server:**
    ```bash
    npm run dev
    ```
    The application will now be running locally on `http://localhost:5173/`. Open this URL in your web browser.

---

## 👤 Sample Login Credentials

Once you seed the database using `python manage.py seed_data`, you can log into the client dashboard using the following credentials:

*   **Role:** Traveler / Basic User
*   **Username:** `traveler1`
*   **Password:** `Traveler@123`

---

## 🔒 Security & Best Practices

*   **Environment Variables:** Never commit `.env` or `.env.local` files to public git repositories. They are already listed in the `.gitignore` files of both sub-directories.
*   **Production Deployment:** Turn off `DEBUG = False` in your backend `.env` configuration file, configure CORS headers appropriately, and update the `SECRET_KEY`.
