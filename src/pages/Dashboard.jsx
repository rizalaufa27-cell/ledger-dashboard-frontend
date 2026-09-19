import { useEffect, useState, lazy, Suspense } from "react";
import { getLedger, getMonthlySummary, getPnl, getCostCenters } from "../services/api";
import KPICard from "../components/KPICard";
import LedgerTable from "../components/LedgerTable";
import { ACCOUNT_GROUPS } from "../data/chartOfAccounts";
import { COA_LAMA_LIST } from "../data/coaLamaList";

const MonthlySummaryChart = lazy(() => import("../components/MonthlySummaryChart"));
const PnLStatement = lazy(() => import("../components/PnLStatement"));

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const NAV_ITEMS = [
  { key: "ledger", label: "Transaksi", icon: "☰" },
  { key: "pnl", label: "Laba Rugi (P&L)", icon: "▤" },
];

function parseNumber(value) {
  if (!value) return 0;
  const cleaned = String(value).replace(/,/g, "");
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

function Dashboard() {
  const [activePage, setActivePage] = useState("ledger"); // "ledger" | "pnl"

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
  const [summaryLoaded, setSummaryLoaded] = useState(false);

  const [pnlData, setPnlData] = useState(null);
  const [pnlLoading, setPnlLoading] = useState(false);
  const [costCenterFilter, setCostCenterFilter] = useState("");
  const [costCenterList, setCostCenterList] = useState([]);
  const [pnlEverOpened, setPnlEverOpened] = useState(false);

  const effectiveAccount = customAccount.trim() || accountFilter;

  useEffect(() => {
    if (activePage !== "ledger") return;
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
  }, [activePage, month, effectiveAccount, coaLamaFilter, voucherFilter, rowLimit]);

  useEffect(() => {
    if (activePage !== "ledger" || summaryLoaded) return;
    async function loadSummary() {
      setSummaryLoading(true);
      try {
        const result = await getMonthlySummary();
        setMonthlySummary(result);
        setSummaryLoaded(true);
      } catch (err) {
        console.error(err);
      } finally {
        setSummaryLoading(false);
      }
    }

    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage]);

  useEffect(() => {
    if (activePage === "pnl" && !pnlEverOpened) {
      setPnlEverOpened(true);
    }
  }, [activePage, pnlEverOpened]);

  useEffect(() => {
    if (!pnlEverOpened) return;

    async function loadCostCenters() {
      try {
        const result = await getCostCenters(month);
        setCostCenterList(result);
        if (costCenterFilter && !result.includes(costCenterFilter)) {
          setCostCenterFilter("");
        }
      } catch (err) {
        console.error(err);
        setCostCenterList([]);
      }
    }

    loadCostCenters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, pnlEverOpened]);

  useEffect(() => {
    if (!pnlEverOpened) return;

    async function loadPnL() {
      setPnlLoading(true);
      try {
        const result = await getPnl(month, costCenterFilter || undefined);
        setPnlData(result);
      } catch (err) {
        console.error(err);
        setPnlData(null);
      } finally {
        setPnlLoading(false);
      }
    }

    loadPnL();
  }, [month, costCenterFilter, pnlEverOpened]);

  const totalBalance = data.reduce((sum, row) => sum + parseNumber(row["balance (idr)"]), 0);
  const totalVoucher = new Set(data.map((row) => row["voucher no"])).size;

  const currentMonthSummary = monthlySummary.find((s) => s.month?.startsWith(month));
  const revenue = currentMonthSummary?.revenue ?? 0;
  const cogs = currentMonthSummary?.cogs ?? 0;
  const grossProfit = revenue - cogs;
  const grossMargin = revenue === 0 ? 0 : (grossProfit / revenue) * 100;

  return (
    <div className="app-with-sidebar">
      <aside className="sidebar">
        <div className="sidebar-logo">📊 Ledger Dashboard</div>

        <div className="sidebar-section-label">Menu</div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`sidebar-nav-item ${activePage === item.key ? "active" : ""}`}
            onClick={() => setActivePage(item.key)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}

        <div style={{ marginTop: 24 }}>
          <div className="sidebar-section-label">Bulan</div>
          <div style={{ padding: "0 8px" }}>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={{ width: "100%" }}
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="app-shell" style={{ padding: 0 }}>
          <header className="app-header">
            <div>
              <h1>{activePage === "ledger" ? "Transaksi" : "Laporan Laba Rugi"}</h1>
              <div className="subtitle">
                {activePage === "ledger"
                  ? "Data langsung dari Google Sheets"
                  : "Ringkasan performa keuangan per bulan"}
              </div>
            </div>
            <div className="header-meta">
              SUMBER: GOOGLE SHEETS
              <br />
              BULAN AKTIF: {month.toUpperCase()}
            </div>
          </header>

          {error && <div className="state-banner error">⚠ {error}</div>}

          {activePage === "ledger" && (
            <>
              <div className="controls-row">
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
                  <label htmlFor="voucher-filter">No. Voucher</label>
                  <input
                    id="voucher-filter"
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
                    <Suspense fallback={<div className="empty-state">Memuat chart...</div>}>
                      <MonthlySummaryChart data={monthlySummary} />
                    </Suspense>
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
            </>
          )}

          {activePage === "pnl" && (
            <div className="panel">
              <div className="panel-header">
                <h2>Laporan Laba Rugi</h2>
                <div className="control-group" style={{ margin: 0 }}>
                  <select
                    value={costCenterFilter}
                    onChange={(e) => setCostCenterFilter(e.target.value)}
                    style={{ minWidth: 220 }}
                  >
                    <option value="">Semua Cost Center (Total)</option>
                    {costCenterList.map((cc) => (
                      <option key={cc} value={cc}>{cc}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="panel-body">
                <Suspense fallback={<div className="empty-state">Memuat modul P&L...</div>}>
                  <PnLStatement data={pnlData} loading={pnlLoading} />
                </Suspense>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
