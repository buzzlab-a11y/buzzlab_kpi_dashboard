import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FaInstagram, FaYoutube, FaThreads, FaXTwitter } from 'react-icons/fa6';
import { MONTHS } from '../data/constants';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { G } from '../styles/theme';

const CHANNELS_ORDER = ['instagram','x','threads','youtube'];
const CHANNEL_ICONS  = { instagram: FaInstagram, x: FaXTwitter, threads: FaThreads, youtube: FaYoutube };

function getChannelTheme(channel) {
  const key = channel === 'instagram' ? 'ig' : channel === 'x' ? 'x' : channel === 'youtube' ? 'yt' : 'th';
  return G[key];
}

function Card({ children, style }) {
  return (
    <div style={{ background: G.surface, borderRadius: G.radiusLg, border: `1px solid ${G.border}`, boxShadow: G.shadow1, ...style }}>
      {children}
    </div>
  );
}

function WeekTaskInput({ value, onChange, placeholder, theme }) {
  return (
    <textarea
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      rows={2}
      style={{
        width: '100%', padding: '7px 10px', borderRadius: G.radius,
        border: `1.5px solid ${value ? theme.main : G.border}`,
        background: value ? theme.container : G.bg,
        fontSize: 12, resize: 'none', color: G.text1,
        outline: 'none', lineHeight: 1.4, transition: G.transition,
      }}
      onFocus={e => { e.target.style.borderColor = theme.main; e.target.style.boxShadow = `0 0 0 3px ${theme.main}22`; }}
      onBlur={e => { e.target.style.boxShadow = 'none'; }}
    />
  );
}

// weeklyTaskDefs: { instagram: ['第1週テキスト', ...], ... }
// channelConfigs: { instagram: { name, manager, ... }, ... }
function MobileMonthBlock({ month, taskData, onUpdate, channelConfigs, weeklyTaskDefs, monthKpi }) {
  const [open, setOpen] = useState(false);
  return (
    <Card style={{ overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', border: 'none', background: G.surface, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
      >
        <span style={{ fontWeight: 700, fontSize: 15, color: G.text1 }}>{month}</span>
        <ChevronDown size={18} color={G.text2} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div style={{ padding: '0 12px 12px', borderTop: `1px solid ${G.border}` }}>
          {CHANNELS_ORDER.map(ch => {
            const cfg   = channelConfigs?.[ch];
            const theme = getChannelTheme(ch);
            const tasks = weeklyTaskDefs?.[ch] || [];
            const kpi   = monthKpi?.[month]?.[ch] || '-';
            const stored = taskData?.[month]?.[ch] || {};
            if (!cfg) return null;
            return (
              <div key={ch} style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', marginBottom: 8, borderRadius: G.radiusMd, background: theme.container, borderLeft: `3px solid ${theme.main}` }}>
                  {React.createElement(CHANNEL_ICONS[ch], { size: 16, color: theme.main })}
                  <span style={{ fontWeight: 600, fontSize: 13, color: theme.main }}>{cfg.name}</span>
                  <span style={{ fontSize: 11, color: G.text3 }}>{cfg.manager}</span>
                </div>
                <div style={{ background: G.bg, borderRadius: G.radius, padding: '7px 12px', marginBottom: 8, fontSize: 11, color: G.text2, whiteSpace: 'pre-line', lineHeight: 1.5, border: `1px solid ${G.border}` }}>
                  <span style={{ fontWeight: 600, color: G.text3, fontSize: 10 }}>月間KPI: </span>{kpi}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[0,1,2,3].map(wi => {
                    const wk   = `w${wi + 1}`;
                    const hint = tasks[wi]?.split('\n')[0] || `第${wi + 1}週タスク`;
                    return (
                      <div key={wi}>
                        <div style={{ fontSize: 10, color: G.text3, marginBottom: 3 }}>
                          <span style={{ background: theme.container, color: theme.main, borderRadius: G.radiusPill, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>第{wi + 1}週</span>
                        </div>
                        <WeekTaskInput value={stored[wk]} onChange={e => onUpdate(month, ch, wk, e.target.value)} placeholder={hint} theme={theme} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default function ActionManagement({ channelConfigs, weeklyTaskDefs, monthKpi, taskData, onUpdate }) {
  const { isMobile, isTablet } = useBreakpoint();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 20 }}>
      {/* Header */}
      <Card style={{ padding: isMobile ? '20px' : '24px 28px', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${G.warning}, #f29900)` }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
          <div style={{ width: 48, height: 48, borderRadius: G.radiusMd, background: G.warningContainer, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>✅</div>
          <div>
            <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: G.text1 }}>行動管理シート</div>
            <div style={{ fontSize: 12, color: G.text2 }}>各担当者の月別・週次タスク管理 | ミーティングで確認</div>
          </div>
        </div>
      </Card>

      {/* Channel Legend */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {CHANNELS_ORDER.map(ch => {
          const cfg   = channelConfigs?.[ch];
          const theme = getChannelTheme(ch);
          if (!cfg) return null;
          return (
            <div key={ch} style={{ display: 'flex', alignItems: 'center', gap: 6, background: G.surface, borderRadius: G.radiusPill, padding: '5px 12px', border: `1.5px solid ${theme.main}40` }}>
              {React.createElement(CHANNEL_ICONS[ch], { size: 14, color: theme.main })}
              <span style={{ fontSize: isMobile ? 11 : 12, fontWeight: 600, color: G.text1 }}>{cfg.name}</span>
              {!isMobile && <span style={{ fontSize: 10, color: G.text3 }}>{cfg.manager}</span>}
            </div>
          );
        })}
      </div>

      {/* Mobile: accordion */}
      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MONTHS.map(month => (
            <MobileMonthBlock key={month} month={month} taskData={taskData} onUpdate={onUpdate}
              channelConfigs={channelConfigs} weeklyTaskDefs={weeklyTaskDefs} monthKpi={monthKpi} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {MONTHS.map(month => (
            <Card key={month} style={{ overflow: 'hidden' }}>
              <div style={{ padding: '11px 18px', borderBottom: `1px solid ${G.border}`, background: G.bg, fontWeight: 700, fontSize: 14, color: G.text1 }}>
                {month}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <div style={{ minWidth: isTablet ? 700 : 'auto' }}>
                  {CHANNELS_ORDER.map((ch, ci) => {
                    const cfg   = channelConfigs?.[ch];
                    const theme = getChannelTheme(ch);
                    const tasks = weeklyTaskDefs?.[ch] || [];
                    const kpi   = monthKpi?.[month]?.[ch] || '-';
                    const stored = taskData?.[month]?.[ch] || {};
                    if (!cfg) return null;
                    return (
                      <div key={ch} style={{
                        display: 'grid',
                        gridTemplateColumns: isTablet ? '120px 1fr 1fr 1fr 1fr 150px' : '140px 1fr 1fr 1fr 1fr 180px',
                        borderBottom: ci < CHANNELS_ORDER.length - 1 ? `1px solid ${G.border}` : 'none',
                        minHeight: 80,
                      }}>
                        <div style={{ background: theme.container, borderRight: `2px solid ${theme.main}40`, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '10px 12px' }}>
                          {React.createElement(CHANNEL_ICONS[ch], { size: 18, color: theme.main })}
                          <div style={{ fontSize: isTablet ? 11 : 12, fontWeight: 700, color: theme.main, lineHeight: 1.3, marginTop: 4 }}>{cfg.name}</div>
                          <div style={{ fontSize: 10, color: G.text3 }}>{cfg.manager}</div>
                        </div>
                        {[0,1,2,3].map(wi => {
                          const wk   = `w${wi + 1}`;
                          const hint = tasks[wi] || `第${wi + 1}週タスク`;
                          return (
                            <div key={wi} style={{ padding: '8px', borderLeft: `1px solid ${G.border}` }}>
                              <div style={{ marginBottom: 4 }}>
                                <span style={{ background: theme.container, color: theme.main, borderRadius: G.radiusPill, padding: '1px 8px', fontSize: 10, fontWeight: 600 }}>第{wi + 1}週</span>
                              </div>
                              <div style={{ fontSize: 9, color: G.text3, marginBottom: 4, whiteSpace: 'pre-line', lineHeight: 1.3 }}>{hint.split('\n')[0]}</div>
                              <WeekTaskInput value={stored[wk]} onChange={e => onUpdate(month, ch, wk, e.target.value)} placeholder="進捗・メモ..." theme={theme} />
                            </div>
                          );
                        })}
                        <div style={{ background: G.bg, padding: '10px 12px', borderLeft: `1px solid ${G.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <div style={{ fontSize: 10, color: G.text3, marginBottom: 4, fontWeight: 600 }}>月間KPI目標</div>
                          <div style={{ fontSize: isTablet ? 10 : 11, color: G.text2, whiteSpace: 'pre-line', lineHeight: 1.5 }}>{kpi}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
