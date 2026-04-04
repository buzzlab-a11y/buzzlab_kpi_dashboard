import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { ROADMAP_DATA, COLORS, CHANNEL_CONFIGS, MONTHS, MONTH_KPI } from '../data/constants';
import { useBreakpoint } from '../hooks/useBreakpoint';

const fmt = (v) => `¥${v.toLocaleString()}`;
const fmtM = (v) => {
  if (v >= 100000000) return `¥${(v / 100000000).toFixed(2)}億`;
  if (v >= 10000) return `¥${Math.round(v / 10000).toLocaleString()}万`;
  return `¥${v.toLocaleString()}`;
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid #f0f0f0' }}>
      <p style={{ fontWeight: 700, marginBottom: 6, color: COLORS.navy, fontSize: 13 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 2, alignItems: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ fontSize: 11, color: '#555' }}>{p.name}:</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.navy }}>
            {p.value?.toLocaleString?.() ?? p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function WeekInput({ month, channel, weekData, onUpdate, listPrice, isMobile }) {
  const total = (Number(weekData.w1) || 0) + (Number(weekData.w2) || 0) + (Number(weekData.w3) || 0) + (Number(weekData.w4) || 0);
  const revenue = total * listPrice;
  const target = useMemo(() => {
    const channelKey = channel === 'instagram' ? 'ig' : channel === 'youtube' ? 'yt' : channel === 'threads' ? 'th' : 'jv';
    const row = ROADMAP_DATA.find(r => r.month === month);
    return row?.[channelKey]?.lists || 0;
  }, [month, channel]);

  const rate = target > 0 ? Math.round((total / target) * 100) : 0;
  const color = CHANNEL_CONFIGS[channel]?.color || COLORS.darkBlue;

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: isMobile ? '14px' : '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f5f5f5' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.navy }}>{month}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {target > 0 && (
            <span style={{
              background: rate >= 100 ? '#E8F5E9' : rate >= 70 ? '#FFF9C4' : '#FFEBEE',
              color: rate >= 100 ? COLORS.darkGreen : rate >= 70 ? '#F57F17' : '#C62828',
              borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700
            }}>達成率 {rate}%</span>
          )}
          <span style={{ background: COLORS.lightPurple, color, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>
            目標: {target.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Week inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        {['w1', 'w2', 'w3', 'w4'].map((wk, i) => (
          <div key={wk}>
            <div style={{ fontSize: 10, color: '#888', marginBottom: 3, textAlign: 'center' }}>第{i + 1}週</div>
            <input
              type="number"
              min="0"
              value={weekData[wk] ?? 0}
              onChange={(e) => onUpdate(month, channel, wk, e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: isMobile ? '7px 4px' : '8px 6px',
                borderRadius: 10,
                border: `1.5px solid ${Number(weekData[wk]) > 0 ? color + '60' : '#e8e8e8'}`,
                background: Number(weekData[wk]) > 0 ? '#FFFDE7' : '#fafafa',
                fontSize: isMobile ? 14 : 16,
                fontWeight: 600,
                textAlign: 'center',
                color: COLORS.navy,
                outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = color; e.target.style.boxShadow = `0 0 0 3px ${color}20`; }}
              onBlur={e => { e.target.style.boxShadow = 'none'; }}
            />
          </div>
        ))}
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, paddingTop: 10, borderTop: '1px solid #f5f5f5' }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#888' }}>月間実績</div>
          <div style={{ fontSize: 18, fontWeight: 700, color }}>{total.toLocaleString()}</div>
          <div style={{ fontSize: 9, color: '#aaa' }}>リスト</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#888' }}>実績売上</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGreen }}>{fmt(revenue)}</div>
          <div style={{ fontSize: 9, color: '#aaa' }}>@¥{listPrice.toLocaleString()}</div>
        </div>
        {target > 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ background: '#f0f0f0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, rate)}%`, height: '100%',
                background: rate >= 100 ? COLORS.darkGreen : color,
                borderRadius: 4, transition: 'width 0.5s',
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChannelDashboard({ channel, inputData, onUpdate }) {
  const config = CHANNEL_CONFIGS[channel];
  const { isMobile, isTablet } = useBreakpoint();
  if (!config) return null;

  const channelKey = channel === 'instagram' ? 'ig' : channel === 'youtube' ? 'yt' : channel === 'threads' ? 'th' : 'jv';

  const chartData = useMemo(() => {
    return ROADMAP_DATA.map(row => {
      const weekData = inputData?.[row.month]?.[channel] || {};
      const actual = Object.values(weekData).reduce((a, b) => a + (Number(b) || 0), 0);
      const target = row[channelKey]?.lists || 0;
      return {
        month: row.month,
        目標リスト: target,
        実績リスト: actual || null,
        目標売上: row[channelKey]?.revenue || 0,
        実績売上: actual * config.listPrice || null,
      };
    });
  }, [inputData, channel]);

  const totalActualLists = useMemo(() => {
    return ROADMAP_DATA.reduce((sum, row) => {
      const wd = inputData?.[row.month]?.[channel] || {};
      return sum + Object.values(wd).reduce((a, b) => a + (Number(b) || 0), 0);
    }, 0);
  }, [inputData, channel]);

  const totalTargetLists = ROADMAP_DATA.reduce((s, r) => s + (r[channelKey]?.lists || 0), 0);
  const totalTargetRevenue = ROADMAP_DATA.reduce((s, r) => s + (r[channelKey]?.revenue || 0), 0);
  const overallRate = totalTargetLists > 0 ? Math.round((totalActualLists / totalTargetLists) * 100) : 0;

  const inputCols = isMobile ? 1 : isTablet ? 2 : 3;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 20 }}>
      {/* Channel Header */}
      <div style={{
        background: config.gradient,
        borderRadius: isMobile ? 16 : 20,
        padding: isMobile ? '20px' : '28px 32px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <div style={{ fontSize: isMobile ? 24 : 32, marginBottom: 6 }}>{config.icon}</div>
        <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, letterSpacing: -0.5 }}>{config.name}</div>
        <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 16 }}>担当: {config.manager} · リスト単価: ¥{config.listPrice.toLocaleString()}</div>
        <div style={{ display: 'flex', gap: isMobile ? 16 : 28, flexWrap: 'wrap' }}>
          {[
            { label: '年間リスト目標', val: totalTargetLists.toLocaleString() },
            { label: '年間売上目標',   val: fmtM(totalTargetRevenue) },
            { label: '実績リスト数',   val: totalActualLists.toLocaleString() },
            { label: '達成率',         val: `${overallRate}%` },
          ].map(({ label, val }) => (
            <div key={label}>
              <div style={{ fontSize: 10, opacity: 0.65 }}>{label}</div>
              <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 14 : 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: isMobile ? '14px' : '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: COLORS.navy }}>月次リスト数（目標 vs 実績）</h3>
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 200}>
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#888' }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="目標リスト" fill={`${config.color}30`} radius={[3, 3, 0, 0]} name="目標" />
              <Bar dataKey="実績リスト" fill={config.color} radius={[3, 3, 0, 0]} name="実績" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: isMobile ? '14px' : '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: COLORS.navy }}>月次売上（目標 vs 実績）</h3>
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${Math.round(v / 10000)}万`} tick={{ fontSize: 9, fill: '#888' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="目標売上" stroke={`${config.color}60`} strokeWidth={2} dot={false} strokeDasharray="5 5" name="目標売上" />
              <Line type="monotone" dataKey="実績売上" stroke={config.color} strokeWidth={2.5} dot={{ r: 3, fill: config.color }} name="実績売上" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Input Grid */}
      <div>
        <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: COLORS.navy }}>週次リスト入力</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${inputCols}, 1fr)`,
          gap: isMobile ? 10 : 14,
        }}>
          {MONTHS.map(month => (
            <WeekInput
              key={month}
              month={month}
              channel={channel}
              weekData={inputData?.[month]?.[channel] || { w1: 0, w2: 0, w3: 0, w4: 0 }}
              onUpdate={onUpdate}
              listPrice={config.listPrice}
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>

      {/* KPI Goals */}
      <div style={{ background: '#fff', borderRadius: 16, padding: isMobile ? '14px' : '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: COLORS.navy }}>月間KPI目標</h3>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {MONTHS.map(month => {
            const kpi = MONTH_KPI[month]?.[channel] || '-';
            return (
              <div key={month} style={{
                background: COLORS.lightPurple, borderRadius: 12,
                padding: '10px 12px', borderLeft: `3px solid ${config.color}`,
              }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: COLORS.navy, marginBottom: 4 }}>{month}</div>
                <div style={{ fontSize: 11, color: '#555', whiteSpace: 'pre-line', lineHeight: 1.5 }}>{kpi}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
