import LedgerPage from "@/components/admin/LedgerPage";

export default function PurchasesPage() {
  return (
    <LedgerPage
      type="purchase"
      title="Total Purchases / Expenses"
      subtitle="A digital ledger for tracking personal expenses and purchases, separate from order and sales records."
    />
  );
}