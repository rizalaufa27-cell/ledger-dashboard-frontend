function formatIDR(value) {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function KPICard({ label, value, format = "number", tone = "neutral" }) {
  const displayValue =
    format === "idr"
      ? formatIDR(value)
      : format === "percent"
      ? `${value.toFixed(2)}%`
      : value.toLocaleString("id-ID");

  const toneClass = tone === "positive" ? "positive" : tone === "negative" ? "negative" : "";

  return (
    <div className="kpi-cell">
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${toneClass}`}>{displayValue}</div>
    </div>
  );
}

export default KPICard;
