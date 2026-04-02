import React, { useState, useCallback } from 'react';
import {
  useLocalStorage,
  createInitialInputData,
  createInitialLinePhases,
  createInitialTaskData,
} from './hooks/useStorage';
import { COLORS, CHANNEL_CONFIGS } from './data/constants';
import OverviewDashboard from './components/OverviewDashboard';
import ChannelDashboard from './components/ChannelDashboard';
import LineDashboard from './components/LineDashboard';
import ActionManagement from './components/ActionManagement';

const TABS = [
  { id: 'overview', label: '🏠 全体概要' },
  { id: 'instagram', label: '📸 Instagram' },
  { id: 'youtube', label: '▶️ YouTube' },
  { id: 'threads', label: '🧵 Threads' },
  { id: 'jv', label: '🤝 JV' },
  { id: 'line', label: '💬 LINE' },
  { id: 'actions', label: '✅ 行動管理' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [inputData, setInputData] = useLocalStorage('buzzlab_input_v2', createInitialInputData());
  const [linePhases, setLinePhases] = useLocalStorage('buzzlab_line_phases', createInitialLinePhases());
  const [taskData, setTaskData] = useLocalStorage('buzzlab_tasks', createInitialTaskData());

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

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F7FA',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    }}>
      {/* Top Nav */}
      <header style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32,
              background: `linear-gradient(135deg, ${COLORS.navy}, ${COLORS.darkBlue})`,
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>🚀</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.navy, lineHeight: 1 }}>BuzzLab KPI</div>
              <div style={{ fontSize: 10, color: '#888', lineHeight: 1 }}>2026 ロードマップ</div>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <button
            onClick={handleReset}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: '1px solid #e0e0e0',
              background: '#fff',
              color: '#888',
              fontSize: 11,
              cursor: 'pointer',
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            🔄 リセット
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px 48px' }}>
        {activeTab === 'overview' && (
          <OverviewDashboard inputData={inputData} />
        )}
        {['instagram', 'youtube', 'threads', 'jv'].includes(activeTab) && (
          <ChannelDashboard
            channel={activeTab}
            inputData={inputData}
            onUpdate={handleUpdate}
          />
        )}
        {activeTab === 'line' && (
          <LineDashboard
            inputData={inputData}
            linePhases={linePhases}
            onUpdate={handleUpdate}
            onPhaseUpdate={handlePhaseUpdate}
          />
        )}
        {activeTab === 'actions' && (
          <ActionManagement
            taskData={taskData}
            onUpdate={handleTaskUpdate}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '16px',
        fontSize: 11,
        color: '#aaa',
        borderTop: '1px solid #eee',
        background: '#fff',
      }}>
        BuzzLab KPI Dashboard 2026 — データはブラウザのローカルストレージに保存されます
      </footer>
    </div>
  );
}
