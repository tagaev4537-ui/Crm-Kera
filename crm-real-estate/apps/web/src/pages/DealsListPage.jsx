import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { PageHeader } from "../components/PageHeader.jsx";
import { Button, Card, Select, Spinner, EmptyState, Badge } from "../components/ui.jsx";
import { DEAL_STAGE_LABELS, DEAL_STAGE_ORDER, formatUsd, formatDate } from "../utils/format.js";

const STAGE_TONE = {
  NEW: "default",
  CONTACTED: "default",
  VIEWING: "accent",
  NEGOTIATION: "warning",
  DEAL: "accent",
  WON: "success",
  LOST: "danger",
};

export default function DealsListPage() {
  const [deals, setDeals] = useState([]);
  const [stage, setStage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/deals", { params: { stage: stage || undefined } });
      setDeals(data.deals);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  return (
    <div>
      <PageHeader
        title="Все сделки"
        subtitle="Полный список сделок, включая закрытые"
        action={
          <Link to="/deals">
            <Button variant="outline">← К воронке</Button>
          </Link>
        }
      />

      <div className="p-8">
        <div className="mb-4">
          <Select value={stage} onChange={(e) => setStage(e.target.value)} className="max-w-[220px]">
            <option value="">Все этапы</option>
            {DEAL_STAGE_ORDER.map((s) => (
              <option key={s} value={s}>
                {DEAL_STAGE_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        ) : deals.length === 0 ? (
          <EmptyState title="Сделок не найдено" />
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-faint">
                  <th className="px-4 py-3 font-medium">Сделка</th>
                  <th className="px-4 py-3 font-medium">Клиент</th>
                  <th className="px-4 py-3 font-medium">Менеджер</th>
                  <th className="px-4 py-3 font-medium">Этап</th>
                  <th className="px-4 py-3 font-medium">Сумма</th>
                  <th className="px-4 py-3 font-medium">Обновлена</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((d) => (
                  <tr key={d.id} className="border-b border-line last:border-0 hover:bg-bg/60">
                    <td className="px-4 py-3">
                      <Link to={`/deals/${d.id}`} className="font-medium text-ink hover:text-accent">
                        {d.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{d.client?.fullName}</td>
                    <td className="px-4 py-3 text-ink-soft">{d.manager?.fullName}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STAGE_TONE[d.stage]}>{DEAL_STAGE_LABELS[d.stage]}</Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">{formatUsd(d.amountUsd)}</td>
                    <td className="px-4 py-3 text-ink-faint">{formatDate(d.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
