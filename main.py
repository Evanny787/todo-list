import os
import sqlite3
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Where the database file lives. On a server we set DB_PATH to a saved-disk location.
DB_FILE = os.environ.get("DB_PATH", "todos.db")
app = FastAPI(title="Todo API")


def db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


# Create the table the first time the app starts
with db() as conn:
    conn.execute(
        """CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            done INTEGER NOT NULL DEFAULT 0,
            position INTEGER NOT NULL
        )"""
    )


class NewTodo(BaseModel):
    title: str


class UpdateTodo(BaseModel):
    title: Optional[str] = None
    done: Optional[bool] = None


class Order(BaseModel):
    ids: List[int]  # todo ids in the new order


def to_dict(r):
    return {"id": r["id"], "title": r["title"], "done": bool(r["done"])}


@app.get("/api/todos")
def list_todos():
    with db() as conn:
        rows = conn.execute("SELECT * FROM todos ORDER BY position").fetchall()
    return [to_dict(r) for r in rows]


@app.post("/api/todos")
def add_todo(body: NewTodo):
    title = body.title.strip()
    if not title:
        raise HTTPException(400, "Title can't be empty")
    with db() as conn:
        pos = conn.execute("SELECT COALESCE(MAX(position), -1) + 1 FROM todos").fetchone()[0]
        cur = conn.execute("INSERT INTO todos (title, position) VALUES (?, ?)", (title, pos))
        row = conn.execute("SELECT * FROM todos WHERE id = ?", (cur.lastrowid,)).fetchone()
    return to_dict(row)


@app.put("/api/todos/order")
def reorder(body: Order):
    with db() as conn:
        for position, todo_id in enumerate(body.ids):
            conn.execute("UPDATE todos SET position = ? WHERE id = ?", (position, todo_id))
    return {"ok": True}


@app.patch("/api/todos/{todo_id}")
def update_todo(todo_id: int, body: UpdateTodo):
    with db() as conn:
        row = conn.execute("SELECT * FROM todos WHERE id = ?", (todo_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "Todo not found")
        title = body.title.strip() if body.title is not None else row["title"]
        if not title:
            raise HTTPException(400, "Title can't be empty")
        done = int(body.done) if body.done is not None else row["done"]
        conn.execute("UPDATE todos SET title = ?, done = ? WHERE id = ?", (title, done, todo_id))
        row = conn.execute("SELECT * FROM todos WHERE id = ?", (todo_id,)).fetchone()
    return to_dict(row)


@app.delete("/api/todos/{todo_id}", status_code=204)
def delete_todo(todo_id: int):
    with db() as conn:
        conn.execute("DELETE FROM todos WHERE id = ?", (todo_id,))


# When the React page has been built (npm run build), serve it from this same app.
# This must stay at the very end so it doesn't hide the /api routes above.
DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if DIST.exists():
    app.mount("/", StaticFiles(directory=DIST, html=True), name="site")
