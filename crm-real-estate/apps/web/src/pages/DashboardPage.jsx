import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { PageHeader } from "../components/PageHeader.jsx";
import { Card, Spinner } from "../components/ui.jsx";
import { formatUsd, formatKgs, DEAL_STAGE_LABELS } from "../utils/format.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [managerStats, setManagerStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/dashboard/summary");
        setSummary(data);
        if (user?.role === "ADMIN") {
          const { data: mgr } = await api.get("/dashboard/managers");
          setManagerStats(mgr.stats);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const stats = [
    { label: "Клиентов", value: summary.clientsCount, tone: "text-ink" },
    { label: "Квартир в продаже", value: summary.propertiesAvailable, tone: "text-ink" },
    { label: "Активных сделок", value: summary.dealsOpen, tone: "text-accent" },
    { label: "Успешно закрыто", value: summary.dealsWon, tone: "text-success" },
  ];

  return (
    <div>
      <PageHeader
        title={`Здравствуйте, ${user?.fullName?.split(" ")[0] || ""}`}
        subtitle={`Курс: 1 USD = ${summary.exchangeRate} сом`}
      />

      <div className="p-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-5">
              <div className="text-xs font-medium uppercase tracking-wide text-ink-faint">{s.label}</div>
              <div className={`mt-2 font-display text-3xl font-extrabold ${s.tone}`}>{s.value}</div>
            </Card>
          ))}
        </div>

        <Card className="mt-4 p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            Сумма закрытых сделок
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="font-display text-3xl font-extrabold text-success">
              {formatUsd(summary.wonAmount.usd)}
            </span>
            <span className="text-sm text-ink-faint">≈ {formatKgs(summary.wonAmount.kgs)}</span>
          </div>
        </Card>

        <div className="mt-8">
          <h2 className="mb-3 font-display text-base font-bold text-ink">Воронка продаж — открытые сделки</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {summary.byStage.map((s) => (
              <Card key={s.stage} className="p-4">
                <div className="text-xs font-semibold text-ink-soft">{DEAL_STAGE_LABELS[s.stage]}</div>
                <div className="mt-1.5 font-display text-xl font-extrabold text-ink">{s.count}</div>
                <div className="text-xs text-ink-faint">{formatUsd(s.amount.usd)}</div>
              </Card>
            ))}
          </div>
        </div>

        {managerStats && (
          <div className="mt-8">
            <h2 className="mb-3 font-display text-base font-bold text-ink">Показатели по менеджерам</h2>
            <Card className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-faint">
                    <th className="px-4 py-3 font-medium">Менеджер</th>
                    <th className="px-4 py-3 font-medium">Клиенты</th>
                    <th className="px-4 py-3 font-medium">Активные сделки</th>
                    <th className="px-4 py-3 font-medium">Закрыто</th>
                    <th className="px-4 py-3 font-medium">Сумма продаж</th>
                  </tr>
                </thead>
                <tbody>
                  {managerStats.map((m) => (
                    <tr key={m.manager.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 font-medium text-ink">{m.manager.fullName}</td>
                      <td className="px-4 py-3 text-ink-soft">{m.clientsCount}</td>
                      <td className="px-4 py-3 text-ink-soft">{m.dealsOpen}</td>
                      <td className="px-4 py-3 text-ink-soft">{m.dealsWon}</td>
                      <td className="px-4 py-3 font-medium text-ink">{formatUsd(m.wonAmount.usd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
