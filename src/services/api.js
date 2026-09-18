const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

/**
 * Ambil data ledger untuk satu bulan, dengan filter opsional by akun & limit.
 * @param {string} month - nama bulan, misal "Januari"
 * @param {string} [account] - awalan kode akun, misal "501"
 * @param {number} [limit] - batas jumlah baris
 */
export async function getLedger(month, filters = {}, limit) {
  const params = new URLSearchParams({ month });
  if (filters.account) params.set("account", filters.account);
  if (filters.coaLama) params.set("coaLama", filters.coaLama);
  if (filters.voucherNo) params.set("voucherNo", filters.voucherNo);
  if (limit) params.set("limit", limit);

  const res = await fetch(`${API_BASE_URL}/api/ledger?${params.toString()}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Gagal mengambil data ledger.");
  }

  return res.json();
}

/**
 * Ambil ringkasan revenue/cogs untuk semua bulan yang sudah dikonfigurasi.
 */
export async function getMonthlySummary() {
  const res = await fetch(`${API_BASE_URL}/api/summary`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Gagal mengambil ringkasan bulanan.");
  }

  return res.json();
}

/**
 * Ambil laporan PNL untuk satu bulan, opsional difilter per cost center.
 * @param {string} month - nama bulan, misal "Januari"
 * @param {string} [costCenter] - exact string cost center, misal "02101 - TORCH.ID - T".
 *   Kosong / tidak dikirim / "all" -> total semua cost center (unfiltered).
 */
export async function getPnl(month, costCenter) {
  const params = new URLSearchParams({ month });
  if (costCenter && costCenter !== "all") params.set("costCenter", costCenter);

  const res = await fetch(`${API_BASE_URL}/api/pnl?${params.toString()}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Gagal mengambil data PNL.");
  }

  return res.json();
}

/**
 * Ambil daftar cost center unik untuk satu bulan, buat ngisi dropdown filter.
 * @param {string} month - nama bulan, misal "Januari"
 */
export async function getCostCenters(month) {
  const params = new URLSearchParams({ month });
  const res = await fetch(`${API_BASE_URL}/api/cost-centers?${params.toString()}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Gagal mengambil daftar cost center.");
  }

  return res.json();
}