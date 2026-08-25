import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, extractErrorMessage } from "../api/client.js";
import { PageHeader } from "../components/PageHeader.jsx";
import { Button, Card, Input, Select, Modal, Spinner, EmptyState, Textarea, Avatar, Badge } from "../components/ui.jsx";
import { useCurrency } from "../context/CurrencyContext.jsx";
import { DEAL_STAGE_LABELS, DEAL_STAGE_ORDER, formatPrimary } from "../utils/format.js";

const OPEN_STAGES = DEAL_STAGE_ORDER.filter((s) => s !== "WON" && s !== "LOST");
const STAGE_DOT = {
  NEW: "bg-ink-faint",
  CONTACTED: "bg-blue-400",
  VIEWING: "bg-accent",
  NEGOTIATION: "bg-warning",
  DEAL: "bg-purple-400",
};
const NEXT_STAGE = {
  NEW: "CONTACTED",
  CONTACTED: "VIEWING",
  VIEWING: "NEGOTIATION",
  NEGOTIATION: "DEAL",
  DEAL: "WON",
};

export default function DealsPage() {
  const { currency } = useCurrency();
  const [columns, setColumns] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [lostModal, setLostModal] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/deals/pipeline");
      setColumns(data.columns);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function advance(deal) {
    const next = NEXT_STAGE[deal.stage];
    if (!next) return;
    try {
      await api.post(`/deals/${deal.id}/stage`, { stage: next });
      load();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  async function markLost(deal, reason) {
    try {
      await api.post(`/deals/${deal.id}/stage`, { stage: "LOST", lostReason: reason });
      setLostModal(null);
      load();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  const totalOpen = columns ? OPEN_STAGES.reduce((sum, s) => sum + (columns[s]?.length || 0), 0) : 0;

  return (
    <div>
      <PageHeader
        title="Воронка продаж"
        subtitle="Ведите активные сделки и отслеживайте прогресс."
        action={
          <>
            <Link to="/deals/list">
              <Button variant="outline">Список сделок</Button>
            </Link>
            <Button variant="dark" onClick={() => setModalOpen(true)}>
              + Новая сделка
            </Button>
          </>
        }
      />

      <div className="overflow-x-auto px-8 pb-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        ) : totalOpen === 0 ? (
          <EmptyState title="Сделок пока нет" description="Создайте первую сделку, чтобы увидеть воронку." />
        ) : (
          <div className="flex gap-5" style={{ minWidth: OPEN_STAGES.length * 290 }}>
            {OPEN_STAGES.map((stage) => (
              <div key={stage} className="w-[280px] shrink-0">
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span className={`h-2 w-2 rounded-full ${STAGE_DOT[stage]}`} />
                  <h3 className="text-[15px] font-bold text-ink">{DEAL_STAGE_LABELS[stage]}</h3>
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-ink/5 text-xs font-semibold text-ink-soft">
                    {columns[stage]?.length || 0}
                  </span>
                </div>
                <div className="space-y-3">
                  {(columns[stage] || []).map((deal) => {
                    const amt = formatPrimary(deal.amount, currency);
                    return (
                      <Card key={deal.id} className="p-4">
                        <Link to={`/deals/${deal.id}`} className="block">
                          <div className="text-[15px] font-bold text-ink hover:text-accent-dark">{deal.title}</div>
                          <div className="mt-2.5 flex items-center gap-2">
                            <Avatar name={deal.client?.fullName} size={22} />
                            <span className="text-sm text-ink-soft">{deal.client?.fullName}</span>
                          </div>
                          {deal.property && (
                            <div className="mt-1 truncate text-xs text-ink-faint">{deal.property.title}</div>
                          )}
                          <div className="mt-3 font-display text-base font-extrabold text-ink">{amt.main}</div>
                          <div className="text-xs text-ink-faint">{amt.secondary}</div>
                        </Link>
                        <div className="mt-3 flex gap-1.5">
                          {NEXT_STAGE[stage] && (
                            <Button variant="outline" className="flex-1 !px-2 !py-1.5 text-xs" onClick={() => advance(deal)}>
                              {NEXT_STAGE[stage] === "WON" ? "Закрыть успешно →" : "Далее →"}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            className="!px-2 !py-1.5 text-xs text-danger hover:bg-danger/10"
                            onClick={() => setLostModal(deal)}
                          >
                            Отказ
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NewDealModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={load} />
      <LostReasonModal deal={lostModal} onClose={() => setLostModal(null)} onConfirm={markLost} />
    </div>
  );
}

function LostReasonModal({ deal, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  if (!deal) return null;
  return (
    <Modal open={!!deal} onClose={onClose} title={`Причина отказа — ${deal.title}`}>
      <Textarea
        label="Причина"
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Например: выбрали другой ЖК, отложили покупку..."
      />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Отмена
        </Button>
        <Button variant="danger" onClick={() => onConfirm(deal, reason)} disabled={!reason.trim()}>
          Подтвердить отказ
        </Button>
      </div>
    </Modal>
  );
}

function NewDealModal({ open, onClose, onCreated }) {
  const { currency } = useCurrency();
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({ title: "", clientId: "", propertyId: "", amountUsd: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    api.get("/clients").then(({ data }) => setClients(data.clients));
    api.get("/properties", { params: { status: "AVAILABLE" } }).then(({ data }) => setProperties(data.properties));
  }, [open]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/deals", { ...form, propertyId: form.propertyId || undefined });
      setForm({ title: "", clientId: "", propertyId: "", amountUsd: "" });
      onClose();
      onCreated();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Новая сделка">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input label="Название сделки" required value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Продажа 2-комн, ЖК Асман" />
        <Select label="Клиент" required value={form.clientId} onChange={(e) => set("clientId", e.target.value)}>
          <option value="">Выберите клиента</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName}
            </option>
          ))}
        </Select>
        <Select label="Квартира (необязательно)" value={form.propertyId} onChange={(e) => set("propertyId", e.target.value)}>
          <option value="">Без привязки</option>
          {properties.map((p) => {
            const amt = formatPrimary(p.price, currency);
            return (
              <option key={p.id} value={p.id}>
                {p.title} — {amt.main}
              </option>
            );
          })}
        </Select>
        <Input label="Сумма сделки, USD" required type="number" value={form.amountUsd} onChange={(e) => set("amountUsd", e.target.value)} />
        {error && <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Отмена
          </Button>
          <Button variant="dark" type="submit" disabled={saving}>
            {saving ? <Spinner className="h-4 w-4 text-white" /> : "Создать"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
