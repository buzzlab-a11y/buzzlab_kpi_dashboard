import React, { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine,
} from 'recharts';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { G } from '../styles/theme';

const fmtM = v => {
  if (v >= 100000000) return `¥${(v / 100000000).toFixed(2)}億`;
  if (v >= 10000)     return `¥${Math.round(v / 10000).toLocaleString()}万`;
  return `¥${v.toLocaleString()}`;
};
const fmt = v => `¥${Number(v).toLocaleString()}`;

const CH_COLORS = { instagram: '#833AB4', youtube: '#ff0000', threads: '#555555', jv: '#0066cc' };

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: G.surface, borderRadius: G.radiusMd, padding: '10px 14px', boxShadow: G.shadow3, border: `1px solid ${G.border}`, minWidth: 160 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: G.text1, marginBottom: 8 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: G.text2, flex: 1 }}>{p.name}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: G.text1 }}>
            {typeof p.value === 'number' && p.value > 10000 ? fmtM(p.value) : p.value?.toLocaleString?.()}
          </span>
        </div>
      ))}
    </div>
  );
}

function MetricCard({ label, value, sub, color, chip }) {
  return (
    <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: G.radiusLg, padding: '20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 12, color: G.text2, fontWeight: 500 }}>{label}</span>
        {chip && <span style={{ background: color + '18', color, borderRadius: G.radiusPill, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{chip}</span>}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: G.text1, letterSpacing: -0.5, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: G.text3 }}>{sub}</div>}
    </div>
  );
}

function ProgressBar({ value, max, color = G.primary }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ background: G.surfaceVariant, borderRadius: 4, height: 8, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.8s cubic-bezier(0.2,0,0,1)' }} />
    </div>
  );
}

function Card({ title, children, style }) {
  return (
    <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: G.radiusLg, padding: '20px', ...style }}>
      {title && <h3 style={{ fontSize: 14, fontWeight: 600, color: G.text1, marginBottom: 16 }}>{title}</h3>}
      {children}
    </div>
  );
}

export default function OverviewDashboard({ inputData, roadmapData, channelAnnual, channelConfigs }) {
  const { isMobile, isTablet } = useBreakpoint();

  const { chartData, totalActualRevenue } = useMemo(() => {
    let total = 0;
    const data = roadmapData.map(row => {
      const actualRevenue = ['instagram','youtube','threads','jv'].reduce((s, ch) => {
        const lists = Object.values(inputData?.[row.month]?.[ch] || {}).reduce((a, b) => a + (Number(b)||0), 0);
        return s + lists * (channelConfigs[ch]?.list_price || 0);
      }, 0);
      total += actualRevenue;
      return {
        month: row.month,
        目標売上: row.total,
        累計目標: row.cumulative,
        実績売上: actualRevenue || null,
      };
    });
    return { chartData: data, totalActualRevenue: total };
  }, [inputData, roadmapData, channelConfigs]);

  const totalTargetRevenue = roadmapData[roadmapData.length - 1]?.cumulative || 0;
  const achieveMonth       = roadmapData.find(r => r.cumulative >= 200000000)?.month || '-';
  const overAmount         = totalTargetRevenue - 200000000;
  const achievementRate    = Math.min(100, Math.round((totalActualRevenue / 200000000) * 100));

  const pieData = ['instagram','youtube','threads','jv'].map(ch => ({
    name:  channelConfigs[ch]?.name || ch,
    value: channelAnnual[ch]?.revenue || 0,
    color: CH_COLORS[ch],
  }));

  // チャンネル別のシェア（派生計算）
  const totalRevenue = pieData.reduce((s, d) => s + d.value, 0);
  const kpiCols    = isMobile ? 2 : isTablet ? 3 : 6;
  const chartCols  = isMobile ? '1fr' : '2fr 1fr';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
        borderRadius: G.radiusLg,
        padding: isMobile ? '24px 20px' : '32px 36px',
        color: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute',top:-50,right:-50,width:200,height:200,background:'rgba(255,255,255,0.03)',borderRadius:'50%' }} />
        <div style={{ fontSize:11,letterSpacing:2,opacity:0.6,marginBottom:6,fontWeight:500 }}>BUZZLAB 2026</div>
        <h2 style={{ fontSize:isMobile?20:28,fontWeight:800,letterSpacing:-0.5,marginBottom:4,color:'#fff' }}>🚀 2億円達成ロードマップ</h2>
        <p style={{ fontSize:13,opacity:0.7,marginBottom:24 }}>2026年4月〜12月 · 5チャネル集客戦略</p>
        <div style={{ display:'flex',gap:isMobile?20:40,flexWrap:'wrap' }}>
          {[
            { label:'年間目標売上', value: fmtM(totalTargetRevenue) },
            { label:'2億達成予定', value: achieveMonth },
            { label:'目標超過額',  value: fmtM(overAmount) },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize:10,opacity:0.6,marginBottom:2 }}>{label}</div>
              <div style={{ fontSize:isMobile?16:22,fontWeight:700 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display:'grid',gridTemplateColumns:`repeat(${kpiCols},1fr)`,gap:12 }}>
        <MetricCard
          label="累計実績売上" value={fmtM(totalActualRevenue)}
          sub="入力済みデータから算出" color={G.success}
          chip={`${achievementRate}%`}
        />
        <MetricCard
          label="年間目標売上" value={fmtM(totalTargetRevenue)}
          sub={`9ヶ月累計 · 2億達成: ${achieveMonth}`} color={G.primary}
        />
        {['instagram','youtube','threads','jv'].map(ch => {
          const cfg  = channelConfigs[ch];
          const ann  = channelAnnual[ch];
          const share = totalRevenue > 0 ? ((ann.revenue / totalRevenue) * 100).toFixed(1) : '0';
          return (
            <MetricCard
              key={ch}
              label={`${cfg.name}年間貢献`}
              value={fmtM(ann.revenue)}
              sub={`${ann.lists.toLocaleString()}リスト`}
              color={CH_COLORS[ch]}
              chip={`${share}%`}
            />
          );
        })}
      </div>

      {/* Progress */}
      <Card>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12 }}>
          <div>
            <div style={{ fontWeight:600,color:G.text1,fontSize:14 }}>2億円達成進捗</div>
            <div style={{ fontSize:12,color:G.text3,marginTop:2 }}>
              実績: {fmtM(totalActualRevenue)} / 目標: ¥200,000,000
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:28,fontWeight:800,color:achievementRate>=100?G.success:G.primary,lineHeight:1 }}>{achievementRate}%</div>
            <div style={{ fontSize:11,color:G.text3 }}>達成率</div>
          </div>
        </div>
        <ProgressBar value={totalActualRevenue} max={200000000} color={achievementRate>=100?G.success:G.primary} />
        <div style={{ display:'flex',justifyContent:'space-between',marginTop:6,fontSize:11,color:G.text3 }}>
          <span>¥0</span>
          <span style={{ color:G.primary,fontWeight:600 }}>2億 達成ライン</span>
          <span>{fmtM(totalTargetRevenue)}</span>
        </div>
      </Card>

      {/* Charts */}
      <div style={{ display:'grid',gridTemplateColumns:chartCols,gap:16 }}>
        <Card title="月次売上推移（目標 vs 実績）">
          <ResponsiveContainer width="100%" height={isMobile?180:240}>
            <BarChart data={chartData} barGap={3} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 0" stroke={G.border} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize:11,fill:G.text3 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v=>`${Math.round(v/10000000)}千万`} tick={{ fontSize:10,fill:G.text3 }} axisLine={false} tickLine={false} width={42} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="目標売上" fill={G.primary+'28'} radius={[4,4,0,0]} name="目標売上" />
              <Bar dataKey="実績売上" fill={G.primary} radius={[4,4,0,0]} name="実績売上" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="チャネル別年間貢献">
          <ResponsiveContainer width="100%" height={isMobile?140:160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={isMobile?36:44} outerRadius={isMobile?60:72} paddingAngle={2} dataKey="value">
                {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={v=>fmtM(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex',flexDirection:'column',gap:8,marginTop:8 }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display:'flex',alignItems:'center',gap:8 }}>
                <div style={{ width:10,height:10,borderRadius:2,background:d.color,flexShrink:0 }} />
                <span style={{ fontSize:12,color:G.text2,flex:1 }}>{d.name}</span>
                <span style={{ fontSize:12,fontWeight:600,color:G.text1 }}>{fmtM(d.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Cumulative Chart */}
      <Card title="累計売上推移（目標ライン）">
        <ResponsiveContainer width="100%" height={isMobile?150:200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={G.primary} stopOpacity={0.15} />
                <stop offset="95%" stopColor={G.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 0" stroke={G.border} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize:11,fill:G.text3 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v=>`${(v/100000000).toFixed(1)}億`} tick={{ fontSize:10,fill:G.text3 }} axisLine={false} tickLine={false} width={38} />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine y={200000000} stroke={G.success} strokeDasharray="6 3" label={{ value:'2億', position:'right', fontSize:11, fill:G.success }} />
            <Area type="monotone" dataKey="累計目標" stroke={G.primary} strokeWidth={2.5} fill="url(#cumGrad)" name="累計目標" dot={{ r:3,fill:G.primary,strokeWidth:0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Monthly Table */}
      <Card style={{ overflowX:'auto', padding:'20px 0' }}>
        <h3 style={{ fontSize:14,fontWeight:600,color:G.text1,padding:'0 20px',marginBottom:12 }}>月次詳細テーブル</h3>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:900 }}>
            <thead>
              <tr style={{ background:G.surfaceVariant }}>
                {['月','IG ACC','IGリスト','IG売上','YT ACC','YTリスト','YT売上','TH ACC','THリスト','TH売上','JVリスト','JV売上','月間合計','累計売上'].map(h => (
                  <th key={h} style={{ padding:'10px 8px',textAlign:'center',fontWeight:600,color:G.text2,whiteSpace:'nowrap',borderBottom:`2px solid ${G.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roadmapData.map(row => (
                <tr key={row.month} style={{ borderBottom:`1px solid ${G.border}` }}
                  onMouseEnter={e=>e.currentTarget.style.background=G.surfaceVariant}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  <td style={{ padding:'9px 8px',textAlign:'center',fontWeight:700,color:G.text1 }}>{row.month}</td>
                  <td style={{ padding:'9px 8px',textAlign:'center',color:G.text2 }}>{row.instagram?.acc ?? 0}</td>
                  <td style={{ padding:'9px 8px',textAlign:'center',color:G.text2 }}>{(row.instagram?.lists ?? 0).toLocaleString()}</td>
                  <td style={{ padding:'9px 8px',textAlign:'right',color:'#833AB4',fontWeight:600 }}>{fmt(row.instagram?.revenue ?? 0)}</td>
                  <td style={{ padding:'9px 8px',textAlign:'center',color:G.text2 }}>{row.youtube?.acc ?? 0}</td>
                  <td style={{ padding:'9px 8px',textAlign:'center',color:G.text2 }}>{(row.youtube?.lists ?? 0).toLocaleString()}</td>
                  <td style={{ padding:'9px 8px',textAlign:'right',color:'#cc0000',fontWeight:600 }}>{fmt(row.youtube?.revenue ?? 0)}</td>
                  <td style={{ padding:'9px 8px',textAlign:'center',color:G.text2 }}>{row.threads?.acc ?? 0}</td>
                  <td style={{ padding:'9px 8px',textAlign:'center',color:G.text2 }}>{(row.threads?.lists ?? 0).toLocaleString()}</td>
                  <td style={{ padding:'9px 8px',textAlign:'right',color:G.text2,fontWeight:600 }}>{fmt(row.threads?.revenue ?? 0)}</td>
                  <td style={{ padding:'9px 8px',textAlign:'center',color:G.text2 }}>{(row.jv?.lists ?? 0).toLocaleString()}</td>
                  <td style={{ padding:'9px 8px',textAlign:'right',color:'#0066cc',fontWeight:600 }}>{fmt(row.jv?.revenue ?? 0)}</td>
                  <td style={{ padding:'9px 8px',textAlign:'right',fontWeight:700,color:G.text1 }}>{fmt(row.total)}</td>
                  <td style={{ padding:'9px 8px',textAlign:'right',fontWeight:700,color:G.success }}>{fmt(row.cumulative)}</td>
                </tr>
              ))}
              {/* 合計行 */}
              {(() => {
                const totals = {
                  igAcc:  roadmapData.reduce((s,r) => s+(r.instagram?.acc||0), 0),
                  igList: roadmapData.reduce((s,r) => s+(r.instagram?.lists||0), 0),
                  igRev:  roadmapData.reduce((s,r) => s+(r.instagram?.revenue||0), 0),
                  ytAcc:  roadmapData.reduce((s,r) => s+(r.youtube?.acc||0), 0),
                  ytList: roadmapData.reduce((s,r) => s+(r.youtube?.lists||0), 0),
                  ytRev:  roadmapData.reduce((s,r) => s+(r.youtube?.revenue||0), 0),
                  thAcc:  roadmapData.reduce((s,r) => s+(r.threads?.acc||0), 0),
                  thList: roadmapData.reduce((s,r) => s+(r.threads?.lists||0), 0),
                  thRev:  roadmapData.reduce((s,r) => s+(r.threads?.revenue||0), 0),
                  jvList: roadmapData.reduce((s,r) => s+(r.jv?.lists||0), 0),
                  jvRev:  roadmapData.reduce((s,r) => s+(r.jv?.revenue||0), 0),
                };
                const grandTotal = totals.igRev + totals.ytRev + totals.thRev + totals.jvRev;
                return (
                  <tr style={{ background:G.primary+'0a',borderTop:`2px solid ${G.primary}` }}>
                    <td style={{ padding:'10px 8px',textAlign:'center',fontWeight:700,color:G.text1 }}>合計</td>
                    <td style={{ padding:'10px 8px',textAlign:'center',fontWeight:700,color:G.text1 }}>{totals.igAcc}</td>
                    <td style={{ padding:'10px 8px',textAlign:'center',fontWeight:700,color:G.text1 }}>{totals.igList.toLocaleString()}</td>
                    <td style={{ padding:'10px 8px',textAlign:'right',fontWeight:700,color:'#833AB4' }}>{fmt(totals.igRev)}</td>
                    <td style={{ padding:'10px 8px',textAlign:'center',fontWeight:700,color:G.text1 }}>{totals.ytAcc}</td>
                    <td style={{ padding:'10px 8px',textAlign:'center',fontWeight:700,color:G.text1 }}>{totals.ytList.toLocaleString()}</td>
                    <td style={{ padding:'10px 8px',textAlign:'right',fontWeight:700,color:'#cc0000' }}>{fmt(totals.ytRev)}</td>
                    <td style={{ padding:'10px 8px',textAlign:'center',fontWeight:700,color:G.text1 }}>{totals.thAcc}</td>
                    <td style={{ padding:'10px 8px',textAlign:'center',fontWeight:700,color:G.text1 }}>{totals.thList.toLocaleString()}</td>
                    <td style={{ padding:'10px 8px',textAlign:'right',fontWeight:700,color:G.text2 }}>{fmt(totals.thRev)}</td>
                    <td style={{ padding:'10px 8px',textAlign:'center',fontWeight:700,color:G.text1 }}>{totals.jvList.toLocaleString()}</td>
                    <td style={{ padding:'10px 8px',textAlign:'right',fontWeight:700,color:'#0066cc' }}>{fmt(totals.jvRev)}</td>
                    <td style={{ padding:'10px 8px',textAlign:'right',fontWeight:700,color:G.text1 }}>{fmt(grandTotal)}</td>
                    <td style={{ padding:'10px 8px',textAlign:'right',fontWeight:700,color:G.success }}>{fmt(grandTotal)}</td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
