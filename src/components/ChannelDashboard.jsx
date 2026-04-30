import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { FaInstagram, FaYoutube, FaThreads, FaHandshake, FaXTwitter } from 'react-icons/fa6';
import { MONTHS } from '../data/constants';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { G } from '../styles/theme';
import { fmtM } from '../lib/formatters';

const CHANNEL_ICONS = { instagram: FaInstagram, x: FaXTwitter, threads: FaThreads, youtube: FaYoutube, jv: FaHandshake };

function getTheme(channel) {
  return G[channel === 'instagram' ? 'ig' : channel === 'x' ? 'x' : channel === 'youtube' ? 'yt' : channel === 'threads' ? 'th' : 'jv'];
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: G.surface, borderRadius: G.radiusMd, padding: '10px 14px', boxShadow: G.shadow3, border: `1px solid ${G.border}` }}>
      <p style={{ fontWeight: 600, marginBottom: 6, color: G.text1, fontSize: 13 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 2, alignItems: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: G.text2 }}>{p.name}:</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: G.text1 }}>
            {typeof p.value === 'number' && p.name.includes('売上') ? fmtM(p.value) : p.value?.toLocaleString?.()}
          </span>
        </div>
      ))}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: G.surface, borderRadius: G.radiusLg, border: `1px solid ${G.border}`, boxShadow: G.shadow1, ...style }}>
      {children}
    </div>
  );
}

const ROW_DEFS = [
  { prefix: 'w', label: 'リスト',  unit: '件' },
  { prefix: 'm', label: '面談',    unit: '件' },
  { prefix: 'c', label: '成約',    unit: '件' },
];

function WeekInput({ month, channel, weekData, onUpdate, listPrice, isMobile, roadmapData }) {
  const theme = getTheme(channel);
  const sum = (prefix) => [1,2,3,4].reduce((s, n) => s + (Number(weekData[`${prefix}${n}`]) || 0), 0);
  const totalLists     = sum('w');
  const totalMeetings  = sum('m');
  const totalContracts = sum('c');
  const revenue = totalLists * listPrice;
  const meetingRate = totalLists > 0 ? Math.round((totalMeetings / totalLists) * 100) : 0;
  const closeRate   = totalMeetings > 0 ? Math.round((totalContracts / totalMeetings) * 100) : 0;

  const target = useMemo(() => {
    const row = roadmapData.find(r => r.month === month);
    return row?.[channel]?.lists || 0;
  }, [month, channel, roadmapData]);

  const rate    = target > 0 ? Math.round((totalLists / target) * 100) : 0;
  const chipBg  = rate >= 100 ? G.successContainer : rate >= 70 ? G.warningContainer : G.errorContainer;
  const chipCol = rate >= 100 ? G.success          : rate >= 70 ? G.warning          : G.error;

  return (
    <Card style={{ padding: isMobile ? 14 : 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: G.text1 }}>{month}</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {target > 0 && (
            <span style={{ background: chipBg, color: chipCol, borderRadius: G.radiusPill, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{rate}%</span>
          )}
          <span style={{ background: theme.container, color: theme.main, borderRadius: G.radiusPill, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
            目標 {target.toLocaleString()}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(4, 1fr)', gap: 6, marginBottom: 12, alignItems: 'center' }}>
        <div />
        {[1,2,3,4].map(i => (
          <div key={i} style={{ fontSize: 11, color: G.text3, textAlign: 'center' }}>第{i}週</div>
        ))}
        {ROW_DEFS.map(({ prefix, label }) => (
          <React.Fragment key={prefix}>
            <div style={{ fontSize: 11, fontWeight: 600, color: G.text2, paddingLeft: 2 }}>{label}</div>
            {[1,2,3,4].map(i => {
              const key = `${prefix}${i}`;
              const v = Number(weekData[key]) || 0;
              return (
                <input
                  key={key}
                  type="number" min="0"
                  value={weekData[key] ?? 0}
                  onChange={e => onUpdate(month, channel, key, e.target.value)}
                  style={{
                    width: '100%', padding: '6px 4px', borderRadius: G.radius,
                    border: `1.5px solid ${v > 0 ? theme.main : G.border}`,
                    background: v > 0 ? theme.container : G.bg,
                    fontSize: 14, fontWeight: 600, textAlign: 'center', color: G.text1,
                    outline: 'none', transition: G.transition,
                  }}
                  onFocus={e => { e.target.style.borderColor = theme.main; e.target.style.boxShadow = `0 0 0 3px ${theme.main}22`; }}
                  onBlur={e => { e.target.style.boxShadow = 'none'; }}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, paddingTop: 10, borderTop: `1px solid ${G.border}` }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: G.text3 }}>月間リスト</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: theme.main, lineHeight: 1.2 }}>{totalLists.toLocaleString()}</div>
          <div style={{ fontSize: 10, color: G.text3 }}>{fmtM(revenue)}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: G.text3 }}>面談</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: G.text1, lineHeight: 1.2 }}>{totalMeetings.toLocaleString()}</div>
          <div style={{ fontSize: 10, color: G.text3 }}>面談率 {meetingRate}%</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: G.text3 }}>成約</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: G.success, lineHeight: 1.2 }}>{totalContracts.toLocaleString()}</div>
          <div style={{ fontSize: 10, color: G.text3 }}>成約率 {closeRate}%</div>
        </div>
        {target > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
            <div style={{ fontSize: 10, color: G.text3, textAlign: 'center' }}>リスト達成率</div>
            <div style={{ background: G.border, borderRadius: 4, height: 6, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, rate)}%`, height: '100%', background: rate >= 100 ? G.success : theme.main, borderRadius: 4, transition: 'width 0.5s' }} />
            </div>
            <div style={{ fontSize: 10, color: G.text3, textAlign: 'center' }}>{rate}%</div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function ChannelDashboard({ channel, channelConfig, roadmapData, monthKpi, inputData, onUpdate }) {
  const { isMobile, isTablet } = useBreakpoint();
  if (!channelConfig) return null;

  const theme    = getTheme(channel);
  const listPrice = channelConfig.list_price;
  const IconComp  = CHANNEL_ICONS[channel] || FaHandshake;

  const sumWeeks = (wd, prefix) =>
    [1,2,3,4].reduce((a, n) => a + (Number(wd?.[`${prefix}${n}`]) || 0), 0);

  const chartData = useMemo(() => roadmapData.map(row => {
    const weekData = inputData?.[row.month]?.[channel] || {};
    const actual   = sumWeeks(weekData, 'w');
    const target   = row[channel]?.lists || 0;
    return {
      month:    row.month,
      目標リスト: target,
      実績リスト: actual || null,
      目標売上:   row[channel]?.revenue || 0,
      実績売上:   actual * listPrice || null,
    };
  }), [inputData, channel, roadmapData, listPrice]);

  const totalActual = useMemo(() => roadmapData.reduce((sum, row) => {
    const wd = inputData?.[row.month]?.[channel] || {};
    return sum + sumWeeks(wd, 'w');
  }, 0), [inputData, channel, roadmapData]);

  const totalTarget  = roadmapData.reduce((s, r) => s + (r[channel]?.lists    || 0), 0);
  const totalRevenue = roadmapData.reduce((s, r) => s + (r[channel]?.revenue  || 0), 0);
  const overallRate  = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;

  const inputCols = isMobile ? 1 : isTablet ? 2 : 3;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 20 }}>
      {/* Hero Card */}
      <Card style={{ padding: isMobile ? '20px' : '24px 28px', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: theme.gradient }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, marginTop: 4 }}>
          <div style={{ width: 48, height: 48, borderRadius: G.radiusMd, background: theme.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconComp size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: G.text1 }}>{channelConfig.name}</div>
            <div style={{ fontSize: 12, color: G.text2 }}>担当: {channelConfig.manager} · リスト単価 ¥{listPrice.toLocaleString()}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: isMobile ? 12 : 16 }}>
          {[
            { label: '年間リスト目標', value: totalTarget.toLocaleString() },
            { label: '年間売上目標',   value: fmtM(totalRevenue) },
            { label: '実績リスト数',   value: totalActual.toLocaleString() },
            { label: '達成率',         value: `${overallRate}%` },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: G.bg, borderRadius: G.radiusMd, padding: '12px 14px', border: `1px solid ${G.border}` }}>
              <div style={{ fontSize: 11, color: G.text3, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: G.text1 }}>{value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 14 : 16 }}>
        <Card style={{ padding: isMobile ? 14 : 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: G.text1, marginBottom: 14 }}>月次リスト数（目標 vs 実績）</div>
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 200}>
            <BarChart data={chartData} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke={G.border} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: G.text3 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: G.text3 }} axisLine={false} tickLine={false} width={38} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="目標リスト" fill={`${theme.main}28`} radius={[3,3,0,0]} name="目標" />
              <Bar dataKey="実績リスト" fill={theme.main} radius={[3,3,0,0]} name="実績" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card style={{ padding: isMobile ? 14 : 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: G.text1, marginBottom: 14 }}>月次売上（目標 vs 実績）</div>
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={G.border} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: G.text3 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v=>`${Math.round(v/10000)}万`} tick={{ fontSize: 10, fill: G.text3 }} axisLine={false} tickLine={false} width={42} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="目標売上" stroke={`${theme.main}60`} strokeWidth={2} dot={false} strokeDasharray="5 5" name="目標売上" />
              <Line type="monotone" dataKey="実績売上" stroke={theme.main} strokeWidth={2.5} dot={{ r: 3, fill: theme.main }} name="実績売上" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Weekly Input */}
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: G.text1, marginBottom: 14 }}>週次リスト入力</div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${inputCols}, 1fr)`, gap: isMobile ? 10 : 14 }}>
          {MONTHS.map(month => (
            <WeekInput
              key={month}
              month={month}
              channel={channel}
              weekData={inputData?.[month]?.[channel] || { w1: 0, w2: 0, w3: 0, w4: 0 }}
              onUpdate={onUpdate}
              listPrice={listPrice}
              isMobile={isMobile}
              roadmapData={roadmapData}
            />
          ))}
        </div>
      </div>

      {/* KPI Goals */}
      <Card style={{ padding: isMobile ? 14 : '20px 24px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: G.text1, marginBottom: 14 }}>月間KPI目標</div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {MONTHS.map(month => {
            const kpi = monthKpi?.[month]?.[channel] || '-';
            return (
              <div key={month} style={{ background: theme.container, borderRadius: G.radiusMd, padding: '10px 12px', borderLeft: `3px solid ${theme.main}` }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: G.text1, marginBottom: 4 }}>{month}</div>
                <div style={{ fontSize: 11, color: G.text2, whiteSpace: 'pre-line', lineHeight: 1.5 }}>{kpi}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
