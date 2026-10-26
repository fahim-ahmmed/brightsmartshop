import LedgerPage from "@/components/admin/LedgerPage";

export default function ProfitsPage() {
  return (
    <LedgerPage
      type="profit"
      title="Total Profits / Income"
      subtitle="A digital ledger for tracking personal income and profits, separate from order and sales records."
    />
  );
}