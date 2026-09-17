import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

function formatCompactIDR(value) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return value;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      style={{
        background: "#1d2429",
        border: "1px solid #262d32",
        borderRadius: 6,
        padding: "10px 14px",
        fontFamily: "IBM Plex Mono, monospace",
        fontSize: 12,
      }}
    >
      <div style={{ color: "#8b959b", marginBottom: 6 }}>{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: Rp {Math.round(entry.value).toLocaleString("id-ID")}
        </div>
      ))}
    </div>
  );
}

function MonthlySummaryChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="empty-state">Belum ada data ringkasan bulanan.</div>;
  }

  const chartData = data.map((d) => ({
    ...d,
    grossProfit: d.revenue - d.cogs,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 12, bottom: 0 }}>
  <CartesianGrid stroke="#262d32" vertical={false} />
  <XAxis
    dataKey="month"
    tick={{ fill: "#8b959b", fontSize: 11, fontFamily: "IBM Plex Mono, monospace" }}
    axisLine={{ stroke: "#262d32" }}
    tickLine={false}
  />
  <YAxis
    width={56}
    tick={{ fill: "#8b959b", fontSize: 11, fontFamily: "IBM Plex Mono, monospace" }}
    axisLine={false}
    tickLine={false}
    tickFormatter={formatCompactIDR}
  />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Legend
          wrapperStyle={{ fontSize: 12, fontFamily: "Space Grotesk, sans-serif", color: "#8b959b" }}
        />
        <Bar dataKey="revenue" name="Revenue" fill="#3ddc97" radius={[3, 3, 0, 0]} />
        <Bar dataKey="cogs" name="COGS" fill="#e85d4d" radius={[3, 3, 0, 0]} />
        <Line
          type="monotone"
          dataKey="grossProfit"
          name="Gross Profit"
          stroke="#5b9ee8"
          strokeWidth={2}
          dot={{ r: 3, fill: "#5b9ee8" }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default MonthlySummaryChart;
