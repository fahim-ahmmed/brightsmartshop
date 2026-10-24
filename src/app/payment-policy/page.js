export default function PaymentPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-8 font-sans text-gray-800">
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-3xl border border-gray-200 shadow-sm space-y-6">
        <h1 className="text-3xl font-black text-[#00875A]">Payment Policy</h1>
        <p className="text-xs text-gray-400">Last Updated: 20 October 2026</p>

        <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-gray-600">
          <h2 className="text-base font-bold text-gray-900 pt-2">1. Accepted Payment Methods</h2>
          <p>Bright Smart Shop supports secure and convenient payment methods for all customers:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Cash on Delivery (COD):</strong> Pay with cash when your order is delivered to your doorstep.</li>
            <li><strong>bKash:</strong> Secure mobile financial service payment.</li>
            <li><strong>Nagad:</strong> Fast and secure digital transactions.</li>
            <li><strong>Online Payment Gateways:</strong> Supported cards and digital banking services.</li>
          </ul>

          <h2 className="text-base font-bold text-gray-900 pt-2">2. Prepaid Orders & Transaction Verification</h2>
          <p>For prepaid orders (bKash, Nagad, etc.), customers must provide correct transaction reference numbers and payment details during checkout. Orders will be verified before dispatch.</p>

          <h2 className="text-base font-bold text-gray-900 pt-2">3. Security & Privacy</h2>
          <p>We prioritize payment security. Payments are processed through trusted third-party gateway providers. We do not store complete payment card numbers on our servers.</p>

          <h2 className="text-base font-bold text-gray-900 pt-2">4. Refunds</h2>
          <p>Approved refunds for prepaid orders will be returned via the original payment method or coordinated directly with the customer through bKash/Nagad.</p>

          <h2 className="text-base font-bold text-gray-900 pt-2">5. Contact Us</h2>
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
