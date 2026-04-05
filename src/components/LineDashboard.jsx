import React, { useMemo } from 'react';
import { MONTHS } from '../data/constants';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { G } from '../styles/theme';

const fmtM = v => {
  if (v >= 100000000) return `¥${(v / 100000000).toFixed(2)}億`;
  if (v >= 10000)     return `¥${Math.round(v / 10000).toLocaleString()}万`;
  return `¥${v.toLocaleString()}`;
};

function Card({ children, style }) {
  return (
    <div style={{ background: G.surface, borderRadius: G.radiusLg, border: `1px solid ${G.border}`, boxShadow: G.shadow1, ...style }}>
      {children}
    </div>
  );
}

// linePhaseDefs: [{ phase, deadline, task_description, sort_order }]
// linePhasesStatus: { '準備①': { done, memo, improvement }, ... }
export default function LineDashboard({ linePhaseDefs, inputData, linePhasesStatus, onUpdate, onPhaseUpdate }) {
  const { isMobile } = useBreakpoint();
  const ln = G.ln;

  const totalContacts = useMemo(() => {
    if (!inputData) return 0;
    return MONTHS.reduce((sum, month) => {
      const ld = inputData[month]?.line || {};
      return sum + [1,2,3,4].reduce((s, w) => s + (Number(ld[`contacts_w${w}`]) || 0), 0);
    }, 0);
  }, [inputData]);

  const totalContracts = useMemo(() => {
    if (!inputData) return 0;
    return MONTHS.reduce((sum, month) => {
      const ld = inputData[month]?.line || {};
      return sum + [1,2,3,4].reduce((s, w) => s + (Number(ld[`contracts_w${w}`]) || 0), 0);
    }, 0);
  }, [inputData]);

  const totalRevenue           = totalContacts * 3000;
  const overallConversionRate  = totalContacts > 0 ? ((totalContracts / totalContacts) * 100).toFixed(1) : '—';

  const summaryItems = [
    { label: '累計対応リスト数', value: totalContacts.toLocaleString() },
    { label: '累計成約件数',     value: totalContracts.toLocaleString() },
    { label: '累計実績売上',     value: fmtM(totalRevenue) },
    { label: '通算成約率',       value: totalContacts > 0 ? `${overallConversionRate}%` : '—' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 20 }}>
      {/* Hero Card */}
      <Card style={{ padding: isMobile ? '20px' : '24px 28px', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: ln.gradient }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, marginTop: 4 }}>
          <div style={{ width: 48, height: 48, borderRadius: G.radiusMd, background: ln.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff' }}>💬</div>
          <div>
            <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: G.text1 }}>LINE既存リストローンチ</div>
            <div style={{ fontSize: 12, color: G.text2 }}>担当: 亮平さん · リスト単価 ¥3,000</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: isMobile ? 12 : 16 }}>
          {summaryItems.map(({ label, value }) => (
            <div key={label} style={{ background: G.bg, borderRadius: G.radiusMd, padding: '12px 14px', border: `1px solid ${G.border}` }}>
              <div style={{ fontSize: 11, color: G.text3, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: G.text1 }}>{value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Phase Checklist */}
      <Card style={{ padding: isMobile ? 14 : '20px 24px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: G.text1, marginBottom: 14 }}>ローンチフェーズ管理</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(linePhaseDefs || []).map(({ phase, deadline, task_description }) => {
            const data = linePhasesStatus?.[phase] || { done: false, memo: '', improvement: '' };
            return (
              <div key={phase} style={{
                borderRadius: G.radiusMd,
                border: `1.5px solid ${data.done ? ln.main : G.border}`,
                background: data.done ? ln.container : G.surface,
                padding: isMobile ? 12 : '12px 16px',
                transition: G.transition,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={data.done}
                    onChange={e => onPhaseUpdate(phase, 'done', e.target.checked)}
                    style={{ width: 18, height: 18, marginTop: 2, cursor: 'pointer', accentColor: ln.main, flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ background: ln.main, color: '#fff', borderRadius: G.radiusPill, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{phase}</span>
                      <span style={{ fontSize: 11, color: G.text3 }}>📅 {deadline}</span>
                    </div>
                    <div style={{ fontSize: isMobile ? 12 : 13, color: G.text1, fontWeight: 500, marginBottom: 8, lineHeight: 1.5 }}>{task_description}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
                      {[
                        { key: 'memo',        label: '実績メモ', placeholder: '実績を入力...' },
                        { key: 'improvement', label: '改善施策', placeholder: '改善点を入力...' },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <div style={{ fontSize: 11, color: G.text3, marginBottom: 3 }}>{label}</div>
                          <input
                            type="text"
                            value={data[key] || ''}
                            onChange={e => onPhaseUpdate(phase, key, e.target.value)}
                            placeholder={placeholder}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: G.radius, border: `1.5px solid ${G.border}`, fontSize: 12, color: G.text1, background: G.surface, outline: 'none', transition: G.transition }}
                            onFocus={e => { e.target.style.borderColor = ln.main; e.target.style.boxShadow = `0 0 0 3px ${ln.main}22`; }}
                            onBlur={e => { e.target.style.borderColor = G.border; e.target.style.boxShadow = 'none'; }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Weekly Conversion Table */}
      <Card style={{ padding: isMobile ? '14px 10px' : '20px 24px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: G.text1, marginBottom: 14 }}>週次成約管理（毎週入力）</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? 11 : 13, minWidth: 500 }}>
            <thead>
              <tr style={{ background: G.bg, borderBottom: `2px solid ${G.border}` }}>
                {['月', '週', '対応リスト数', '個別相談', '成約件数', '成約率'].map(h => (
                  <th key={h} style={{ padding: isMobile ? '8px 6px' : '10px 12px', color: G.text2, fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MONTHS.map(month =>
                [1,2,3,4].map((week, wi) => {
                  const ld       = inputData?.[month]?.line || {};
                  const contacts = Number(ld[`contacts_w${week}`]) || 0;
                  const contracts = Number(ld[`contracts_w${week}`]) || 0;
                  const rate     = contacts > 0 ? ((contracts / contacts) * 100).toFixed(1) + '%' : '-';
                  const rateColor = contacts > 0 ? (contracts / contacts >= 0.03 ? G.success : G.warning) : G.text3;
                  return (
                    <tr key={`${month}-${week}`} style={{ borderBottom: `1px solid ${G.border}`, background: wi === 3 ? G.bg : G.surface }}>
                      {wi === 0 && (
                        <td rowSpan={4} style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#fff', fontSize: isMobile ? 11 : 12, background: ln.main, whiteSpace: 'nowrap', borderRight: `2px solid ${G.border}` }}>
                          {month}
                        </td>
                      )}
                      <td style={{ padding: isMobile ? '6px' : '8px 12px', textAlign: 'center', color: G.text2, fontWeight: 500, whiteSpace: 'nowrap' }}>第{week}週</td>
                      {['contacts','consultations','contracts'].map(field => (
                        <td key={field} style={{ padding: '4px 6px' }}>
                          <input
                            type="number" min="0"
                            value={ld[`${field}_w${week}`] ?? 0}
                            onChange={e => onUpdate(month, 'line', `${field}_w${week}`, e.target.value)}
                            style={{
                              width: '100%', padding: isMobile ? '5px 4px' : '6px 8px', borderRadius: G.radius,
                              border: `1.5px solid ${Number(ld[`${field}_w${week}`]) > 0 ? ln.main : G.border}`,
                              background: Number(ld[`${field}_w${week}`]) > 0 ? ln.container : G.surface,
                              fontSize: isMobile ? 13 : 14, fontWeight: 600, textAlign: 'center',
                              color: G.text1, outline: 'none', minWidth: 0, transition: G.transition,
                            }}
                            onFocus={e => { e.target.style.borderColor = ln.main; e.target.style.boxShadow = `0 0 0 3px ${ln.main}22`; }}
                            onBlur={e => { e.target.style.boxShadow = 'none'; }}
                          />
                        </td>
                      ))}
                      <td style={{ padding: isMobile ? '6px' : '8px 12px', textAlign: 'center', fontWeight: 700, fontSize: isMobile ? 11 : 13, color: rateColor }}>{rate}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
