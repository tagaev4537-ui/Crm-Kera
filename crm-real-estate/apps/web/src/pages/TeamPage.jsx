import { useEffect, useState } from "react";
import { api, extractErrorMessage } from "../api/client.js";
import { PageHeader } from "../components/PageHeader.jsx";
import { Button, Card, Input, Select, Modal, Spinner, Badge } from "../components/ui.jsx";
import { ROLE_LABELS, formatDate } from "../utils/format.js";

export default function TeamPage() {
  const [users, setUsers] = useState([]);
  const [rate, setRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newUserModal, setNewUserModal] = useState(false);
  const [rateModal, setRateModal] = useState(false);
  const [tempPasswordInfo, setTempPasswordInfo] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [{ data: usersData }, { data: rateData }] = await Promise.all([
        api.get("/users"),
        api.get("/exchange-rate"),
      ]);
      setUsers(usersData.users);
      setRate(rateData.usdToKgs);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(user) {
    try {
      await api.patch(`/users/${user.id}`, { isActive: !user.isActive });
      load();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  async function resetPassword(user) {
    if (!confirm(`Сбросить пароль для ${user.fullName}? Будет выдан временный пароль.`)) return;
    try {
      const { data } = await api.post(`/users/${user.id}/reset-password`);
      setTempPasswordInfo({ user, password: data.temporaryPassword });
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Команда"
        subtitle="Управление сотрудниками и курсом валют"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setRateModal(true)}>
              Курс: 1$ = {rate} сом
            </Button>
            <Button variant="accent" onClick={() => setNewUserModal(true)}>
              + Сотрудник
            </Button>
          </div>
        }
      />

      <div className="p-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-faint">
                  <th className="px-4 py-3 font-medium">Сотрудник</th>
                  <th className="px-4 py-3 font-medium">Логин</th>
                  <th className="px-4 py-3 font-medium">Роль</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium">Последний вход</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{u.fullName}</td>
                    <td className="px-4 py-3 text-ink-soft">{u.username}</td>
                    <td className="px-4 py-3 text-ink-soft">{ROLE_LABELS[u.role]}</td>
                    <td className="px-4 py-3">
                      <Badge tone={u.isActive ? "success" : "danger"}>{u.isActive ? "Активен" : "Отключен"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-faint">{u.lastLoginAt ? formatDate(u.lastLoginAt) : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => resetPassword(u)}>
                          Сбросить пароль
                        </Button>
                        <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => toggleActive(u)}>
                          {u.isActive ? "Отключить" : "Включить"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      <NewUserModal open={newUserModal} onClose={() => setNewUserModal(false)} onCreated={load} />
      <RateModal open={rateModal} onClose={() => setRateModal(false)} onSaved={load} currentRate={rate} />

      <Modal open={!!tempPasswordInfo} onClose={() => setTempPasswordInfo(null)} title="Временный пароль">
        {tempPasswordInfo && (
          <div>
            <p className="text-sm text-ink-soft">
              Передайте этот пароль сотруднику <strong>{tempPasswordInfo.user.fullName}</strong> лично. При входе
              потребуется сразу его сменить.
            </p>
            <div className="mt-3 rounded-lg bg-bg px-4 py-3 text-center font-mono text-lg font-bold tracking-wider text-ink">
              {tempPasswordInfo.password}
            </div>
            <Button className="mt-4 w-full" variant="accent" onClick={() => setTempPasswordInfo(null)}>
              Готово
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function NewUserModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ fullName: "", username: "", password: "", role: "MANAGER", phone: "" });
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
      await api.post("/auth/users", form);
      setForm({ fullName: "", username: "", password: "", role: "MANAGER", phone: "" });
      onClose();
      onCreated();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Новый сотрудник">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input label="Полное имя" required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
        <Input
          label="Логин"
          required
          value={form.username}
          onChange={(e) => set("username", e.target.value)}
          placeholder="4-32 символа: латиница, цифры, . _ -"
        />
        <Input
          label="Пароль"
          required
          type="text"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          placeholder="Мин. 10 симв., A-Z, a-z, 0-9, спецсимвол"
        />
        <p className="-mt-2 text-xs text-ink-faint">
          Пароль: минимум 10 символов, заглавная и строчная буквы, цифра и спецсимвол (!@#$%^&*)
        </p>
        <Select label="Роль" value={form.role} onChange={(e) => set("role", e.target.value)}>
          <option value="MANAGER">Менеджер</option>
          <option value="ADMIN">Администратор</option>
        </Select>
        <Input label="Телефон" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
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

function RateModal({ open, onClose, onSaved, currentRate }) {
  const [value, setValue] = useState(currentRate || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(currentRate || "");
  }, [currentRate, open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/exchange-rate", { usdToKgs: value });
      onClose();
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Изменить курс USD → KGS">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input label="1 USD = ... KGS" required type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
        {error && <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Отмена
          </Button>
          <Button variant="accent" type="submit" disabled={saving}>
            {saving ? <Spinner className="h-4 w-4 text-white" /> : "Сохранить"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
