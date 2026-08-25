import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ROLE_LABELS } from "../utils/format.js";

const NAV_ITEMS = [
  { to: "/", label: "Обзор", icon: GridIcon, end: true },
  { to: "/deals", label: "Сделки", icon: FunnelIcon },
  { to: "/clients", label: "Клиенты", icon: UsersIcon },
  { to: "/properties", label: "Квартиры", icon: BuildingIcon },
];

const ADMIN_NAV_ITEMS = [{ to: "/team", label: "Команда", icon: TeamIcon }];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const items = user?.role === "ADMIN" ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS;

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-ink text-white">
        <div className="flex items-center gap-2.5 px-6 py-6">
          <LogoMark />
          <div>
            <div className="font-display text-base font-extrabold leading-none">КварталCRM</div>
            <div className="mt-1 text-[11px] uppercase tracking-wider text-white/40">Продажа квартир</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          <div className="mb-2 px-3">
            <div className="truncate text-sm font-semibold">{user?.fullName}</div>
            <div className="text-xs text-white/40">{ROLE_LABELS[user?.role] || user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogoutIcon className="h-4.5 w-4.5" />
            Выйти
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}

function LogoMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
      <rect width="34" height="34" rx="9" fill="#C98A3E" />
      <rect x="8" y="16" width="5" height="10" fill="white" />
      <rect x="14.5" y="11" width="5" height="15" fill="white" />
      <rect x="21" y="7" width="5" height="19" fill="white" />
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

function FunnelIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <path d="M3 4h14l-5.5 6.5V16l-3 1.5v-7L3 4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
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
