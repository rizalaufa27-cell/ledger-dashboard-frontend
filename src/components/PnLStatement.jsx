import { useState, useRef } from "react";
import { getPnlLineDetail } from "../services/api";

// Baris-baris "besar" yang ditonjolkan (subtotal utama dalam alur P&L)
const MAJOR_SUBTOTALS = new Set([
  "gross_sales",
  "gross_sales_before_tax",
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

// Tabel rincian transaksi yang muncul pas baris di-expand. Sengaja ringkas:
// cuma kolom yang penting buat rekon (tanggal, voucher, keterangan, debit,
// credit), bukan semua ~21 kolom ledger.
function LineDetailTable({ rows }) {
  if (!rows || rows.length === 0) {
    return (
      <div style={{ padding: "10px 20px", fontSize: 12, color: "var(--text-muted)" }}>
        Tidak ada transaksi yang cocok.
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto", padding: "4px 0 10px 20px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ color: "var(--text-muted)", textAlign: "left" }}>
            <th style={{ padding: "4px 8px", fontWeight: 500 }}>Tanggal</th>
            <th style={{ padding: "4px 8px", fontWeight: 500 }}>No. Voucher</th>
            <th style={{ padding: "4px 8px", fontWeight: 500 }}>Keterangan</th>
            <th style={{ padding: "4px 8px", fontWeight: 500, textAlign: "right" }}>Debit</th>
            <th style={{ padding: "4px 8px", fontWeight: 500, textAlign: "right" }}>Credit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
              <td style={{ padding: "4px 8px", whiteSpace: "nowrap" }}>{row["posting date"] || "-"}</td>
              <td style={{ padding: "4px 8px", whiteSpace: "nowrap" }}>{row["voucher no"] || "-"}</td>
              <td style={{ padding: "4px 8px" }}>{row["remarks"] || "-"}</td>
              <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "var(--font-mono)" }}>
                {row["debit (idr)"] ? formatIDR(Number(row["debit (idr)"])) : "-"}
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "var(--font-mono)" }}>
                {row["credit (idr)"] ? formatIDR(Number(row["credit (idr)"])) : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length >= 200 && (
        <div style={{ padding: "6px 8px", fontSize: 11, color: "var(--text-muted)" }}>
          Menampilkan 200 transaksi pertama. Buka tab Transaksi untuk daftar lengkap.
        </div>
      )}
    </div>
  );
}

function PnLStatement({ data, loading, month, costCenter }) {
  const [expandedId, setExpandedId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailRows, setDetailRows] = useState(null);

  // Cache di memori komponen: key "month|costCenter|lineId" -> rows.
  // Nge-collapse lalu expand baris yang sama nggak perlu fetch ulang.
  const cacheRef = useRef({});

  async function handleRowClick(row) {
    // Cuma baris "detail" ASLI (punya kode akun) yang bisa di-drill-down.
    // Baris subtotal dan baris "(Before Tax)" (displayAsDetail) di-skip.
    if (row.type !== "detail") return;

    if (expandedId === row.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(row.id);
    setDetailError("");

    const cacheKey = `${month}|${costCenter || "all"}|${row.id}`;
    const cached = cacheRef.current[cacheKey];
    if (cached) {
      setDetailRows(cached);
      return;
    }

    setDetailLoading(true);
    setDetailRows(null);
    try {
      const result = await getPnlLineDetail(month, row.id, costCenter);
      cacheRef.current[cacheKey] = result.rows;
      setDetailRows(result.rows);
    } catch (err) {
      console.error(err);
      setDetailError(err.message || "Gagal mengambil rincian transaksi.");
    } finally {
      setDetailLoading(false);
    }
  }

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
        // displayAsDetail: true -> baris ini SECARA HITUNGAN subtotal (hasil
        // formula, misal Penjualan x 1.11), tapi SECARA TAMPILAN dibikin
        // kayak baris detail biasa (nggak bold/uppercase), karena dia
        // rincian, bukan total akhir dari suatu section.
        const isSubtotal = row.type === "subtotal" && !row.displayAsDetail;
        const isMajor = MAJOR_SUBTOTALS.has(row.id);
        const isClickable = row.type === "detail";
        const isExpanded = expandedId === row.id;

        return (
          <div key={row.id}>
            <div
              onClick={() => handleRowClick(row)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: isMajor ? "12px 10px" : "7px 0",
                paddingLeft: isSubtotal ? 0 : 20,
                marginTop: isMajor ? 6 : 0,
                marginBottom: isMajor ? 6 : 0,
                background: isExpanded ? "var(--surface-raised)" : isMajor ? "var(--surface-raised)" : "transparent",
                borderRadius: isMajor ? 6 : 0,
                borderBottom: isMajor ? "none" : "1px solid var(--border)",
                fontWeight: isSubtotal ? 600 : 400,
                cursor: isClickable ? "pointer" : "default",
              }}
              title={isClickable ? "Klik untuk lihat rincian transaksi" : undefined}
            >
              <span
                style={{
                  color: isSubtotal ? "var(--text-primary)" : "var(--text-muted)",
                  fontSize: isMajor ? 14 : 13,
                  textTransform: isMajor ? "uppercase" : "none",
                  letterSpacing: isMajor ? "0.02em" : "normal",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {isClickable && (
                  <span style={{ fontSize: 10, opacity: 0.6 }}>{isExpanded ? "▾" : "▸"}</span>
                )}
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

            {isExpanded && (
              <div style={{ background: "rgba(255,255,255,0.02)" }}>
                {detailLoading && (
                  <div style={{ padding: "10px 20px", fontSize: 12, color: "var(--text-muted)" }}>
                    Memuat rincian transaksi...
                  </div>
                )}
                {detailError && (
                  <div style={{ padding: "10px 20px", fontSize: 12, color: "var(--accent-negative)" }}>
                    ⚠ {detailError}
                  </div>
                )}
                {!detailLoading && !detailError && <LineDetailTable rows={detailRows} />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default PnLStatement;
