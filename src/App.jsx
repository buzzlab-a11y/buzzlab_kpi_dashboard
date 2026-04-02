import React, { useState, useCallback } from 'react';
import {
  useLocalStorage,
  createInitialInputData,
  createInitialLinePhases,
  createInitialTaskData,
} from './hooks/useStorage';
import { useBreakpoint } from './hooks/useBreakpoint';
import { COLORS, CHANNEL_CONFIGS } from './data/constants';
import OverviewDashboard from './components/OverviewDashboard';
import ChannelDashboard from './components/ChannelDashboard';
import LineDashboard from './components/LineDashboard';
import ActionManagement from './components/ActionManagement';

const TABS = [
  { id: 'overview', label: '全体概要', icon: '🏠' },
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'youtube', label: 'YouTube', icon: '▶️' },
  { id: 'threads', label: 'Threads', icon: '🧵' },
  { id: 'jv', label: 'JV', icon: '🤝' },
  { id: 'line', label: 'LINE', icon: '💬' },
  { id: 'actions', label: '行動管理', icon: '✅' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [inputData, setInputData] = useLocalStorage('buzzlab_input_v2', createInitialInputData());
  const [linePhases, setLinePhases] = useLocalStorage('buzzlab_line_phases', createInitialLinePhases());
  const [taskData, setTaskData] = useLocalStorage('buzzlab_tasks', createInitialTaskData());
  const { isMobile, isTablet } = useBreakpoint();

  const handleUpdate = useCallback((month, channel, field, value) => {
    setInputData(prev => ({
      ...prev,
      [month]: {
        ...prev[month],
        [channel]: {
          ...(prev[month]?.[channel] || {}),
          [field]: value === '' ? 0 : Number(value),
        },
      },
    }));
  }, [setInputData]);

  const handlePhaseUpdate = useCallback((phase, field, value) => {
    setLinePhases(prev => ({
      ...prev,
      [phase]: {
        ...(prev[phase] || {}),
        [field]: value,
      },
    }));
  }, [setLinePhases]);

  const handleTaskUpdate = useCallback((month, channel, week, value) => {
    setTaskData(prev => ({
      ...prev,
      [month]: {
        ...prev[month],
        [channel]: {
          ...(prev[month]?.[channel] || {}),
          [week]: value,
        },
      },
    }));
  }, [setTaskData]);

  const handleReset = () => {
    if (window.confirm('全データをリセットしますか？この操作は元に戻せません。')) {
      setInputData(createInitialInputData());
      setLinePhases(createInitialLinePhases());
      setTaskData(createInitialTaskData());
    }
  };

  // モバイルはボトムナビ、デスクトップはトップナビ
  const showBottomNav = isMobile || isTablet;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F7FA',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
      paddingBottom: showBottomNav ? 72 : 0,
    }}>
      {/* Top Header */}
      <header style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: isMobile ? '0 16px' : '0 24px',
      }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          height: isMobile ? 50 : 56,
          gap: 12,
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{
              width: 30, height: 30,
              background: `linear-gradient(135deg, ${COLORS.navy}, ${COLORS.darkBlue})`,
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14,
            }}>🚀</div>
            <div>
              <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 800, color: COLORS.navy, lineHeight: 1 }}>BuzzLab KPI</div>
              {!isMobile && <div style={{ fontSize: 10, color: '#888', lineHeight: 1 }}>2026 ロードマップ</div>}
            </div>
          </div>

          {/* Desktop Nav Tabs */}
          {!showBottomNav && (
            <nav style={{ display: 'flex', gap: 2, overflow: 'auto' }}>
              {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                const channelColor = CHANNEL_CONFIGS[tab.id]?.color;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      border: 'none',
                      background: isActive ? (channelColor || COLORS.navy) : 'transparent',
                      color: isActive ? '#fff' : '#666',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tab.icon} {tab.label}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Tablet: active tab name */}
          {isTablet && (
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy }}>
              {TABS.find(t => t.id === activeTab)?.icon} {TABS.find(t => t.id === activeTab)?.label}
            </div>
          )}

          <button
            onClick={handleReset}
            style={{
              padding: isMobile ? '5px 10px' : '6px 14px',
              borderRadius: 20,
              border: '1px solid #e0e0e0',
              background: '#fff',
              color: '#888',
              fontSize: isMobile ? 10 : 11,
              cursor: 'pointer',
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            🔄 {isMobile ? '' : 'リセット'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: isMobile ? '16px 12px 24px' : isTablet ? '20px 16px 32px' : '24px 24px 48px',
      }}>
        {activeTab === 'overview' && <OverviewDashboard inputData={inputData} />}
        {['instagram', 'youtube', 'threads', 'jv'].includes(activeTab) && (
          <ChannelDashboard channel={activeTab} inputData={inputData} onUpdate={handleUpdate} />
        )}
        {activeTab === 'line' && (
          <LineDashboard inputData={inputData} linePhases={linePhases} onUpdate={handleUpdate} onPhaseUpdate={handlePhaseUpdate} />
        )}
        {activeTab === 'actions' && (
          <ActionManagement taskData={taskData} onUpdate={handleTaskUpdate} />
        )}
      </main>

      {/* Bottom Nav (Mobile & Tablet) */}
      {showBottomNav && (
        <nav style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'stretch',
          height: 64,
          zIndex: 200,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const channelColor = CHANNEL_CONFIGS[tab.id]?.color || COLORS.navy;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  cursor: 'pointer',
                  padding: '4px 2px',
                  color: isActive ? channelColor : '#aaa',
                  transition: 'color 0.2s',
                  position: 'relative',
                }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: 0, left: '20%', right: '20%',
                    height: 3,
                    background: channelColor,
                    borderRadius: '0 0 3px 3px',
                  }} />
                )}
                <div style={{ fontSize: isMobile ? 18 : 20 }}>{tab.icon}</div>
                <div style={{
                  fontSize: isMobile ? 9 : 10,
                  fontWeight: isActive ? 700 : 500,
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                  padding: '0 2px',
                }}>
                  {isMobile ? tab.label.replace('Instagram', 'IG').replace('YouTube', 'YT').replace('Threads', 'TH').replace('行動管理', '行動') : tab.label}
                </div>
              </button>
            );
          })}
        </nav>
      )}

      {/* Footer (desktop only) */}
      {!showBottomNav && (
        <footer style={{
          textAlign: 'center', padding: '16px',
          fontSize: 11, color: '#aaa',
          borderTop: '1px solid #eee', background: '#fff',
        }}>
          BuzzLab KPI Dashboard 2026 — データはブラウザのローカルストレージに保存されます
        </footer>
      )}
    </div>
  );
}
