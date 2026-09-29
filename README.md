# Todo app (FastAPI + React + SQLite)

Add, edit, check off, delete and drag tasks to reorder them. Data is saved in `backend/todos.db`.

## You need (install once)
- Python 3.9 or newer: https://www.python.org/downloads/
- Node.js (LTS): https://nodejs.org/

## Start the backend (Terminal 1)
    cd backend
    python -m venv venv
    # Mac/Linux:  source venv/bin/activate
    # Windows:    venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn main:app --reload

Leave it running. You should see "Uvicorn running on http://127.0.0.1:8000".

## Start the frontend (Terminal 2)
    cd frontend
    npm install
    npm run dev

Open the address it prints (usually http://localhost:5173) in your browser.

## Stop
Press Ctrl+C in each terminal.

## Files
- backend/main.py: the API and the SQLite database
- frontend/src/App.jsx: the page
- frontend/src/App.css: the styling
