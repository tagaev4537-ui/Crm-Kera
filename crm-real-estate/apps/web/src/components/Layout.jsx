import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCurrency } from "../context/CurrencyContext.jsx";
import { Avatar } from "./ui.jsx";
import { ROLE_LABELS } from "../utils/format.js";

const NAV_ITEMS = [
  { to: "/", label: "Дашборд", icon: GridIcon, end: true },
  { to: "/properties", label: "Квартиры", icon: BuildingIcon },
  { to: "/clients", label: "Клиенты", icon: UsersIcon },
  { to: "/deals", label: "Сделки", icon: DealIcon },
  { to: "/deals/list", label: "Отчёты", icon: ReportIcon },
];

const ADMIN_NAV_ITEMS = [{ to: "/team", label: "Команда", icon: TeamIcon }];

export default function Layout() {
  const { user, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const items = user?.role === "ADMIN" ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS;

  return (
    <div className="flex h-screen bg-bg">
      <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-surface">
        <div className="flex items-center gap-2.5 px-6 py-6">
          <LogoMark />
          <div className="font-display text-lg font-extrabold leading-none text-ink">КварталCRM</div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-accent-soft text-ink" : "text-ink-soft hover:bg-bg hover:text-ink"
                }`
              }
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line px-3 py-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-bg hover:text-ink"
          >
            <LogoutIcon className="h-[18px] w-[18px]" />
            Выйти
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-4 border-b border-line bg-surface px-8 py-4">
          <div className="relative max-w-md flex-1">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              placeholder="Поиск квартир, клиентов, адресов..."
              className="w-full rounded-lg border border-line bg-bg py-2.5 pl-10 pr-3 text-sm text-ink placeholder:text-ink-faint focus-ring"
              readOnly
            />
          </div>

          <div className="ml-auto flex items-center gap-4">
            <div className="flex rounded-lg border border-line bg-bg p-0.5 text-sm font-semibold">
              <button
                onClick={() => setCurrency("KGS")}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  currency === "KGS" ? "bg-surface text-ink shadow-sm" : "text-ink-faint"
                }`}
              >
                KGS
              </button>
              <button
                onClick={() => setCurrency("USD")}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  currency === "USD" ? "bg-surface text-ink shadow-sm" : "text-ink-faint"
                }`}
              >
                USD
              </button>
            </div>

            <div className="h-8 w-px bg-line" />

            <div className="flex items-center gap-2.5">
              <div className="text-right leading-tight">
                <div className="text-sm font-semibold text-ink">{user?.fullName}</div>
                <div className="text-xs text-ink-faint">{ROLE_LABELS[user?.role] || user?.role}</div>
              </div>
              <Avatar name={user?.fullName} size={38} />
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function LogoMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 34 34" fill="none">
      <rect width="34" height="34" rx="9" fill="#E3A335" />
      <rect x="8" y="16" width="5" height="10" fill="white" />
      <rect x="14.5" y="11" width="5" height="15" fill="white" />
      <rect x="21" y="7" width="5" height="19" fill="white" />
    </svg>
  );
}

function SearchIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M17 17l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function GridIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <rect x="3" y="3" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11" y="3" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="11" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11" y="11" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
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

function ReportIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <path d="M4 16V9M10 16V4M16 16v-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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

function BuildingIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <rect x="4" y="2.5" width="9" height="15" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.5 6h1.2M6.5 9h1.2M6.5 12h1.2M10.3 6h1.2M10.3 9h1.2M10.3 12h1.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M13 8.5h2.5v9H13" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function TeamIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <circle cx="10" cy="6" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 17c1-4 3.3-6 6.5-6s5.5 2 6.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function LogoutIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <path d="M8 3H4.5a1 1 0 00-1 1v12a1 1 0 001 1H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M13 13l4-3-4-3M17 10H7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
