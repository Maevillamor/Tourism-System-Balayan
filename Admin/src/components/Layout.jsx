import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import Logo from './Logo.jsx';

const NAV = [
  { to: '/appointments', label: 'Requests', roles: ['Admin', 'Staff'] },
  { to: '/schedule', label: 'Schedule', roles: ['Admin', 'Staff'] },
  { to: '/services', label: 'Services & availability', roles: ['Admin'], pill: 'ADMIN' },
];

const ROLE_LABEL = { Admin: 'Office Admin', Staff: 'Office Staff' };

export default function Layout() {
  const { admin, logout } = useAuth();
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Logo size={36} />
          <div>
            <strong>Visit Balayan</strong>
            <span>Admin portal</span>
          </div>
        </div>

        <nav aria-label="Staff navigation">
          {NAV.filter((n) => n.roles.includes(admin.role)).map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              <span>{n.label}</span>
              {n.pill && <em className="pill">{n.pill}</em>}
            </NavLink>
          ))}
        </nav>

        <div className="who">
          <b>{admin.fullName || admin.name}</b>
          <span>{ROLE_LABEL[admin.role] || admin.role}</span>
          <button type="button" className="linklike" onClick={logout}>Sign out</button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
