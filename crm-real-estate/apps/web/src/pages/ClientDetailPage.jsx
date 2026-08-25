import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, extractErrorMessage } from "../api/client.js";
import { PageHeader } from "../components/PageHeader.jsx";
import { Button, Card, Select, Spinner, Badge } from "../components/ui.jsx";
import CommentsSection from "../components/CommentsSection.jsx";
import { CLIENT_STATUS_LABELS, DEAL_STAGE_LABELS, formatDate, formatUsd } from "../utils/format.js";

const STATUS_OPTIONS = ["NEW", "IN_PROGRESS", "CLIENT", "LOST"];

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/clients/${id}`);
      setClient(data.client);
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
    await api.patch(`/clients/${id}`, { status: newStatus });
    load();
  }

  async function handleDelete() {
    if (!confirm("Удалить клиента без активных сделок?")) return;
    try {
      await api.delete(`/clients/${id}`);
      navigate("/clients");
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
  if (error || !client) {
    return <div className="p-8 text-danger">{error || "Клиент не найден"}</div>;
  }

  return (
    <div>
      <PageHeader
        title={client.fullName}
        subtitle={client.phone + (client.email ? ` · ${client.email}` : "")}
        action={
          <div className="flex items-center gap-2">
            <Select value={client.status} onChange={(e) => handleStatusChange(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {CLIENT_STATUS_LABELS[s]}
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
            <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink-soft">
              Сделки клиента
            </h3>
            {client.deals.length === 0 ? (
              <p className="text-sm text-ink-faint">Сделок пока нет</p>
            ) : (
              <ul className="divide-y divide-line">
                {client.deals.map((d) => (
                  <li key={d.id} className="flex items-center justify-between py-3">
                    <div>
                      <Link to={`/deals/${d.id}`} className="font-medium text-ink hover:text-accent">
                        {d.title}
                      </Link>
                      {d.property && <div className="text-xs text-ink-faint">{d.property.title}</div>}
                    </div>
                    <div className="text-right">
                      <Badge>{DEAL_STAGE_LABELS[d.stage]}</Badge>
                      <div className="mt-1 text-xs text-ink-faint">{formatUsd(d.amountUsd)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <CommentsSection entityType="CLIENT" entityId={id} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink-soft">
              Информация
            </h3>
            <dl className="space-y-2 text-sm">
              <Row label="Менеджер" value={client.manager?.fullName} />
              <Row label="Источник" value={client.source || "—"} />
              <Row label="Дата создания" value={formatDate(client.createdAt)} />
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
