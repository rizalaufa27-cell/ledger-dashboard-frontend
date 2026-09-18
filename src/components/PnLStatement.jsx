// Baris-baris "besar" yang ditonjolkan (subtotal utama dalam alur P&L)
const MAJOR_SUBTOTALS = new Set([
  "gross_sales",
  "sales_discount",
  "net_sales",
  "total_cogs",
  "gross_profit",
  "total_opex",
  "ebitda",
  "total_other_income_expenses",
  "ebt",
]);

function formatIDR(value) {
  const sign = value < 0 ? "-" : "";
  return `${sign}Rp ${Math.abs(Math.round(value)).toLocaleString("id-ID")}`;
}

function PnLStatement({ data, loading }) {
  if (loading) {
    return <div className="empty-state">Memuat laporan laba rugi...</div>;
  }

  if (!data || !data.rows) {
    return <div className="empty-state">Belum ada data P&amp;L untuk bulan ini.</div>;
  }

  return (
    <div style={{ maxWidth: 620 }}>
      {data.costCenter && (
        <div
          style={{
            marginBottom: 16,
            padding: "8px 12px",
            background: "var(--accent-positive-dim)",
            border: "1px solid rgba(61, 220, 151, 0.3)",
            borderRadius: 6,
            fontSize: 12,
            color: "var(--accent-positive)",
            fontFamily: "var(--font-mono)",
          }}
        >
          Difilter untuk Cost Center: {data.costCenter}
        </div>
      )}

      {data.rows.map((row) => {
        const isSubtotal = row.type === "subtotal";
        const isMajor = MAJOR_SUBTOTALS.has(row.id);

        return (
          <div
            key={row.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: isMajor ? "12px 10px" : "7px 0",
              paddingLeft: isSubtotal ? 0 : 20,
              marginTop: isMajor ? 6 : 0,
              marginBottom: isMajor ? 6 : 0,
              background: isMajor ? "var(--surface-raised)" : "transparent",
              borderRadius: isMajor ? 6 : 0,
              borderBottom: isMajor ? "none" : "1px solid var(--border)",
              fontWeight: isSubtotal ? 600 : 400,
            }}
          >
            <span
              style={{
                color: isSubtotal ? "var(--text-primary)" : "var(--text-muted)",
                fontSize: isMajor ? 14 : 13,
                textTransform: isMajor ? "uppercase" : "none",
                letterSpacing: isMajor ? "0.02em" : "normal",
              }}
            >
              {row.label}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: isMajor ? 15 : 13,
                color:
                  row.value < 0
                    ? "var(--accent-negative)"
                    : isMajor
                    ? "var(--accent-positive)"
                    : "var(--text-primary)",
              }}
            >
              {formatIDR(row.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default PnLStatement;
