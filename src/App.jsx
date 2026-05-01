import React, { useState } from 'react';
import { LayoutDashboard, CheckSquare, Menu } from 'lucide-react';
import { FaInstagram, FaYoutube, FaThreads } from 'react-icons/fa6';
import { useAppData } from './hooks/useAppData';
import { useBreakpoint } from './hooks/useBreakpoint';
import { G } from './styles/theme';
import OverviewDashboard from './components/OverviewDashboard';
import ChannelDashboard from './components/ChannelDashboard';
import ActionManagement from './components/ActionManagement';

const NAV_ITEMS = [
  { id: 'overview',   label: '全体概要',  icon: LayoutDashboard, color: G.primary  },
  { id: 'instagram',  label: 'Instagram', icon: FaInstagram,     color: '#833AB4'  },
  { id: 'threads',    label: 'Threads',   icon: FaThreads,       color: '#444444'  },
  { id: 'youtube',    label: 'YouTube',   icon: FaYoutube,       color: '#ff0000'  },
  { id: 'actions',    label: '行動管理',  icon: CheckSquare,     color: '#e37400'  },
];

const SAVE_LABEL = { idle: '✓ 同期済み', saving: '💾 保存中...', saved: '✓ 保存しました', error: '⚠ 保存エラー' };
const SAVE_COLOR = { idle: G.text3,      saving: G.warning,      saved: G.success,          error: G.error       };

// ── Sidebar (desktop) ────────────────────────────────────────────────────
function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed, saveStatus }) {
  return (
    <aside style={{
      width: collapsed ? G.railWidth : G.sidebarWidth,
      background: G.surface,
      borderRight: `1px solid ${G.border}`,
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
      transition: `width 0.25s cubic-bezier(0.2,0,0,1)`,
      overflow: 'hidden',
    }}>
      <div style={{
        height: G.topBarH, display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 16px', borderBottom: `1px solid ${G.border}`, flexShrink: 0,
      }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{ width: 40, height: 40, border: 'none', background: 'transparent', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: G.text2, flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.background = G.surfaceVariant}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        ><Menu size={20} /></button>
        {!collapsed && (
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: G.text1, lineHeight: 1.2 }}>BuzzLab</div>
            <div style={{ fontSize: 11, color: G.text3, lineHeight: 1 }}>KPI Dashboard 2026</div>
          </div>
        )}
      </div>

      <nav style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon, color }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              title={collapsed ? label : undefined}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: collapsed ? '10px 16px' : '10px 12px',
                border: 'none', borderRadius: G.radiusPill,
                background: isActive ? (color + '18') : 'transparent',
                color: isActive ? color : G.text2,
                fontWeight: isActive ? 700 : 400, fontSize: 14, marginBottom: 2,
                textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden',
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

      {!collapsed && (
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${G.border}`, fontSize: 11, color: SAVE_COLOR[saveStatus] ?? G.text3 }}>
          {SAVE_LABEL[saveStatus]}
        </div>
      )}
    </aside>
  );
}

// ── Bottom Nav (mobile) ──────────────────────────────────────────────────
function BottomNav({ activeTab, setActiveTab }) {
  const SHORT = { overview: '概要', instagram: 'IG', threads: 'TH', youtube: 'YT', actions: '行動' };
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: G.bottomNavH, background: G.surface, borderTop: `1px solid ${G.border}`,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      zIndex: 200, paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {NAV_ITEMS.map(({ id, icon: Icon, color }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{ flex: 1, border: 'none', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '4px 2px', color: isActive ? color : G.text3, position: 'relative' }}
          >
            {isActive && <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 3, borderRadius: '0 0 3px 3px', background: color }} />}
            <div style={{ background: isActive ? (color + '18') : 'transparent', borderRadius: G.radiusPill, padding: '4px 10px', display: 'flex', alignItems: 'center' }}>
              <Icon size={20} />
            </div>
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, lineHeight: 1 }}>{SHORT[id]}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ── Top App Bar ──────────────────────────────────────────────────────────
function TopBar({ activeTab, sidebarWidth, isMobile, saveStatus }) {
  const item = NAV_ITEMS.find(n => n.id === activeTab);
  return (
    <div style={{
      position: 'fixed', top: 0, left: isMobile ? 0 : sidebarWidth, right: 0,
      height: G.topBarH, background: G.surface, borderBottom: `1px solid ${G.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', zIndex: 40,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isMobile && <div style={{ fontSize: 22, lineHeight: 1 }}>🚀</div>}
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: G.text1, lineHeight: 1 }}>{item?.label}</h1>
          {!isMobile && <p style={{ fontSize: 12, color: G.text3, lineHeight: 1.2 }}>BuzzLab 2026 ロードマップ</p>}
        </div>
      </div>
      {saveStatus !== 'idle' && (
        <span style={{ fontSize: 12, color: SAVE_COLOR[saveStatus] ?? G.text3 }}>{SAVE_LABEL[saveStatus]}</span>
      )}
    </div>
  );
}

// ── Loading Screen ───────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', background: G.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 56, height: 56, borderRadius: G.radiusMd, background: `linear-gradient(135deg, ${G.primary}, #4285f4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🚀</div>
      <div style={{ fontSize: 15, color: G.text2 }}>データを読み込み中...</div>
    </div>
  );
}

// ── App Root ─────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab,        setActiveTab]        = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isMobile, isTablet, isDesktop }       = useBreakpoint();

  const {
    channelConfigs, roadmapData, channelAnnual,
    monthKpi, weeklyTaskDefs,
    inputData, taskData,
    loading, saveStatus,
    updateInput, updateTask,
  } = useAppData();

  const effectiveSidebarWidth = isDesktop
    ? (sidebarCollapsed ? G.railWidth : G.sidebarWidth)
    : isTablet ? G.railWidth : 0;

  if (loading || !channelConfigs || !roadmapData) return <LoadingScreen />;

  return (
    <div style={{ minHeight: '100vh', background: G.bg }}>
      {!isMobile && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={isTablet || sidebarCollapsed}
          setCollapsed={isDesktop ? setSidebarCollapsed : () => {}}
          saveStatus={saveStatus}
        />
      )}

      <TopBar
        activeTab={activeTab}
        sidebarWidth={effectiveSidebarWidth}
        isMobile={isMobile}
        saveStatus={saveStatus}
      />

      <main style={{
        marginLeft: isMobile ? 0 : effectiveSidebarWidth,
        padding: `${G.topBarH}px ${isMobile ? 12 : 24}px ${isMobile ? G.bottomNavH + 16 : 48}px`,
        minHeight: `calc(100vh - ${G.topBarH}px)`,
        transition: `margin-left 0.25s cubic-bezier(0.2,0,0,1)`,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', paddingTop: 24 }}>
          {activeTab === 'overview' && (
            <OverviewDashboard
              inputData={inputData}
              roadmapData={roadmapData}
              channelAnnual={channelAnnual}
              channelConfigs={channelConfigs}
            />
          )}
          {['instagram','threads','youtube'].includes(activeTab) && (
            <ChannelDashboard
              channel={activeTab}
              channelConfig={channelConfigs[activeTab]}
              roadmapData={roadmapData}
              monthKpi={monthKpi}
              inputData={inputData}
              onUpdate={updateInput}
            />
          )}
          {activeTab === 'actions' && (
            <ActionManagement
              channelConfigs={channelConfigs}
              weeklyTaskDefs={weeklyTaskDefs}
              monthKpi={monthKpi}
              taskData={taskData}
              onUpdate={updateTask}
            />
          )}
        </div>
      </main>

      {isMobile && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  );
}
