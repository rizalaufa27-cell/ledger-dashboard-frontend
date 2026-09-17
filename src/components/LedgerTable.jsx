function formatNumber(value) {
  const num = Number(value) || 0;
  if (num === 0) return "—";
  return num.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function splitAccount(accountStr) {
  if (!accountStr) return { code: "", name: "" };
  const parts = accountStr.split(" - ");
  const code = parts[0] || "";
  const name = parts.slice(1).join(" - ");
  return { code, name };
}

function LedgerTable({ data, loading }) {
  if (loading) {
    return <div className="empty-state">Memuat transaksi...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="empty-state">Tidak ada transaksi yang cocok dengan filter ini.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="ledger-table">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>No. Voucher</th>
            <th>Akun</th>
            <th>COA Lama</th>
            <th>Keterangan</th>
            <th>Cost Center</th>
            <th>Debit (IDR)</th>
            <th>Credit (IDR)</th>
            <th>Balance (IDR)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const { code, name } = splitAccount(row.account);
            return (
              <tr key={`${row["voucher no"]}-${i}`}>
  <td>{row["posting date"]}</td>
  <td title={row["voucher no"]}>{row["voucher no"]}</td>
  <td className="account-cell" title={row.account}>
    <span className="account-code">{code}</span>
    {name}
  </td>
  <td title={row["coa lama"]}>{row["coa lama"]}</td>
  <td title={row.remarks}>{row.remarks}</td>
  <td title={row["cost center"]}>{row["cost center"]}</td>
                <td className="num debit">{formatNumber(row["debit (idr)"])}</td>
                <td className="num credit">{formatNumber(row["credit (idr)"])}</td>
                <td className="num">{formatNumber(row["balance (idr)"])}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default LedgerTable;
