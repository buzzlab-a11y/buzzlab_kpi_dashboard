import React, { useMemo } from 'react';
import { COLORS, LINE_PHASES, MONTHS } from '../data/constants';
import { useBreakpoint } from '../hooks/useBreakpoint';

const fmt = (v) => `¥${Number(v).toLocaleString()}`;

export default function LineDashboard({ inputData, linePhases, onUpdate, onPhaseUpdate }) {
  const { isMobile } = useBreakpoint();

  const totalContracts = useMemo(() => {
    if (!inputData) return 0;
    return MONTHS.reduce((sum, month) => {
      const ld = inputData[month]?.line || {};
      const monthContracts = [1, 2, 3, 4].reduce((s, w) => s + (Number(ld[`contracts_w${w}`]) || 0), 0);
      return sum + monthContracts;
    }, 0);
  }, [inputData]);

  const totalContacts = useMemo(() => {
    if (!inputData) return 0;
    return MONTHS.reduce((sum, month) => {
      const ld = inputData[month]?.line || {};
      return sum + [1, 2, 3, 4].reduce((s, w) => s + (Number(ld[`contacts_w${w}`]) || 0), 0);
    }, 0);
  }, [inputData]);

  const totalRevenue = totalContracts * 3000;
  const overallConversionRate = totalContacts > 0 ? ((totalContracts / totalContacts) * 100).toFixed(1) : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20 }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.lineGreen}, ${COLORS.darkGreen})`,
        borderRadius: isMobile ? 16 : 20,
        padding: isMobile ? '20px' : '28px 32px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <div style={{ fontSize: isMobile ? 24 : 32, marginBottom: 6 }}>💬</div>
        <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800 }}>LINE既存リストローンチ</div>
        <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 16 }}>担当: 亮平さん · リスト単価: ¥3,000</div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, opacity: 0.65 }}>累計対応リスト数</div>
            <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700 }}>{totalContacts.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, opacity: 0.65 }}>累計成約件数</div>
            <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700 }}>{totalContracts.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, opacity: 0.65 }}>累計実績売上</div>
            <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700 }}>{fmt(totalRevenue)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, opacity: 0.65 }}>通算成約率</div>
            <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700 }}>{overallConversionRate}{totalContacts > 0 ? '%' : ''}</div>
          </div>
        </div>
      </div>

      {/* Phase Checklist */}
      <div style={{ background: '#fff', borderRadius: 16, padding: isMobile ? '14px' : '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: COLORS.navy }}>ローンチフェーズ管理</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {LINE_PHASES.map(({ phase, deadline, task }) => {
            const data = linePhases?.[phase] || { done: false, memo: '', improvement: '' };
            return (
              <div key={phase} style={{
                borderRadius: 12,
                border: `1.5px solid ${data.done ? COLORS.lineGreen : '#e8e8e8'}`,
                background: data.done ? COLORS.lightGreen : '#fafafa',
                padding: isMobile ? '12px' : '14px 16px',
                transition: 'all 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={data.done}
                    onChange={e => onPhaseUpdate(phase, 'done', e.target.checked)}
                    style={{ width: 18, height: 18, marginTop: 2, cursor: 'pointer', accentColor: COLORS.lineGreen, flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{
                        background: COLORS.lineGreen, color: '#fff',
                        borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                      }}>{phase}</span>
                      <span style={{ fontSize: 11, color: '#888' }}>📅 {deadline}</span>
                    </div>
                    <div style={{ fontSize: isMobile ? 12 : 13, color: data.done ? COLORS.darkGreen : COLORS.navy, fontWeight: data.done ? 500 : 600, marginBottom: 8 }}>
                      {task}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
                      {[
                        { key: 'memo', label: '実績メモ', placeholder: '実績を入力...' },
                        { key: 'improvement', label: '改善施策', placeholder: '改善点を入力...' },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <div style={{ fontSize: 10, color: '#888', marginBottom: 3 }}>{label}</div>
                          <input
                            type="text"
                            value={data[key]}
                            onChange={e => onPhaseUpdate(phase, key, e.target.value)}
                            placeholder={placeholder}
                            style={{
                              width: '100%', boxSizing: 'border-box',
                              padding: '6px 10px', borderRadius: 8,
                              border: '1px solid #e0e0e0', fontSize: 12,
                              background: '#fff', outline: 'none',
                            }}
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
      </div>

      {/* Weekly Conversion Input */}
      <div style={{ background: '#fff', borderRadius: 16, padding: isMobile ? '14px 10px' : '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: COLORS.navy }}>週次成約管理（毎週入力）</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? 11 : 13, minWidth: 480 }}>
            <thead>
              <tr style={{ background: COLORS.darkNavy }}>
                {['月', '週', '対応リスト数', '個別相談', '成約件数', '成約率'].map(h => (
                  <th key={h} style={{ padding: isMobile ? '8px 6px' : '10px 12px', color: '#fff', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MONTHS.map((month) =>
                [1, 2, 3, 4].map((week, wi) => {
                  const ld = inputData?.[month]?.line || {};
                  const contacts = Number(ld[`contacts_w${week}`]) || 0;
                  const contracts = Number(ld[`contracts_w${week}`]) || 0;
                  const rate = contacts > 0 ? ((contracts / contacts) * 100).toFixed(1) + '%' : '-';

                  return (
                    <tr key={`${month}-${week}`} style={{ borderBottom: '1px solid #f5f5f5', background: wi % 2 === 0 ? '#fafafa' : '#fff' }}>
                      {wi === 0 && (
                        <td rowSpan={4} style={{
                          padding: '8px 6px', textAlign: 'center',
                          fontWeight: 700, color: '#fff', fontSize: isMobile ? 11 : 13,
                          background: COLORS.lineGreen,
                          borderRight: '2px solid #05b84d',
                          whiteSpace: 'nowrap',
                        }}>{month}</td>
                      )}
                      <td style={{ padding: isMobile ? '6px' : '8px 12px', textAlign: 'center', color: '#555', fontWeight: 500, whiteSpace: 'nowrap' }}>第{week}週</td>
                      {['contacts', 'consultations', 'contracts'].map(field => (
                        <td key={field} style={{ padding: '4px 6px' }}>
                          <input
                            type="number"
                            min="0"
                            value={ld[`${field}_w${week}`] ?? 0}
                            onChange={e => onUpdate(month, 'line', `${field}_w${week}`, e.target.value)}
                            style={{
                              width: '100%', boxSizing: 'border-box',
                              padding: isMobile ? '5px 4px' : '6px 8px', borderRadius: 8,
                              border: '1.5px solid #e8e8e8',
                              background: Number(ld[`${field}_w${week}`]) > 0 ? '#FFFDE7' : '#fff',
                              fontSize: isMobile ? 13 : 14, fontWeight: 600, textAlign: 'center',
                              color: COLORS.navy, outline: 'none', minWidth: 0,
                            }}
                            onFocus={e => { e.target.style.borderColor = COLORS.lineGreen; e.target.style.boxShadow = `0 0 0 3px ${COLORS.lineGreen}20`; }}
                            onBlur={e => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = '#e8e8e8'; }}
                          />
                        </td>
                      ))}
                      <td style={{ padding: isMobile ? '6px' : '8px 12px', textAlign: 'center', fontWeight: 700, fontSize: isMobile ? 11 : 13, color: contacts > 0 ? (contracts / contacts >= 0.03 ? COLORS.darkGreen : '#F57F17') : '#aaa' }}>
                        {rate}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
