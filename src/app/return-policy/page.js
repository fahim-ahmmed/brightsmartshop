export default function ReturnPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-8 font-sans text-gray-800">
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-3xl border border-gray-200 shadow-sm space-y-6">
        <h1 className="text-3xl font-black text-[#00875A]">Return & Refund Policy</h1>
        <p className="text-xs text-gray-400">Last Updated: 20 October 2026</p>

        <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-gray-600">
          <h2 className="text-base font-bold text-gray-900 pt-2">1. Overview</h2>
          <p>Bright Smart Shop aims to provide customers with a reliable shopping experience. This policy explains how we handle reports of damaged, incorrect, or defective products purchased through our website. Our standard return policy does not cover change-of-mind returns.</p>

          <h2 className="text-base font-bold text-gray-900 pt-2">2. Eligible Reasons for Return</h2>
          <p>A customer may request a return, replacement, or refund if:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>The product arrives damaged.</li>
            <li>The wrong product is delivered.</li>
            <li>The product is defective or does not function as intended.</li>
            <li>The product is materially different from the product ordered.</li>
          </ul>

          <h2 className="text-base font-bold text-gray-900 pt-2">3. Reporting Period</h2>
          <p>Customers should report a damaged, incorrect, or defective product within 48 hours of receiving the order.</p>

          <h2 className="text-base font-bold text-gray-900 pt-2">4. How to Request a Return</h2>
          <p>To request a return or replacement, contact our customer service team and provide order number, product name, description of the problem, and clear photographs or videos.</p>

          <h2 className="text-base font-bold text-gray-900 pt-2">5. Return Conditions</h2>
          <p>Customers should keep the product, packaging, labels, accessories, and proof of purchase. Customers should not discard or unnecessarily alter a damaged product before review.</p>

          <h2 className="text-base font-bold text-gray-900 pt-2">6. Replacement Policy</h2>
          <p>Where a claim is approved, Bright Smart Shop may offer a replacement of the same product, subject to availability. If unavailable, we will discuss an appropriate refund.</p>

          <h2 className="text-base font-bold text-gray-900 pt-2">7. Refund Policy</h2>
          <p>If a refund is approved, it will be handled via bKash, Nagad, or original payment method / Cash on Delivery agreement.</p>

          <h2 className="text-base font-bold text-gray-900 pt-2">8. Return Delivery Charges</h2>
          <p>If a return is required because Bright Smart Shop delivered a damaged or incorrect product, return delivery costs will be handled in accordance with the law.</p>

          <h2 className="text-base font-bold text-gray-900 pt-2">9. Change-of-Mind Returns</h2>
          <p>Our standard policy does not offer returns simply because a customer changes their mind or selects the wrong item after ordering.</p>

          <h2 className="text-base font-bold text-gray-900 pt-2">10. Order Cancellation</h2>
          <p>Customers who wish to cancel an order should contact us as soon as possible. Cancellation may be limited after dispatch.</p>

          <h2 className="text-base font-bold text-gray-900 pt-2">11. Contact Us</h2>
          <div className="bg-slate-50 p-4 rounded-2xl border space-y-1 font-medium">
            <p><strong>Business Name:</strong> Bright Smart Shop</p>
            <p><strong>Website:</strong> https://www.brightsmartshop24.com</p>
            <p><strong>Email:</strong> brightsmartshop24@gmail.com</p>
            <p><strong>Phone:</strong> 01727629513</p>
            <p><strong>Business Address:</strong> Azizur Rahman Super Market, N/S Road, Kushtia 7100.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
export const dynamic = 'force-dynamic';
