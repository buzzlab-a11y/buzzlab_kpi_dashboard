import React, { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { ROADMAP_DATA, COLORS, CHANNEL_ANNUAL, CHANNEL_CONFIGS } from '../data/constants';
import { useBreakpoint } from '../hooks/useBreakpoint';

const fmt = (v) => `¥${v.toLocaleString()}`;
const fmtM = (v) => {
  if (v >= 100000000) return `¥${(v / 100000000).toFixed(2)}億`;
  if (v >= 10000) return `¥${Math.round(v / 10000).toLocaleString()}万`;
  return `¥${v.toLocaleString()}`;
};

function MetricCard({ label, value, sub, color, icon }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: '16px 18px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      borderLeft: `4px solid ${color}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{ fontSize: 11, color: '#666', fontWeight: 500, letterSpacing: 0.3 }}>{icon} {label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.navy, letterSpacing: -0.5 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#888' }}>{sub}</div>}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid #f0f0f0' }}>
      <p style={{ fontWeight: 700, marginBottom: 8, color: COLORS.navy, fontSize: 13 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ fontSize: 11, color: '#555' }}>{p.name}:</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.navy }}>
            {typeof p.value === 'number' && p.value > 10000 ? fmtM(p.value) : p.value?.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function OverviewDashboard({ inputData }) {
  const { isMobile, isTablet } = useBreakpoint();

  const chartData = useMemo(() => {
    return ROADMAP_DATA.map((row) => {
      const igActual = inputData ? Object.values(inputData[row.month]?.instagram || {}).reduce((a, b) => a + (Number(b) || 0), 0) : 0;
      const ytActual = inputData ? Object.values(inputData[row.month]?.youtube || {}).reduce((a, b) => a + (Number(b) || 0), 0) : 0;
      const thActual = inputData ? Object.values(inputData[row.month]?.threads || {}).reduce((a, b) => a + (Number(b) || 0), 0) : 0;
      const jvActual = inputData ? Object.values(inputData[row.month]?.jv || {}).reduce((a, b) => a + (Number(b) || 0), 0) : 0;
      const actualRevenue = igActual * 10000 + ytActual * 15000 + thActual * 5000 + jvActual * 20000;
      return {
        month: row.month,
        目標売上: row.total,
        累計目標: row.cumulative,
        実績売上: actualRevenue || null,
      };
    });
  }, [inputData]);

  const pieData = [
    { name: 'Instagram', value: CHANNEL_ANNUAL.instagram.revenue, color: COLORS.instagram },
    { name: 'YouTube',   value: CHANNEL_ANNUAL.youtube.revenue,   color: '#FF0000' },
    { name: 'Threads',   value: CHANNEL_ANNUAL.threads.revenue,   color: '#555555' },
    { name: 'JV',        value: CHANNEL_ANNUAL.jv.revenue,        color: '#0066CC' },
  ];

  const totalActualRevenue = useMemo(() => {
    if (!inputData) return 0;
    return ROADMAP_DATA.reduce((sum, row) => {
      const ig = Object.values(inputData[row.month]?.instagram || {}).reduce((a, b) => a + (Number(b) || 0), 0);
      const yt = Object.values(inputData[row.month]?.youtube || {}).reduce((a, b) => a + (Number(b) || 0), 0);
      const th = Object.values(inputData[row.month]?.threads || {}).reduce((a, b) => a + (Number(b) || 0), 0);
      const jv = Object.values(inputData[row.month]?.jv || {}).reduce((a, b) => a + (Number(b) || 0), 0);
      return sum
        + ig * CHANNEL_CONFIGS.instagram.listPrice
        + yt * CHANNEL_CONFIGS.youtube.listPrice
        + th * CHANNEL_CONFIGS.threads.listPrice
        + jv * CHANNEL_CONFIGS.jv.listPrice;
    }, 0);
  }, [inputData]);

  const achievementRate = Math.min(100, Math.round((totalActualRevenue / 200000000) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 24 }}>
      {/* Hero Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.darkBlue} 100%)`,
        borderRadius: isMobile ? 16 : 20,
        padding: isMobile ? '20px 20px' : '32px 36px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />
        <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: 1, marginBottom: 6 }}>BUZZLAB 2026</div>
        <div style={{ fontSize: isMobile ? 20 : 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 4 }}>
          🚀 2億円達成ロードマップ
        </div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>2026年4月〜12月 · 目標: ¥339,800,000</div>
        <div style={{ marginTop: 20, display: 'flex', gap: isMobile ? 16 : 32, flexWrap: 'wrap' }}>
          {[
            { label: '年間目標売上', val: '¥339,800,000' },
            { label: '2億達成予定', val: '11月' },
            { label: '目標超過額', val: '¥139,800,000' },
          ].map(({ label, val }) => (
            <div key={label}>
              <div style={{ fontSize: 10, opacity: 0.6 }}>{label}</div>
              <div style={{ fontSize: isMobile ? 16 : 22, fontWeight: 700 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)',
        gap: isMobile ? 10 : 16,
      }}>
        <MetricCard icon="💰" label="累計実績売上" value={fmtM(totalActualRevenue)} sub={`2億達成率: ${achievementRate}%`} color={COLORS.darkGreen} />
        <MetricCard icon="📊" label="年間目標売上" value={fmtM(339800000)} sub={`9ヶ月累計 | 2億達成: 11月`} color={COLORS.darkBlue} />
        <MetricCard icon="📸" label="IG年間貢献" value={fmtM(CHANNEL_ANNUAL.instagram.revenue)} sub={`${CHANNEL_ANNUAL.instagram.share}% | ${CHANNEL_ANNUAL.instagram.lists.toLocaleString()}リスト`} color={COLORS.instagram} />
        <MetricCard icon="▶️" label="YT年間貢献" value={fmtM(CHANNEL_ANNUAL.youtube.revenue)} sub={`${CHANNEL_ANNUAL.youtube.share}% | ${CHANNEL_ANNUAL.youtube.lists.toLocaleString()}リスト`} color="#FF0000" />
        <MetricCard icon="🧵" label="TH年間貢献" value={fmtM(CHANNEL_ANNUAL.threads.revenue)} sub={`${CHANNEL_ANNUAL.threads.share}% | ${CHANNEL_ANNUAL.threads.lists.toLocaleString()}リスト`} color="#555" />
        <MetricCard icon="🤝" label="JV年間貢献" value={fmtM(CHANNEL_ANNUAL.jv.revenue)} sub={`${CHANNEL_ANNUAL.jv.share}% | ${CHANNEL_ANNUAL.jv.lists.toLocaleString()}リスト`} color="#0066CC" />
      </div>

      {/* Progress Bar */}
      <div style={{ background: '#fff', borderRadius: 16, padding: isMobile ? '16px' : '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontWeight: 600, color: COLORS.navy, fontSize: isMobile ? 13 : 14 }}>2億円達成進捗</span>
          <span style={{ fontWeight: 700, color: COLORS.darkGreen }}>{achievementRate}%</span>
        </div>
        <div style={{ background: '#f0f0f0', borderRadius: 8, height: 12, overflow: 'hidden' }}>
          <div style={{
            width: `${achievementRate}%`, height: '100%',
            background: `linear-gradient(90deg, ${COLORS.darkGreen}, #4CAF50)`,
            borderRadius: 8, transition: 'width 0.8s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: '#888' }}>
          <span>¥0</span>
          <span style={{ color: COLORS.darkBlue, fontWeight: 600 }}>目標: ¥200,000,000</span>
          <span>¥339,800,000</span>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
        gap: isMobile ? 14 : 20,
      }}>
        {/* Monthly Revenue Bar Chart */}
        <div style={{ background: '#fff', borderRadius: 16, padding: isMobile ? '16px' : '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: COLORS.navy }}>月次売上推移（目標 vs 実績）</h3>
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 260}>
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${Math.round(v / 10000000)}千万`} tick={{ fontSize: 9, fill: '#888' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="目標売上" fill={`${COLORS.darkBlue}40`} radius={[4, 4, 0, 0]} name="目標売上" />
              <Bar dataKey="実績売上" fill={COLORS.darkGreen} radius={[4, 4, 0, 0]} name="実績売上" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div style={{ background: '#fff', borderRadius: 16, padding: isMobile ? '16px' : '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: COLORS.navy }}>チャネル別年間貢献</h3>
          <ResponsiveContainer width="100%" height={isMobile ? 160 : 180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={isMobile ? 40 : 50} outerRadius={isMobile ? 65 : 80} paddingAngle={3} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => fmtM(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#555', flex: 1 }}>{d.name}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.navy }}>{fmtM(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cumulative Chart */}
      <div style={{ background: '#fff', borderRadius: 16, padding: isMobile ? '16px' : '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: COLORS.navy }}>累計売上推移</h3>
        <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.darkBlue} stopOpacity={0.2} />
                <stop offset="95%" stopColor={COLORS.darkBlue} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `${Math.round(v / 100000000 * 10) / 10}億`} tick={{ fontSize: 9, fill: '#888' }} axisLine={false} tickLine={false} width={36} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="累計目標" stroke={COLORS.darkBlue} strokeWidth={2.5} fill="url(#cumGrad)" name="累計目標" dot={{ r: 3, fill: COLORS.darkBlue }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Table */}
      <div style={{ background: '#fff', borderRadius: 16, padding: isMobile ? '14px 12px' : '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: COLORS.navy }}>月次詳細テーブル</h3>
        <div style={{ minWidth: 900 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: COLORS.darkNavy, color: '#fff' }}>
                {['月', 'IG ACC', 'IGリスト', 'IG売上', 'YT ACC', 'YTリスト', 'YT売上', 'TH ACC', 'THリスト', 'TH売上', 'JVリスト', 'JV売上', '月間合計', '累計売上'].map(h => (
                  <th key={h} style={{ padding: '9px 7px', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROADMAP_DATA.map((row, i) => (
                <tr key={row.month} style={{ background: i % 2 === 0 ? '#fafafa' : '#fff', borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '7px', textAlign: 'center', fontWeight: 700, color: COLORS.navy }}>{row.month}</td>
                  <td style={{ padding: '7px', textAlign: 'center', color: '#555' }}>{row.ig.acc}</td>
                  <td style={{ padding: '7px', textAlign: 'center', color: '#555' }}>{row.ig.lists.toLocaleString()}</td>
                  <td style={{ padding: '7px', textAlign: 'right', color: COLORS.instagram, fontWeight: 600 }}>{fmt(row.ig.revenue)}</td>
                  <td style={{ padding: '7px', textAlign: 'center', color: '#555' }}>{row.yt.acc}</td>
                  <td style={{ padding: '7px', textAlign: 'center', color: '#555' }}>{row.yt.lists.toLocaleString()}</td>
                  <td style={{ padding: '7px', textAlign: 'right', color: '#CC0000', fontWeight: 600 }}>{fmt(row.yt.revenue)}</td>
                  <td style={{ padding: '7px', textAlign: 'center', color: '#555' }}>{row.th.acc}</td>
                  <td style={{ padding: '7px', textAlign: 'center', color: '#555' }}>{row.th.lists.toLocaleString()}</td>
                  <td style={{ padding: '7px', textAlign: 'right', color: '#555', fontWeight: 600 }}>{fmt(row.th.revenue)}</td>
                  <td style={{ padding: '7px', textAlign: 'center', color: '#555' }}>{row.jv.lists.toLocaleString()}</td>
                  <td style={{ padding: '7px', textAlign: 'right', color: '#0066CC', fontWeight: 600 }}>{fmt(row.jv.revenue)}</td>
                  <td style={{ padding: '7px', textAlign: 'right', fontWeight: 700, color: COLORS.navy }}>{fmt(row.total)}</td>
                  <td style={{ padding: '7px', textAlign: 'right', fontWeight: 700, color: COLORS.darkGreen }}>{fmt(row.cumulative)}</td>
                </tr>
              ))}
              <tr style={{ background: COLORS.darkNavy, color: '#fff', fontWeight: 700 }}>
                {['合計', '225', '14,460', '¥144,600,000', '45', '9,320', '¥139,800,000', '140', '7,880', '¥39,400,000', '800', '¥16,000,000', '¥339,800,000', '¥339,800,000'].map((v, i) => (
                  <td key={i} style={{ padding: '9px 7px', textAlign: i === 0 ? 'center' : [3,6,9,11,12,13].includes(i) ? 'right' : 'center' }}>{v}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
