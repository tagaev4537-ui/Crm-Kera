import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, extractErrorMessage } from "../api/client.js";
import { PageHeader } from "../components/PageHeader.jsx";
import { Button, Card, Input, Select, Modal, Spinner, EmptyState, Badge, Textarea } from "../components/ui.jsx";
import { PROPERTY_STATUS_LABELS, PROPERTY_STATUS_TONE, formatUsd, formatKgs } from "../utils/format.js";

const STATUS_OPTIONS = ["AVAILABLE", "RESERVED", "SOLD", "ARCHIVED"];

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/properties", {
        params: { search: search || undefined, status: status || undefined },
      });
      setProperties(data.properties);
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
        title="Квартиры"
        subtitle="База объектов недвижимости"
        action={
          <Button variant="accent" onClick={() => setModalOpen(true)}>
            + Добавить квартиру
          </Button>
        }
      />

      <div className="p-8">
        <div className="mb-4 flex flex-wrap gap-3">
          <Input
            placeholder="Поиск по названию, адресу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[180px]">
            <option value="">Все статусы</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {PROPERTY_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        ) : properties.length === 0 ? (
          <EmptyState title="Квартир пока нет" description="Добавьте первый объект в базу." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <Link key={p.id} to={`/properties/${p.id}`}>
                <Card className="h-full p-5 transition-shadow hover:shadow-lg">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-display text-base font-bold text-ink">{p.title}</h3>
                    <Badge tone={PROPERTY_STATUS_TONE[p.status]}>{PROPERTY_STATUS_LABELS[p.status]}</Badge>
                  </div>
                  <p className="text-sm text-ink-soft">{p.address}</p>
                  <p className="mt-1 text-xs text-ink-faint">
                    {p.rooms}-комн · {p.areaM2} м² {p.floor ? `· ${p.floor}/${p.totalFloors || "?"} этаж` : ""}
                  </p>
                  <div className="mt-4 border-t border-line pt-3">
                    <div className="font-display text-lg font-extrabold text-ink">{formatUsd(p.price.usd)}</div>
                    <div className="text-xs text-ink-faint">≈ {formatKgs(p.price.kgs)}</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <NewPropertyModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={load} />
    </div>
  );
}

function NewPropertyModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    address: "",
    district: "",
    rooms: "1",
    areaM2: "",
    floor: "",
    totalFloors: "",
    priceUsd: "",
    description: "",
  });
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
      await api.post("/properties", form);
      onClose();
      onCreated();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Новая квартира" wide>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input label="Название" required value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="ЖК Асман, 2-комн" />
        <Input label="Адрес" required value={form.address} onChange={(e) => set("address", e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Район" value={form.district} onChange={(e) => set("district", e.target.value)} />
          <Select label="Комнат" value={form.rooms} onChange={(e) => set("rooms", e.target.value)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Площадь, м²" required type="number" step="0.1" value={form.areaM2} onChange={(e) => set("areaM2", e.target.value)} />
          <Input label="Этаж" type="number" value={form.floor} onChange={(e) => set("floor", e.target.value)} />
          <Input label="Этажность" type="number" value={form.totalFloors} onChange={(e) => set("totalFloors", e.target.value)} />
        </div>
        <Input label="Цена, USD" required type="number" value={form.priceUsd} onChange={(e) => set("priceUsd", e.target.value)} />
        <Textarea label="Описание" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
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
