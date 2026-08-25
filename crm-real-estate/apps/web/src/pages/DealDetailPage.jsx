import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, extractErrorMessage } from "../api/client.js";
import { PageHeader } from "../components/PageHeader.jsx";
import { Button, Card, Spinner, Badge, Modal, Textarea } from "../components/ui.jsx";
import CommentsSection from "../components/CommentsSection.jsx";
import {
  DEAL_STAGE_LABELS,
  DEAL_STAGE_ORDER,
  formatUsd,
  formatKgs,
  formatDate,
  formatDateTime,
} from "../utils/format.js";

export default function DealDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lostModalOpen, setLostModalOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/deals/${id}`);
      setDeal(data.deal);
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

  async function changeStage(stage, lostReason) {
    try {
      await api.post(`/deals/${id}/stage`, { stage, lostReason });
      setLostModalOpen(false);
      load();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  async function handleDelete() {
    if (!confirm("Удалить сделку безвозвратно?")) return;
    try {
      await api.delete(`/deals/${id}`);
      navigate("/deals/list");
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
  if (error || !deal) {
    return <div className="p-8 text-danger">{error || "Сделка не найдена"}</div>;
  }

  const isClosed = deal.stage === "WON" || deal.stage === "LOST";

  return (
    <div>
      <PageHeader
        title={deal.title}
        subtitle={`${deal.client?.fullName}${deal.property ? " · " + deal.property.title : ""}`}
        action={
          <Button variant="danger" onClick={handleDelete}>
            Удалить сделку
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={deal.stage === "WON" ? "success" : deal.stage === "LOST" ? "danger" : "accent"}>
                {DEAL_STAGE_LABELS[deal.stage]}
              </Badge>
              <span className="text-sm text-ink-faint">Вероятность: {deal.probability}%</span>
            </div>
            <div className="mt-3">
              <div className="font-display text-3xl font-extrabold text-ink">{formatUsd(deal.amount.usd)}</div>
              <div className="text-sm text-ink-faint">≈ {formatKgs(deal.amount.kgs)}</div>
            </div>
            {deal.lostReason && (
              <div className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
                Причина отказа: {deal.lostReason}
              </div>
            )}

            {!isClosed && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                {DEAL_STAGE_ORDER.filter((s) => s !== "WON" && s !== "LOST" && s !== deal.stage).map((s) => (
                  <Button key={s} variant="outline" className="text-xs" onClick={() => changeStage(s)}>
                    {DEAL_STAGE_LABELS[s]}
                  </Button>
                ))}
                <Button variant="accent" className="text-xs" onClick={() => changeStage("WON")}>
                  Закрыть успешно
                </Button>
                <Button variant="danger" className="text-xs" onClick={() => setLostModalOpen(true)}>
                  Отказ
                </Button>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink-soft">
              История изменений
            </h3>
            <ul className="space-y-3">
              {deal.history.map((h) => (
                <li key={h.id} className="flex items-start gap-3 text-sm">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <div>
                    <div className="text-ink">
                      {h.fromStage ? `${DEAL_STAGE_LABELS[h.fromStage]} → ` : ""}
                      <span className="font-medium">{DEAL_STAGE_LABELS[h.toStage]}</span>
                    </div>
                    {h.note && <div className="text-ink-soft">{h.note}</div>}
                    <div className="text-xs text-ink-faint">
                      {h.changedBy?.fullName} · {formatDateTime(h.createdAt)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <CommentsSection entityType="DEAL" entityId={id} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink-soft">
              Детали
            </h3>
            <dl className="space-y-2 text-sm">
              <Row
                label="Клиент"
                value={
                  <Link to={`/clients/${deal.client.id}`} className="text-accent hover:underline">
                    {deal.client.fullName}
                  </Link>
                }
              />
              {deal.property && (
                <Row
                  label="Квартира"
                  value={
                    <Link to={`/properties/${deal.property.id}`} className="text-accent hover:underline">
                      {deal.property.title}
                    </Link>
                  }
                />
              )}
              <Row label="Менеджер" value={deal.manager?.fullName} />
              <Row label="Создана" value={formatDate(deal.createdAt)} />
              {deal.expectedCloseDate && <Row label="Ожидаемое закрытие" value={formatDate(deal.expectedCloseDate)} />}
              {deal.closedAt && <Row label="Закрыта" value={formatDate(deal.closedAt)} />}
            </dl>
          </Card>
        </div>
      </div>

      <Modal open={lostModalOpen} onClose={() => setLostModalOpen(false)} title="Причина отказа">
        <LostForm onConfirm={(reason) => changeStage("LOST", reason)} onCancel={() => setLostModalOpen(false)} />
      </Modal>
    </div>
  );
}

function LostForm({ onConfirm, onCancel }) {
  const [reason, setReason] = useState("");
  return (
    <div>
      <Textarea label="Причина" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        <Button variant="danger" onClick={() => onConfirm(reason)} disabled={!reason.trim()}>
          Подтвердить
        </Button>
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
