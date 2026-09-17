import { useEffect, useState } from "react";
import { getLedger, getMonthlySummary } from "../services/api";
import KPICard from "../components/KPICard";
import LedgerTable from "../components/LedgerTable";
import MonthlySummaryChart from "../components/MonthlySummaryChart";
import { ACCOUNT_GROUPS } from "../data/chartOfAccounts";
import { COA_LAMA_LIST } from "../data/coaLamaList";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function parseNumber(value) {
  if (!value) return 0;
  const cleaned = String(value).replace(/,/g, "");
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

function Dashboard() {
  const [month, setMonth] = useState("Januari");
  const [accountFilter, setAccountFilter] = useState("");
  const [customAccount, setCustomAccount] = useState("");
  const [coaLamaFilter, setCoaLamaFilter] = useState("");
  const [voucherFilter, setVoucherFilter] = useState("");
  const [rowLimit, setRowLimit] = useState(100);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [monthlySummary, setMonthlySummary] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const effectiveAccount = customAccount.trim() || accountFilter;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const result = await getLedger(
          month,
          { account: effectiveAccount, coaLama: coaLamaFilter, voucherNo: voucherFilter },
          rowLimit
        );
        setData(result);
      } catch (err) {
        console.error(err);
        setError(err.message || "Gagal mengambil data.");
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [month, effectiveAccount, coaLamaFilter, voucherFilter, rowLimit]);

  useEffect(() => {
    async function loadSummary() {
      setSummaryLoading(true);
      try {
        const result = await getMonthlySummary();
        setMonthlySummary(result);
      } catch (err) {
        console.error(err);
      } finally {
        setSummaryLoading(false);
      }
    }

    loadSummary();
  }, []);

  // KPI dihitung dari data yang SEDANG ditampilkan (setelah filter akun & limit)
  const totalDebit = data.reduce((sum, row) => sum + parseNumber(row["debit (idr)"]), 0);
  const totalCredit = data.reduce((sum, row) => sum + parseNumber(row["credit (idr)"]), 0);
  const totalBalance = data.reduce((sum, row) => sum + parseNumber(row["balance (idr)"]), 0);
  const totalVoucher = new Set(data.map((row) => row["voucher no"])).size;

  // Ringkasan bulan aktif (kalau ada di summary global)
  const currentMonthSummary = monthlySummary.find((s) => s.month?.startsWith(month));
  const revenue = currentMonthSummary?.revenue ?? 0;
  const cogs = currentMonthSummary?.cogs ?? 0;
  const grossProfit = revenue - cogs;
  const grossMargin = revenue === 0 ? 0 : (grossProfit / revenue) * 100;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Ledger Dashboard</h1>
          <div className="subtitle">Data langsung dari Google Sheets — {MONTHS.length} periode bulanan</div>
        </div>
        <div className="header-meta">
          SUMBER: GOOGLE SHEETS
          <br />
          BULAN AKTIF: {month.toUpperCase()}
        </div>
      </header>

      {error && <div className="state-banner error">⚠ {error}</div>}

      <div className="controls-row">
        <div className="control-group">
          <label htmlFor="month-select">Bulan</label>
          <select id="month-select" value={month} onChange={(e) => setMonth(e.target.value)}>
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
  <label htmlFor="account-select">Filter Akun</label>
  <select
    id="account-select"
    value={accountFilter}
    onChange={(e) => {
      setAccountFilter(e.target.value);
      setCustomAccount("");
    }}
    style={{ minWidth: 260 }}
  >
    <option value="">Semua akun</option>
    {ACCOUNT_GROUPS.map((group) => (
      <optgroup key={group.category} label={group.category}>
        {group.accounts.map((acc) => (
          <option key={acc.code} value={acc.code}>
            {acc.label}
          </option>
        ))}
      </optgroup>
    ))}
  </select>
</div>

        <div className="control-group">
          <label htmlFor="custom-account">Atau ketik kode akun</label>
          <input
            id="custom-account"
            type="text"
            placeholder="misal 201, 601..."
            value={customAccount}
            onChange={(e) => setCustomAccount(e.target.value)}
          />
        </div>

        <div className="control-group">
  <label htmlFor="coa-lama-filter">COA Lama</label>
  <select
    id="coa-lama-filter"
    value={coaLamaFilter}
    onChange={(e) => setCoaLamaFilter(e.target.value)}
    style={{ minWidth: 220 }}
  >
    <option value="">Semua COA Lama</option>
    {COA_LAMA_LIST.map((name) => (
      <option key={name} value={name}>{name}</option>
    ))}
  </select>
</div>

        <div className="control-group">
          <label htmlFor="voucher-no">Filter No. Voucher</label>
          <input
            id="voucher-no"
            type="text"
            placeholder="misal MP-DN-2026..."
            value={voucherFilter}
            onChange={(e) => setVoucherFilter(e.target.value)}
          />
        </div>

        <div className="control-group">
          <label htmlFor="row-limit">Tampilkan maks.</label>
          <select id="row-limit" value={rowLimit} onChange={(e) => setRowLimit(Number(e.target.value))}>
            <option value={50}>50 baris</option>
            <option value={100}>100 baris</option>
            <option value={500}>500 baris</option>
            <option value={2000}>2000 baris</option>
          </select>
        </div>
      </div>

      <div className="kpi-grid">
        <KPICard label="Revenue (bulan ini)" value={revenue} format="idr" tone="positive" />
        <KPICard label="COGS (bulan ini)" value={cogs} format="idr" tone="negative" />
        <KPICard label="Gross Profit" value={grossProfit} format="idr" tone={grossProfit >= 0 ? "positive" : "negative"} />
        <KPICard label="Gross Margin" value={grossMargin} format="percent" />
        <KPICard label="Voucher (hasil filter)" value={totalVoucher} format="number" />
        <KPICard label="Transaksi (hasil filter)" value={data.length} format="number" />
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Tren Bulanan</h2>
          <span className="panel-meta">Revenue vs COGS, semua bulan</span>
        </div>
        <div className="panel-body">
          {summaryLoading ? (
            <div className="empty-state">Memuat ringkasan...</div>
          ) : (
            <MonthlySummaryChart data={monthlySummary} />
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Transaksi — {month}</h2>
          <div style={{ textAlign: "right" }}>
            <div className="row-count">
              {loading ? "memuat..." : `menampilkan ${data.length} baris${effectiveAccount ? ` · filter akun: ${effectiveAccount}` : ""}`}
            </div>
            <div
              className="row-count"
              style={{
                color: totalBalance >= 0 ? "#3ddc97" : "#e85d4d",
                marginTop: 2,
              }}
            >
              Total Balance: Rp {Math.round(totalBalance).toLocaleString("id-ID")}
            </div>
          </div>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <LedgerTable data={data} loading={loading} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;