import { NavLink } from 'react-router-dom';
import electronLogo from '../assets/electron.svg';
import './Sidebar.css';

export function Sidebar() {
  return (
    <aside className="sidebar no-print">
      <div className="sidebar-header">
        <img src={electronLogo} alt="Logo" className="logo" />
        <h2>BT-Plan</h2>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          📋 Dashboard
        </NavLink>
        <NavLink to="/search" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          🔍 Suche
        </NavLink>
        <NavLink to="/daylist" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          📑 Tagesübersicht
        </NavLink>
        <NavLink to="/calendar" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          📅 Wochenplan
        </NavLink>
        <NavLink to="/dayview" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          ✅ Durchführung
        </NavLink>
        <NavLink to="/reports" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          📄 Berichte
        </NavLink>
        <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.05)', margin: '4px 0' }} />
        <NavLink to="/residents" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          👥 Bewohner
        </NavLink>
        <NavLink to="/activities" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          🎯 Aktivitäten
        </NavLink>
        <NavLink to="/staff" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          👨‍⚕️ Mitarbeiter
        </NavLink>
      </nav>
      
      <div className="sidebar-footer">
        <div className="user-info">
          <span className="user-avatar">SD</span>
          <div className="user-details">
            <span className="user-name">Sozialer Dienst</span>
            <span className="user-role">Administrator</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
