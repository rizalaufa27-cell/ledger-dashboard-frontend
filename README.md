# Ledger Dashboard — Frontend

Dashboard React (Vite) yang konsumsi data dari backend Express kamu
(narik data dari Google Sheets).

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Pastikan **backend sudah jalan duluan** (default `http://localhost:5050`)
sebelum buka frontend ini, karena dashboard ini fetch data dari situ.

Buka link yang muncul di terminal (biasanya `http://localhost:5173`).

## Fitur

- Pilih bulan (dropdown, sesuai 12 spreadsheet ledger kamu)
- Filter transaksi by kode akun (preset Revenue/COGS, atau ketik kode manual)
- Batasi jumlah baris yang ditampilkan (biar browser tidak berat kalau
  hasil filter masih banyak)
- KPI card: Revenue, COGS, Gross Profit, Gross Margin, jumlah voucher & transaksi
- Chart tren bulanan (Revenue vs COGS vs Gross Profit)

## Menambah preset filter akun

Buka `src/pages/Dashboard.jsx`, cari `ACCOUNT_PRESETS`, tambahkan baris baru:

```js
const ACCOUNT_PRESETS = [
  { label: "Semua akun", value: "" },
  { label: "Revenue (401)", value: "401" },
  { label: "Cost of Sales (501)", value: "501" },
  { label: "Expense Operasional (601)", value: "601" }, // contoh tambahan
];
```

## Deploy ke GitHub Pages

Karena dashboard ini butuh backend yang selalu jalan (untuk narik data
Google Sheets secara live), GitHub Pages **tidak cocok** untuk backend-nya
(GitHub Pages cuma hosting file statis, tidak bisa jalanin Node.js server).

Opsi yang umum dipakai:
- **Frontend** → GitHub Pages / Vercel / Netlify (gratis, cocok karena cuma file statis hasil `npm run build`)
- **Backend** → Railway, Render, atau Fly.io (ada free tier, bisa jalanin Express server terus-terusan)

Kalau kamu mau lanjut ke tahap deploy, kabari — kita bahas opsi mana yang paling pas.
