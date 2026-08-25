import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { PageHeader } from "../components/PageHeader.jsx";
import { Card, Spinner } from "../components/ui.jsx";
import { useCurrency } from "../context/CurrencyContext.jsx";
import { formatPrimary, DEAL_STAGE_LABELS } from "../utils/format.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function DashboardPage() {
  const { user } = useAuth();
  const { currency } = useCurrency();
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

  const wonAmount = formatPrimary(summary.wonAmount, currency);
  const maxStageCount = Math.max(1, ...summary.byStage.map((s) => s.count));

  return (
    <div>
      <PageHeader title={`Здравствуйте, ${user?.fullName?.split(" ")[0] || ""}`} subtitle="Обзор работы отдела продаж" />

      <div className="grid grid-cols-1 gap-4 px-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BuildingIcon} label="Квартир в продаже" value={summary.propertiesAvailable} />
        <StatCard icon={DealIcon} label="Активных сделок" value={summary.dealsOpen} />
        <StatCard dark icon={CoinIcon} label={`Продажи (${currency})`} big={wonAmount.main} sub={wonAmount.secondary} trend={`Закрыто сделок: ${summary.dealsWon}`} />
        <StatCard accent icon={UsersIcon} label="Клиентов в базе" value={summary.clientsCount} sub="Всего в работе" />
      </div>

      <div className="grid grid-cols-1 gap-6 px-8 py-8 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">Воронка продаж</h2>
            <span className="text-xs font-medium text-ink-faint">Открытые сделки по этапам</span>
          </div>
          <div className="space-y-4">
            {summary.byStage.map((s) => {
              const amt = formatPrimary(s.amount, currency);
              return (
                <div key={s.stage}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">{DEAL_STAGE_LABELS[s.stage]}</span>
                    <span className="text-ink-faint">
                      {s.count} · {amt.main}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${Math.max(4, (s.count / maxStageCount) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {summary.byStage.length === 0 && (
              <p className="py-8 text-center text-sm text-ink-faint">Открытых сделок пока нет</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-ink">Курс валют</h2>
          <div className="rounded-xl bg-bg p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-ink-faint">1 USD =</div>
            <div className="mt-1 font-display text-2xl font-extrabold text-ink">{summary.exchangeRate} KGS</div>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <Row label="Активных сделок" value={summary.dealsOpen} />
            <Row label="Успешно закрыто" value={summary.dealsWon} />
            <Row label="Отказов" value={summary.dealsLost} />
          </div>
        </Card>
      </div>

      {managerStats && (
        <div className="px-8 pb-8">
          <h2 className="mb-3 font-display text-lg font-bold text-ink">Показатели по менеджерам</h2>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-faint">
                  <th className="px-5 py-3 font-medium">Менеджер</th>
                  <th className="px-5 py-3 font-medium">Клиенты</th>
                  <th className="px-5 py-3 font-medium">Активные сделки</th>
                  <th className="px-5 py-3 font-medium">Закрыто</th>
                  <th className="px-5 py-3 font-medium">Сумма продаж</th>
                </tr>
              </thead>
              <tbody>
                {managerStats.map((m) => {
                  const amt = formatPrimary(m.wonAmount, currency);
                  return (
                    <tr key={m.manager.id} className="border-b border-line last:border-0">
                      <td className="px-5 py-3.5 font-medium text-ink">{m.manager.fullName}</td>
                      <td className="px-5 py-3.5 text-ink-soft">{m.clientsCount}</td>
                      <td className="px-5 py-3.5 text-ink-soft">{m.dealsOpen}</td>
                      <td className="px-5 py-3.5 text-ink-soft">{m.dealsWon}</td>
                      <td className="px-5 py-3.5 font-medium text-ink">{amt.main}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-soft">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, big, sub, trend, dark, accent }) {
  const base = dark ? "bg-navy text-white" : accent ? "bg-accent text-white" : "bg-surface text-ink";
  return (
    <Card className={`border-0 p-5 ${base}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold uppercase tracking-wide ${dark || accent ? "text-white/70" : "text-ink-faint"}`}>
          {label}
        </span>
        <Icon className={`h-5 w-5 ${dark || accent ? "text-white/80" : "text-ink-faint"}`} />
      </div>
      <div className="mt-3 font-display text-3xl font-extrabold">{big ?? value}</div>
      {sub && <div className={`mt-1 text-xs ${dark || accent ? "text-white/70" : "text-ink-faint"}`}>{sub}</div>}
      {trend && <div className={`mt-1 text-xs ${dark || accent ? "text-white/70" : "text-success"}`}>{trend}</div>}
    </Card>
  );
}

function BuildingIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <rect x="4" y="2.5" width="9" height="15" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13 8.5h2.5v9H13" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function DealIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <path d="M3 4h14l-5.5 6.5V16l-3 1.5v-7L3 4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function CoinIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 6.5v7M8 8.2c0-.9.9-1.5 2-1.5s2 .6 2 1.4c0 2-4 1-4 3 0 .8.9 1.4 2 1.4s2-.6 2-1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function UsersIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <circle cx="7.5" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2.5 16c.5-3 2.5-4.5 5-4.5s4.5 1.5 5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="14.5" cy="7" r="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13 11.8c2 .2 3.5 1.6 4 3.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
