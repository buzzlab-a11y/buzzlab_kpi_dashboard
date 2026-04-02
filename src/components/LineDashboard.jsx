import React, { useMemo } from 'react';
import { COLORS, LINE_PHASES, MONTHS } from '../data/constants';

const fmt = (v) => `¥${Number(v).toLocaleString()}`;

export default function LineDashboard({ inputData, linePhases, onUpdate, onPhaseUpdate }) {
  const totalContracts = useMemo(() => {
    if (!inputData) return 0;
    return MONTHS.reduce((sum, month) => {
      const ld = inputData[month]?.line || {};
      return sum + (Number(ld.contracts) || 0);
    }, 0);
  }, [inputData]);

  const totalRevenue = totalContracts * 3000;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.lineGreen}, ${COLORS.darkGreen})`,
        borderRadius: 20,
        padding: '28px 32px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
        <div style={{ fontSize: 24, fontWeight: 800 }}>LINE既存リストローンチ</div>
        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 20 }}>担当: 亮平さん · リスト単価: ¥3,000</div>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, opacity: 0.65 }}>累計成約件数</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{totalContracts.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, opacity: 0.65 }}>累計実績売上</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{fmt(totalRevenue)}</div>
          </div>
        </div>
      </div>

      {/* Phase Checklist */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: COLORS.navy }}>ローンチフェーズ管理</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {LINE_PHASES.map(({ phase, deadline, task }) => {
            const data = linePhases?.[phase] || { done: false, memo: '', improvement: '' };
            return (
              <div key={phase} style={{
                borderRadius: 12,
                border: `1.5px solid ${data.done ? COLORS.lineGreen : '#e8e8e8'}`,
                background: data.done ? COLORS.lightGreen : '#fafafa',
                padding: '14px 16px',
                transition: 'all 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <input
                    type="checkbox"
                    checked={data.done}
                    onChange={e => onPhaseUpdate(phase, 'done', e.target.checked)}
                    style={{ width: 18, height: 18, marginTop: 2, cursor: 'pointer', accentColor: COLORS.lineGreen }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{
                        background: COLORS.lineGreen,
                        color: '#fff',
                        borderRadius: 6,
                        padding: '2px 8px',
                        fontSize: 11,
                        fontWeight: 700,
                      }}>{phase}</span>
                      <span style={{ fontSize: 11, color: '#888' }}>📅 {deadline}</span>
                    </div>
                    <div style={{ fontSize: 13, color: data.done ? COLORS.darkGreen : COLORS.navy, fontWeight: data.done ? 500 : 600, marginBottom: 8 }}>
                      {task}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>実績メモ</div>
                        <input
                          type="text"
                          value={data.memo}
                          onChange={e => onPhaseUpdate(phase, 'memo', e.target.value)}
                          placeholder="実績を入力..."
                          style={{
                            width: '100%', boxSizing: 'border-box',
                            padding: '6px 10px', borderRadius: 8,
                            border: '1px solid #e0e0e0', fontSize: 12,
                            background: '#fff', outline: 'none',
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>改善施策</div>
                        <input
                          type="text"
                          value={data.improvement}
                          onChange={e => onPhaseUpdate(phase, 'improvement', e.target.value)}
                          placeholder="改善点を入力..."
                          style={{
                            width: '100%', boxSizing: 'border-box',
                            padding: '6px 10px', borderRadius: 8,
                            border: '1px solid #e0e0e0', fontSize: 12,
                            background: '#fff', outline: 'none',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Conversion Input */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: COLORS.navy }}>週次成約管理（毎週入力）</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: COLORS.darkNavy }}>
                {['月', '週', '対応リスト数', '個別相談件数', '成約件数', '成約率'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', color: '#fff', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MONTHS.map((month, mi) =>
                [1, 2, 3, 4].map((week, wi) => {
                  const ld = inputData?.[month]?.line || {};
                  const key = `w${week}`;
                  const contacts = Number(ld[`contacts_w${week}`]) || 0;
                  const consultations = Number(ld[`consultations_w${week}`]) || 0;
                  const contracts = Number(ld[`contracts_w${week}`]) || 0;
                  const rate = contacts > 0 ? ((contracts / contacts) * 100).toFixed(1) + '%' : '-';

                  return (
                    <tr key={`${month}-${week}`} style={{ borderBottom: '1px solid #f5f5f5', background: wi % 2 === 0 ? '#fafafa' : '#fff' }}>
                      {wi === 0 && (
                        <td rowSpan={4} style={{
                          padding: '10px 12px', textAlign: 'center',
                          fontWeight: 700, color: '#fff',
                          background: COLORS.lineGreen,
                          borderRight: '2px solid #05b84d',
                        }}>{month}</td>
                      )}
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: '#555', fontWeight: 500 }}>第{week}週</td>
                      {['contacts', 'consultations', 'contracts'].map(field => (
                        <td key={field} style={{ padding: '6px 8px' }}>
                          <input
                            type="number"
                            min="0"
                            value={ld[`${field}_w${week}`] ?? 0}
                            onChange={e => onUpdate(month, 'line', `${field}_w${week}`, e.target.value)}
                            style={{
                              width: '100%', boxSizing: 'border-box',
                              padding: '6px 8px', borderRadius: 8,
                              border: '1.5px solid #e8e8e8',
                              background: Number(ld[`${field}_w${week}`]) > 0 ? '#FFFDE7' : '#fff',
                              fontSize: 14, fontWeight: 600, textAlign: 'center',
                              color: COLORS.navy, outline: 'none',
                            }}
                            onFocus={e => { e.target.style.borderColor = COLORS.lineGreen; e.target.style.boxShadow = `0 0 0 3px ${COLORS.lineGreen}20`; }}
                            onBlur={e => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = '#e8e8e8'; }}
                          />
                        </td>
                      ))}
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: contacts > 0 ? (Number(rate) >= 3 ? COLORS.darkGreen : '#F57F17') : '#aaa' }}>
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
