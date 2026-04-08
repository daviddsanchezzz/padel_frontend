import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Medal, Trophy, GitMerge, User, SlidersHorizontal, LogOut,
  ChevronDown, ChevronUp,
  PanelLeftClose, PanelLeftOpen, Menu,
} from 'lucide-react';

// ── Nav item ─────────────────────────────────────────────────────────────────
// `exact`: match only when pathname+search match exactly
const NavItem = ({ to, icon: IconComp, label, collapsed, onClick, exact = false }) => {
  const location = useLocation();
  const current = location.pathname + location.search;
  const isActive = exact
    ? current === to
    : location.pathname === to.split('?')[0] && !location.search;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
        ${isActive
          ? 'bg-sidebar-active text-white'
          : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
        }`}
    >
      <span className="flex-shrink-0 w-[18px] flex items-center justify-center">
        <IconComp size={16} />
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
      {collapsed && (
        <span className="pointer-events-none absolute left-[58px] z-50 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
          {label}
        </span>
      )}
    </Link>
  );
};

const SectionLabel = ({ label, collapsed }) =>
  collapsed
    ? <div className="my-2 border-t border-sidebar-border" />
    : <p className="mt-4 mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-sidebar-label">{label}</p>;

// ── Layout ────────────────────────────────────────────────────────────────────
const AppLayout = ({ children, title, actions }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed]     = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const isOrganizer = user?.role === 'organizer';
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#0b1d12' }}>

      {/* Logo */}
      <div className={`flex items-center gap-3 py-5 border-b transition-all duration-200 ${collapsed ? 'justify-center px-3' : 'px-5'}`}
        style={{ borderColor: '#1c3325' }}>
        <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
          <Trophy size={15} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-[15px] leading-none tracking-tight">PádelLeague</p>
            <p className="text-sidebar-textDim text-[10px] font-medium mt-1">
              {isOrganizer ? 'Panel organizador' : 'Panel jugador'}
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {isOrganizer ? (
          <>
            <SectionLabel label="General" collapsed={collapsed} />
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard"
              collapsed={collapsed} onClick={() => setMobileOpen(false)} />

            <SectionLabel label="Competiciones" collapsed={collapsed} />
            <NavItem to="/dashboard?type=league"     icon={Medal}     label="Ligas"
              collapsed={collapsed} onClick={() => setMobileOpen(false)} exact />
            <NavItem to="/dashboard?type=tournament" icon={Trophy}    label="Torneos"
              collapsed={collapsed} onClick={() => setMobileOpen(false)} exact />
          </>
        ) : (
          <>
            <SectionLabel label="Menú" collapsed={collapsed} />
            <NavItem to="/player/matches" icon={User} label="Mis partidos" collapsed={collapsed} onClick={() => setMobileOpen(false)} />
            <NavItem to="/player/competitions" icon={Trophy} label="Mis competiciones" collapsed={collapsed} onClick={() => setMobileOpen(false)} />
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-2 space-y-0.5" style={{ borderTop: '1px solid #1c3325', paddingTop: '8px', marginTop: '4px' }}>

        {/* Settings */}
        <button className={`w-full relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group text-sidebar-text hover:bg-sidebar-hover hover:text-white ${collapsed ? 'justify-center' : ''}`}>
          <span className="flex-shrink-0 w-[18px] flex items-center justify-center">
            <SlidersHorizontal size={16} />
          </span>
          {!collapsed && <span>Configuración</span>}
          {collapsed && (
            <span className="pointer-events-none absolute left-[58px] z-50 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
              Configuración
            </span>
          )}
        </button>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          {profileOpen && (
            <div
              className="absolute z-50 rounded-xl overflow-hidden shadow-xl"
              style={{
                backgroundColor: '#13271a', border: '1px solid #1c3325',
                ...(collapsed
                  ? { bottom: 0, left: 'calc(100% + 8px)', width: 160 }
                  : { bottom: 'calc(100% + 6px)', left: 0, right: 0 }),
              }}
            >
              <button
                onClick={() => setProfileOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-colors"
              >
                <User size={14} /> Perfil
              </button>
              <div style={{ height: 1, backgroundColor: '#1c3325' }} />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-red-400 hover:bg-red-950/30"
              >
                <LogOut size={14} /> Cerrar sesión
              </button>
            </div>
          )}

          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-sidebar-hover group ${collapsed ? 'justify-center' : ''} ${profileOpen ? 'bg-sidebar-hover' : ''}`}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-sm"
              style={{ background: 'linear-gradient(135deg, #1e9e6a, #116644)' }}>
              {initials}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-white text-[13px] font-semibold leading-none truncate">{user?.name}</p>
                  <p className="text-sidebar-textDim text-[11px] truncate mt-0.5">{user?.email}</p>
                </div>
                {profileOpen ? <ChevronUp size={14} className="text-sidebar-text" /> : <ChevronDown size={14} className="text-sidebar-text" />}
              </>
            )}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`hidden md:flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors text-sidebar-textDim hover:text-sidebar-text hover:bg-sidebar-hover ${collapsed ? 'justify-center' : ''}`}
        >
          <span className="flex-shrink-0 w-[18px] flex items-center justify-center">
            {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          </span>
          {!collapsed && <span className="text-xs font-medium">Colapsar</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar desktop */}
      <aside
        className={`hidden md:block flex-shrink-0 transition-all duration-200 ${collapsed ? 'w-16' : 'w-56'}`}
        style={{ backgroundColor: '#0b1d12' }}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 md:hidden transform transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: '#0b1d12' }}
      >
        {sidebarContent}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-100 px-3 md:px-6 py-3 md:py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0" onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </button>
            {title && <h1 className="text-base md:text-lg font-bold text-gray-900 truncate">{title}</h1>}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">{actions}</div>
        </header>
        <main className="flex-1 overflow-y-auto p-3 md:p-6 pb-20 md:pb-6">{children}</main>

        {/* Bottom nav — mobile only */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-20">
          {isOrganizer ? (
            <>
              <Link to="/dashboard" className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-semibold transition-colors ${location.pathname === '/dashboard' && !location.search ? 'text-brand-600' : 'text-gray-400'}`}>
                <LayoutDashboard size={20} />
                <span>Inicio</span>
              </Link>
              <Link to="/dashboard?type=league" className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-semibold transition-colors ${location.search === '?type=league' ? 'text-brand-600' : 'text-gray-400'}`}>
                <Medal size={20} />
                <span>Ligas</span>
              </Link>
              <Link to="/dashboard?type=tournament" className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-semibold transition-colors ${location.search === '?type=tournament' ? 'text-brand-600' : 'text-gray-400'}`}>
                <Trophy size={20} />
                <span>Torneos</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/player/matches" className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-semibold transition-colors ${location.pathname === '/player/matches' || location.pathname === '/player' ? 'text-brand-600' : 'text-gray-400'}`}>
                <User size={20} />
                <span>Mis partidos</span>
              </Link>
              <Link to="/player/competitions" className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-semibold transition-colors ${location.pathname === '/player/competitions' ? 'text-brand-600' : 'text-gray-400'}`}>
                <Trophy size={20} />
                <span>Competiciones</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </div>
  );
};

export default AppLayout;
