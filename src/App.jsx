import React, { useState, useCallback } from 'react';
import {
  LayoutDashboard, Handshake,
  CheckSquare, RotateCcw, Menu, X, ChevronRight
} from 'lucide-react';
import { FaInstagram, FaYoutube, FaThreads, FaLine } from 'react-icons/fa6';
import {
  useLocalStorage, createInitialInputData,
  createInitialLinePhases, createInitialTaskData,
} from './hooks/useStorage';
import { useBreakpoint } from './hooks/useBreakpoint';
import { G } from './styles/theme';
import { CHANNEL_CONFIGS } from './data/constants';
import OverviewDashboard from './components/OverviewDashboard';
import ChannelDashboard from './components/ChannelDashboard';
import LineDashboard from './components/LineDashboard';
import ActionManagement from './components/ActionManagement';

const NAV_ITEMS = [
  { id: 'overview',   label: '全体概要',    icon: LayoutDashboard, color: G.primary },
  { id: 'instagram',  label: 'Instagram',   icon: FaInstagram,     color: '#833AB4' },
  { id: 'youtube',    label: 'YouTube',     icon: FaYoutube,       color: '#ff0000' },
  { id: 'threads',    label: 'Threads',     icon: FaThreads,       color: '#444444' },
  { id: 'jv',         label: 'JV',          icon: Handshake,       color: '#0066cc' },
  { id: 'line',       label: 'LINE',        icon: FaLine,          color: '#06C755' },
  { id: 'actions',    label: '行動管理',    icon: CheckSquare,     color: '#e37400' },
];

// ── Sidebar (desktop) ─────────────────────────────────────────────────────
function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed }) {
  return (
    <aside style={{
      width: collapsed ? 72 : G.sidebarWidth,
      minHeight: '100vh',
      background: G.surface,
      borderRight: `1px solid ${G.border}`,
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      zIndex: 50,
      transition: `width 0.25s cubic-bezier(0.2,0,0,1)`,
      overflow: 'hidden',
    }}>
      {/* Logo Area */}
      <div style={{
        height: G.topBarH,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
        borderBottom: `1px solid ${G.border}`,
        flexShrink: 0,
      }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            width: 40, height: 40,
            border: 'none', background: 'transparent',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: G.text2, flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.background = G.surfaceVariant}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Menu size={20} />
        </button>
        {!collapsed && (
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: G.text1, lineHeight: 1.2 }}>BuzzLab</div>
            <div style={{ fontSize: 11, color: G.text3, lineHeight: 1 }}>KPI Dashboard 2026</div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '8px 8px', overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon, color }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              title={collapsed ? label : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '10px 16px' : '10px 12px',
                border: 'none',
                borderRadius: G.radiusPill,
                background: isActive ? (color + '18') : 'transparent',
                color: isActive ? color : G.text2,
                fontWeight: isActive ? 700 : 400,
                fontSize: 14,
                marginBottom: 2,
                textAlign: 'left',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = G.surfaceVariant; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={20} style={{ flexShrink: 0, color: isActive ? color : G.text2 }} />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${G.border}`, fontSize: 11, color: G.text3 }}>
          データはブラウザに保存されます
        </div>
      )}
    </aside>
  );
}

// ── Bottom Nav (mobile) ───────────────────────────────────────────────────
function BottomNav({ activeTab, setActiveTab }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: G.bottomNavH,
      background: G.surface,
      borderTop: `1px solid ${G.border}`,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 200,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {NAV_ITEMS.map(({ id, label, icon: Icon, color }) => {
        const isActive = activeTab === id;
        const shortLabel = {
          overview: '概要', instagram: 'IG', youtube: 'YT',
          threads: 'TH', jv: 'JV', line: 'LINE', actions: '行動',
        }[id];
        return (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              flex: 1, border: 'none', background: 'transparent',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 3, padding: '4px 2px',
              color: isActive ? color : G.text3,
              position: 'relative',
            }}
          >
            {isActive && (
              <div style={{
                position: 'absolute', top: 0,
                left: '15%', right: '15%',
                height: 3, borderRadius: '0 0 3px 3px',
                background: color,
              }} />
            )}
            <div style={{
              background: isActive ? (color + '18') : 'transparent',
              borderRadius: G.radiusPill,
              padding: '4px 12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={20} />
            </div>
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, lineHeight: 1 }}>{shortLabel}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ── Top App Bar ───────────────────────────────────────────────────────────
function TopBar({ activeTab, onReset, sidebarWidth, isMobile }) {
  const item = NAV_ITEMS.find(n => n.id === activeTab);
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: isMobile ? 0 : sidebarWidth,
      right: 0,
      height: G.topBarH,
      background: G.surface,
      borderBottom: `1px solid ${G.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 40,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isMobile && (
          <div style={{ fontSize: 22, lineHeight: 1 }}>🚀</div>
        )}
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: G.text1, lineHeight: 1 }}>
            {item?.label}
          </h1>
          {!isMobile && (
            <p style={{ fontSize: 12, color: G.text3, lineHeight: 1.2 }}>
              BuzzLab 2026 ロードマップ
            </p>
          )}
        </div>
      </div>

      <button
        onClick={onReset}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px',
          border: `1px solid ${G.border}`,
          borderRadius: G.radiusPill,
          background: G.surface,
          color: G.text2,
          fontSize: 13,
          fontWeight: 500,
        }}
        onMouseEnter={e => e.currentTarget.style.background = G.surfaceVariant}
        onMouseLeave={e => e.currentTarget.style.background = G.surface}
      >
        <RotateCcw size={14} />
        {!isMobile && 'リセット'}
      </button>
    </div>
  );
}

// ── App Root ──────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [inputData, setInputData]   = useLocalStorage('buzzlab_input_v2', createInitialInputData());
  const [linePhases, setLinePhases] = useLocalStorage('buzzlab_line_phases', createInitialLinePhases());
  const [taskData, setTaskData]     = useLocalStorage('buzzlab_tasks', createInitialTaskData());
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  const handleUpdate = useCallback((month, channel, field, value) => {
    setInputData(prev => ({
      ...prev,
      [month]: {
        ...prev[month],
        [channel]: { ...(prev[month]?.[channel] || {}), [field]: value === '' ? 0 : Number(value) },
      },
    }));
  }, [setInputData]);

  const handlePhaseUpdate = useCallback((phase, field, value) => {
    setLinePhases(prev => ({ ...prev, [phase]: { ...(prev[phase] || {}), [field]: value } }));
  }, [setLinePhases]);

  const handleTaskUpdate = useCallback((month, channel, week, value) => {
    setTaskData(prev => ({
      ...prev,
      [month]: { ...prev[month], [channel]: { ...(prev[month]?.[channel] || {}), [week]: value } },
    }));
  }, [setTaskData]);

  const handleReset = () => {
    if (window.confirm('全データをリセットしますか？この操作は元に戻せません。')) {
      setInputData(createInitialInputData());
      setLinePhases(createInitialLinePhases());
      setTaskData(createInitialTaskData());
    }
  };

  const effectiveSidebarWidth = isDesktop
    ? (sidebarCollapsed ? G.railWidth : G.sidebarWidth)
    : isTablet
      ? G.railWidth
      : 0;

  return (
    <div style={{ minHeight: '100vh', background: G.bg }}>
      {/* Sidebar */}
      {!isMobile && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={isTablet || sidebarCollapsed}
          setCollapsed={isDesktop ? setSidebarCollapsed : () => {}}
        />
      )}

      {/* Top App Bar */}
      <TopBar
        activeTab={activeTab}
        onReset={handleReset}
        sidebarWidth={effectiveSidebarWidth}
        isMobile={isMobile}
      />

      {/* Main content */}
      <main style={{
        marginLeft: isMobile ? 0 : effectiveSidebarWidth,
        marginTop: G.topBarH,
        paddingBottom: isMobile ? G.bottomNavH + 16 : 48,
        padding: `${G.topBarH}px ${isMobile ? 12 : 24}px ${isMobile ? G.bottomNavH + 16 : 48}px ${isMobile ? 12 : 24}px`,
        marginLeft: isMobile ? 0 : effectiveSidebarWidth,
        minHeight: `calc(100vh - ${G.topBarH}px)`,
        transition: `margin-left 0.25s cubic-bezier(0.2,0,0,1)`,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', paddingTop: 24 }}>
          {activeTab === 'overview'   && <OverviewDashboard inputData={inputData} />}
          {['instagram','youtube','threads','jv'].includes(activeTab) && (
            <ChannelDashboard channel={activeTab} inputData={inputData} onUpdate={handleUpdate} />
          )}
          {activeTab === 'line'    && <LineDashboard inputData={inputData} linePhases={linePhases} onUpdate={handleUpdate} onPhaseUpdate={handlePhaseUpdate} />}
          {activeTab === 'actions' && <ActionManagement taskData={taskData} onUpdate={handleTaskUpdate} />}
        </div>
      </main>

      {/* Bottom Nav (mobile) */}
      {isMobile && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  );
}
