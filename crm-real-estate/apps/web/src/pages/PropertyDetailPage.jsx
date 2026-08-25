import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, extractErrorMessage } from "../api/client.js";
import { PageHeader } from "../components/PageHeader.jsx";
import { Button, Card, Select, Spinner, Badge } from "../components/ui.jsx";
import CommentsSection from "../components/CommentsSection.jsx";
import {
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUS_TONE,
  DEAL_STAGE_LABELS,
  formatUsd,
  formatKgs,
  formatDate,
} from "../utils/format.js";

const STATUS_OPTIONS = ["AVAILABLE", "RESERVED", "SOLD", "ARCHIVED"];

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/properties/${id}`);
      setProperty(data.property);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleStatusChange(newStatus) {
    await api.patch(`/properties/${id}`, { status: newStatus });
    load();
  }

  async function handleDelete() {
    if (!confirm("Удалить квартиру без связанных сделок?")) return;
    try {
      await api.delete(`/properties/${id}`);
      navigate("/properties");
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (error || !property) {
    return <div className="p-8 text-danger">{error || "Квартира не найдена"}</div>;
  }

  return (
    <div>
      <PageHeader
        title={property.title}
        subtitle={property.address}
        action={
          <div className="flex items-center gap-2">
            <Select value={property.status} onChange={(e) => handleStatusChange(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {PROPERTY_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
            <Button variant="danger" onClick={handleDelete}>
              Удалить
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <Badge tone={PROPERTY_STATUS_TONE[property.status]}>{PROPERTY_STATUS_LABELS[property.status]}</Badge>
              <span className="text-sm text-ink-faint">
                {property.rooms}-комн · {property.areaM2} м²{" "}
                {property.floor ? `· ${property.floor}/${property.totalFloors || "?"} этаж` : ""}
              </span>
            </div>
            <div className="mb-4">
              <div className="font-display text-3xl font-extrabold text-ink">{formatUsd(property.price.usd)}</div>
              <div className="text-sm text-ink-faint">≈ {formatKgs(property.price.kgs)}</div>
            </div>
            {property.description && <p className="text-sm leading-relaxed text-ink-soft">{property.description}</p>}
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink-soft">
              Связанные сделки
            </h3>
            {property.deals?.length === 0 || !property.deals ? (
              <p className="text-sm text-ink-faint">Сделок пока нет</p>
            ) : (
              <ul className="divide-y divide-line">
                {property.deals.map((d) => (
                  <li key={d.id} className="flex items-center justify-between py-3">
                    <div>
                      <Link to={`/deals/${d.id}`} className="font-medium text-ink hover:text-accent">
                        {d.title}
                      </Link>
                      <div className="text-xs text-ink-faint">
                        {d.client?.fullName} · {d.manager?.fullName}
                      </div>
                    </div>
                    <Badge>{DEAL_STAGE_LABELS[d.stage]}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <CommentsSection entityType="PROPERTY" entityId={id} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink-soft">
              Информация
            </h3>
            <dl className="space-y-2 text-sm">
              <Row label="Район" value={property.district || "—"} />
              <Row label="Добавлена" value={formatDate(property.createdAt)} />
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-faint">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
