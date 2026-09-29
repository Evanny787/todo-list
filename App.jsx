import { useEffect, useState } from "react";
import "./App.css";

// Small helper for talking to the backend
async function api(url, method = "GET", body) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error("Request failed");
  return res.status === 204 ? null : res.json();
}

export default function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [dragId, setDragId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [error, setError] = useState("");

  // Load the list once when the page opens
  useEffect(() => {
    api("/api/todos")
      .then(setTodos)
      .catch(() => setError("Can't reach the backend. Check that it is running."));
  }, []);

  async function addTodo(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const todo = await api("/api/todos", "POST", { title: text });
    setTodos([...todos, todo]);
    setText("");
  }

  async function toggle(todo) {
    const updated = await api(`/api/todos/${todo.id}`, "PATCH", { done: !todo.done });
    setTodos(todos.map((t) => (t.id === todo.id ? updated : t)));
  }

  async function saveEdit(id) {
    if (editText.trim()) {
      const updated = await api(`/api/todos/${id}`, "PATCH", { title: editText });
      setTodos(todos.map((t) => (t.id === id ? updated : t)));
    }
    setEditId(null);
  }

  async function remove(id) {
    await api(`/api/todos/${id}`, "DELETE");
    setTodos(todos.filter((t) => t.id !== id));
  }

  // While dragging, move the dragged item over the one it hovers
  function onDragOver(e, overId) {
    e.preventDefault();
    if (dragId === null || dragId === overId) return;
    const next = [...todos];
    const from = next.findIndex((t) => t.id === dragId);
    const to = next.findIndex((t) => t.id === overId);
    next.splice(to, 0, next.splice(from, 1)[0]);
    setTodos(next);
  }

  // When the drop happens, save the new order
  function onDragEnd() {
    setDragId(null);
    api("/api/todos/order", "PUT", { ids: todos.map((t) => t.id) });
  }

  const left = todos.filter((t) => !t.done).length;

  return (
    <main className="app">
      <h1>Todo list</h1>
      <p className="sub">{todos.length ? `${left} of ${todos.length} left to do` : "Nothing here yet."}</p>
      {error && <p className="error">{error}</p>}

      <form onSubmit={addTodo} className="add">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a task" aria-label="New task" />
        <button type="submit">Add task</button>
      </form>

      <ul>
        {todos.map((t) => (
          <li
            key={t.id}
            draggable={editId !== t.id}
            onDragStart={() => setDragId(t.id)}
            onDragOver={(e) => onDragOver(e, t.id)}
            onDragEnd={onDragEnd}
            className={(t.done ? "done " : "") + (dragId === t.id ? "dragging" : "")}
          >
            <span className="grip" title="Drag to reorder">⠿</span>
            <input type="checkbox" checked={t.done} onChange={() => toggle(t)} aria-label={`Mark "${t.title}" done`} />
            {editId === t.id ? (
              <input
                className="edit"
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={() => saveEdit(t.id)}
                onKeyDown={(e) => e.key === "Enter" && saveEdit(t.id)}
              />
            ) : (
              <span className="title">{t.title}</span>
            )}
            <button className="ghost" onClick={() => { setEditId(t.id); setEditText(t.title); }}>Edit</button>
            <button className="ghost" onClick={() => remove(t.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
