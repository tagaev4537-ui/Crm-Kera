import { useEffect, useState } from "react";
import { api, extractErrorMessage } from "../api/client.js";
import { Button, Textarea, Spinner } from "./ui.jsx";
import { formatDateTime } from "../utils/format.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function CommentsSection({ entityType, entityId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/comments", { params: { entityType, entityId } });
      setComments(data.comments);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post("/comments", { entityType, entityId, text });
      setText("");
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Удалить комментарий?")) return;
    try {
      await api.delete(`/comments/${id}`);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div>
      <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink-soft">
        Комментарии и примечания
      </h3>

      <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2">
        <Textarea
          placeholder="Добавить комментарий или примечание..."
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex items-center justify-between">
          {error && <span className="text-xs text-danger">{error}</span>}
          <Button type="submit" variant="accent" disabled={submitting || !text.trim()} className="ml-auto">
            {submitting ? <Spinner className="h-4 w-4 text-white" /> : "Добавить"}
          </Button>
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : comments.length === 0 ? (
        <p className="rounded-lg bg-bg px-4 py-6 text-center text-sm text-ink-faint">Комментариев пока нет</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-line bg-bg/60 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="whitespace-pre-wrap text-sm text-ink">{c.text}</p>
                  <p className="mt-1.5 text-xs text-ink-faint">
                    {c.author?.fullName} · {formatDateTime(c.createdAt)}
                  </p>
                </div>
                {(c.authorId === user?.id || user?.role === "ADMIN") && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="shrink-0 rounded p-1 text-ink-faint hover:bg-danger/10 hover:text-danger"
                    title="Удалить"
                  >
                    ✕
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
