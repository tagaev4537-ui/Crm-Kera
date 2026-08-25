import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, extractErrorMessage } from "../api/client.js";
import { PageHeader } from "../components/PageHeader.jsx";
import { Button, Card, Input, Select, Modal, Spinner, EmptyState, Badge } from "../components/ui.jsx";
import { CLIENT_STATUS_LABELS, formatDate } from "../utils/format.js";

const STATUS_OPTIONS = ["NEW", "IN_PROGRESS", "CLIENT", "LOST"];

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/clients", { params: { search: search || undefined, status: status || undefined } });
      setClients(data.clients);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  return (
    <div>
      <PageHeader
        title="Клиенты"
        subtitle="База клиентов и потенциальных покупателей"
        action={
          <Button variant="accent" onClick={() => setModalOpen(true)}>
            + Новый клиент
          </Button>
        }
      />

      <div className="p-8">
        <div className="mb-4 flex flex-wrap gap-3">
          <Input
            placeholder="Поиск по имени, телефону, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[180px]">
            <option value="">Все статусы</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {CLIENT_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        ) : clients.length === 0 ? (
          <EmptyState title="Клиентов пока нет" description="Добавьте первого клиента, чтобы начать работу." />
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-faint">
                  <th className="px-4 py-3 font-medium">Клиент</th>
                  <th className="px-4 py-3 font-medium">Телефон</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium">Менеджер</th>
                  <th className="px-4 py-3 font-medium">Сделок</th>
                  <th className="px-4 py-3 font-medium">Создан</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-b border-line last:border-0 hover:bg-bg/60">
                    <td className="px-4 py-3">
                      <Link to={`/clients/${c.id}`} className="font-medium text-ink hover:text-accent">
                        {c.fullName}
                      </Link>
                      {c.email && <div className="text-xs text-ink-faint">{c.email}</div>}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{c.phone}</td>
                    <td className="px-4 py-3">
                      <Badge>{CLIENT_STATUS_LABELS[c.status] || c.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{c.manager?.fullName}</td>
                    <td className="px-4 py-3 text-ink-soft">{c._count?.deals ?? 0}</td>
                    <td className="px-4 py-3 text-ink-faint">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      <NewClientModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={load} />
    </div>
  );
}

function NewClientModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", source: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/clients", form);
      setForm({ fullName: "", phone: "", email: "", source: "" });
      onClose();
      onCreated();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Новый клиент">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input label="Полное имя" required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
        <Input label="Телефон" required value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+996 700 000 000" />
        <Input label="Email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        <Input label="Источник" value={form.source} onChange={(e) => set("source", e.target.value)} placeholder="Сайт, звонок, рекомендация..." />
        {error && <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Отмена
          </Button>
          <Button variant="accent" type="submit" disabled={saving}>
            {saving ? <Spinner className="h-4 w-4 text-white" /> : "Создать"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
