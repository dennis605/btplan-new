import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '⊞' },
  { to: '/calendar', label: 'Wochenplan', icon: '▦' },
  { to: '/dayview', label: 'Durchführung', icon: '✓' },
  { to: '/daylist', label: 'Tagesübersicht', icon: '≡' },
  { to: '/search', label: 'Suche', icon: '⌕' },
  { to: '/reports', label: 'Berichte', icon: '⬡' },
];

const adminItems = [
  { to: '/residents', label: 'Bewohner', icon: '' },
  { to: '/activities', label: 'Aktivitäten', icon: '' },
  { to: '/staff', label: 'Mitarbeiter', icon: '' },
];

export function Sidebar() {
  return (
    <aside className="sidebar no-print">
      <div className="sidebar-header">
        <div className="logo-mark">BT</div>
        <div>
          <h2>BT-Plan</h2>
          <span className="sidebar-subtitle">Betreuungsplanung</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <div className="nav-section-label">Planung</div>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="nav-divider" />
        <div className="nav-section-label">Stammdaten</div>
        {adminItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
          >
            <span className="nav-icon nav-dot">·</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <div className="user-info">
          <span className="user-avatar">SD</span>
          <div className="user-details">
            <span className="user-name">Sozialer Dienst</span>
            <span className="user-role">Einrichtung Musterheim</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
