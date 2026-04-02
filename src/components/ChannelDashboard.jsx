import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine
} from 'recharts';
import { ROADMAP_DATA, COLORS, CHANNEL_CONFIGS, MONTHS, MONTH_KPI } from '../data/constants';

const fmt = (v) => `¥${v.toLocaleString()}`;

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

function WeekInput({ month, channel, weekData, onUpdate, listPrice }) {
  const total = (Number(weekData.w1) || 0) + (Number(weekData.w2) || 0) + (Number(weekData.w3) || 0) + (Number(weekData.w4) || 0);
  const revenue = total * listPrice;

  const target = useMemo(() => {
    const row = ROADMAP_DATA.find(r => r.month === month);
    if (!row) return 0;
    return row[channel]?.lists || 0;
  }, [month, channel]);

  const rate = target > 0 ? Math.round((total / target) * 100) : 0;
  const color = CHANNEL_CONFIGS[channel]?.color || COLORS.darkBlue;

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f5f5f5' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.navy }}>{month}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {target > 0 && (
            <span style={{
              background: rate >= 100 ? '#E8F5E9' : rate >= 70 ? '#FFF9C4' : '#FFEBEE',
              color: rate >= 100 ? COLORS.darkGreen : rate >= 70 ? '#F57F17' : '#C62828',
              borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700
            }}>
              達成率 {rate}%
            </span>
          )}
          <span style={{ background: COLORS.lightPurple, color: color, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
            目標: {target.toLocaleString()} リスト
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
        {['w1', 'w2', 'w3', 'w4'].map((wk, i) => (
          <div key={wk}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4, textAlign: 'center' }}>第{i + 1}週</div>
            <input
              type="number"
              min="0"
              value={weekData[wk] ?? 0}
              onChange={(e) => onUpdate(month, channel, wk, e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 10px',
                borderRadius: 10,
                border: `1.5px solid ${Number(weekData[wk]) > 0 ? color + '60' : '#e8e8e8'}`,
                background: Number(weekData[wk]) > 0 ? '#FFFDE7' : '#fafafa',
                fontSize: 16,
                fontWeight: 600,
                textAlign: 'center',
                color: COLORS.navy,
                outline: 'none',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = color; e.target.style.boxShadow = `0 0 0 3px ${color}20`; }}
              onBlur={e => { e.target.style.boxShadow = 'none'; }}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, paddingTop: 12, borderTop: '1px solid #f5f5f5' }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#888' }}>月間実績</div>
          <div style={{ fontSize: 20, fontWeight: 700, color }}>{total.toLocaleString()}</div>
          <div style={{ fontSize: 10, color: '#aaa' }}>リスト</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#888' }}>実績売上</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.darkGreen }}>{fmt(revenue)}</div>
          <div style={{ fontSize: 10, color: '#aaa' }}>@¥{listPrice.toLocaleString()}/リスト</div>
        </div>
        {target > 0 && (
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>進捗</div>
            <div style={{ background: '#f0f0f0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, rate)}%`,
                height: '100%',
                background: rate >= 100 ? COLORS.darkGreen : color,
                borderRadius: 4,
                transition: 'width 0.5s',
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
  if (!config) return null;

  const channelKey = channel === 'instagram' ? 'ig' : channel === 'youtube' ? 'yt' : channel === 'threads' ? 'th' : 'jv';

  const chartData = useMemo(() => {
    return ROADMAP_DATA.map(row => {
      const weekData = inputData?.[row.month]?.[channel] || { w1: 0, w2: 0, w3: 0, w4: 0 };
      const actual = Object.values(weekData).reduce((a, b) => a + (Number(b) || 0), 0);
      const target = row[channelKey]?.lists || 0;
      return {
        month: row.month,
        目標リスト: target,
        実績リスト: actual || null,
        目標売上: (row[channelKey]?.revenue || 0),
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
  const totalActualRevenue = totalActualLists * config.listPrice;
  const overallRate = totalTargetLists > 0 ? Math.round((totalActualLists / totalTargetLists) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Channel Header */}
      <div style={{
        background: config.gradient,
        borderRadius: 20,
        padding: '28px 32px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <div style={{ fontSize: 32, marginBottom: 8 }}>{config.icon}</div>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>{config.name}</div>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 20 }}>担当: {config.manager} · リスト単価: ¥{config.listPrice.toLocaleString()}</div>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, opacity: 0.65 }}>年間リスト目標</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{totalTargetLists.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, opacity: 0.65 }}>年間売上目標</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>¥{(totalTargetRevenue / 100000000).toFixed(2)}億</div>
          </div>
          <div>
            <div style={{ fontSize: 10, opacity: 0.65 }}>実績リスト数</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{totalActualLists.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, opacity: 0.65 }}>達成率</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{overallRate}%</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: COLORS.navy }}>月次リスト数（目標 vs 実績）</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="目標リスト" fill={`${config.color}30`} radius={[3, 3, 0, 0]} name="目標" />
              <Bar dataKey="実績リスト" fill={config.color} radius={[3, 3, 0, 0]} name="実績" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: COLORS.navy }}>月次売上（目標 vs 実績）</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${Math.round(v/10000)}万`} tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="目標売上" stroke={`${config.color}60`} strokeWidth={2} dot={false} strokeDasharray="5 5" name="目標売上" />
              <Line type="monotone" dataKey="実績売上" stroke={config.color} strokeWidth={2.5} dot={{ r: 4, fill: config.color }} name="実績売上" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Input Grid */}
      {channel !== 'line' && (
        <div>
          <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: COLORS.navy }}>
            週次リスト入力
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {MONTHS.map(month => (
              <WeekInput
                key={month}
                month={month}
                channel={channel}
                weekData={inputData?.[month]?.[channel] || { w1: 0, w2: 0, w3: 0, w4: 0 }}
                onUpdate={onUpdate}
                listPrice={config.listPrice}
              />
            ))}
          </div>
        </div>
      )}

      {/* Monthly KPI Goals */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: COLORS.navy }}>月間KPI目標</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {MONTHS.map(month => {
            const kpi = MONTH_KPI[month]?.[channel] || '-';
            return (
              <div key={month} style={{
                background: COLORS.lightPurple,
                borderRadius: 12,
                padding: '12px 14px',
                borderLeft: `3px solid ${config.color}`,
              }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.navy, marginBottom: 6 }}>{month}</div>
                <div style={{ fontSize: 11, color: '#555', whiteSpace: 'pre-line', lineHeight: 1.5 }}>{kpi}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
