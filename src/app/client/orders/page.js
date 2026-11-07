"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

// 🟢 হুবহু স্যাম্পল পিডিএফ-এর মতো ইনভয়েস জেনারেটর ফাংশন (পার অর্ডার ক্যালকুলেশন সহ)
function openOrderInvoicePDF(ord) {
  if (typeof window === "undefined") return;

  const savedUserRaw = localStorage.getItem("bright_user");
  const savedUser = savedUserRaw ? JSON.parse(savedUserRaw) : {};

  const rawOrderId = String(ord.orderId || ord.orderNo || ord._id || "74");
  const cleanDigits = rawOrderId.replace(/\D/g, "") || "74";
  const invoiceNo = ord.invoiceNo || `GTI-2026-${cleanDigits.padStart(6, "0")}`;
  const displayOrderId = ord.orderNo || ord.orderId || `#${cleanDigits}`;

  const d = ord.createdAt ? new Date(ord.createdAt) : new Date();
  const formattedDate = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedTime = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const dateStr = `${formattedDate}, ${formattedTime}`;

  const customerName = ord.customerName || ord.shipping?.name || savedUser?.name || "Customer";
  const customerId =
    ord.customerId ||
    ord.referralCode ||
    savedUser?.referralCode ||
    savedUser?.id ||
    ord.userId ||
    "20260048";

  const rawEmail = ord.email || savedUser?.email || "";
  const customerEmail = rawEmail && !rawEmail.endsWith(".local") ? rawEmail : "";
  const customerPhone = ord.phone || ord.mobile || ord.shipping?.mobile || savedUser?.phone || "N/A";
  const customerAddress = ord.address || ord.shipping?.address || savedUser?.address || "N/A";

  const isOffice = ord.paymentMethod === "office_receive";
  const deliveryType = isOffice ? "Office Pickup" : "Home Delivery";

  const payMethodRaw = String(ord.paymentMethod || "cod").toLowerCase();
  const paymentMethodLabel =
    payMethodRaw === "cod"
      ? "Cod"
      : payMethodRaw === "bkash"
      ? "bKash"
      : payMethodRaw === "nagad"
      ? "Nagad"
      : payMethodRaw === "office_receive"
      ? "Office Receive"
      : ord.paymentMethod || "Cod";

  const isPaid =
    String(ord.status || "").toLowerCase() === "paid" ||
    String(ord.paymentStatus || "").toLowerCase() === "paid";
  const paymentBadgeText = isPaid ? "Paid" : "Unpaid";
  const orderStatusText = ord.status || "Confirmed";

  const items = Array.isArray(ord.items) ? ord.items : [];
  let calculatedSubtotal = 0;
  let calculatedPoints = 0;

  const rowsHtml = items
    .map((item, idx) => {
      const title = item.title || item.name || item.productName || "Product";
      const prodId = item.productId || (item.id && String(item.id).slice(-4)) || idx + 1;
      const sku = item.sku || item.code || `BSS-ITEM-00${idx + 1}`;
      const qty = Number(item.quantity || item.qty || 1);
      const unitPrice = Number(item.price || (item.pricePaisa ? item.pricePaisa / 100 : 0));
      const lineTotal = unitPrice * qty;
      const itemPts = Number(item.points || item.point || 0) * qty;

      calculatedSubtotal += lineTotal;
      calculatedPoints += itemPts;

      return `
        <tr>
          <td class="td-product">${title}</td>
          <td class="td-center">${prodId}</td>
          <td class="td-center">${sku}</td>
          <td class="td-center">${qty}</td>
          <td class="td-right">৳${unitPrice.toFixed(2)}</td>
          <td class="td-right td-bold">৳${lineTotal.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");

  const subtotal = Number(ord.subtotalPrice || calculatedSubtotal || ord.totalAmount || 0);
  const discount = Number(ord.discount || 0);
  const totalPoints = Number(ord.totalPoints ?? ord.points ?? calculatedPoints ?? 0);
  const deliveryCharge =
    ord.deliveryCharge !== undefined
      ? Number(ord.deliveryCharge)
      : isOffice || totalPoints >= 200
      ? 0
      : Math.max(0, Number(ord.totalAmount || subtotal) - subtotal);
  const grandTotal = Number(ord.totalAmount || subtotal - discount + deliveryCharge);

  const logoUrl = `${window.location.origin}/logo.jpg`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice - ${invoiceNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f1f5f9;
      color: #1e293b;
      padding: 24px;
    }
    .toolbar {
      max-width: 820px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    .btn {
      padding: 9px 18px;
      border-radius: 8px;
      border: none;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
    }
    .btn-print { background: #15803d; color: #ffffff; }
    .btn-close { background: #e2e8f0; color: #1e293b; }
    .invoice-card {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 36px 40px;
    }
    .top-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 22px;
      border-bottom: 2px solid #15803d;
    }
    .company-box {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .company-logo {
      width: 68px;
      height: 68px;
      object-fit: contain;
    }
    .company-name {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .company-meta {
      font-size: 13px;
      color: #475569;
      line-height: 1.5;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-badge {
      display: inline-block;
      background: #15803d;
      color: #ffffff;
      font-weight: 800;
      font-size: 13px;
      padding: 5px 14px;
      border-radius: 4px;
      letter-spacing: 0.6px;
      margin-bottom: 6px;
    }
    .invoice-no {
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .invoice-sub {
      font-size: 12.5px;
      color: #475569;
      line-height: 1.55;
    }
    .paid-pill {
      display: inline-block;
      margin-top: 5px;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      background: ${isPaid ? "#dcfce7" : "#fef3c7"};
      color: ${isPaid ? "#15803d" : "#b45309"};
      border: 1px solid ${isPaid ? "#bbf7d0" : "#fde68a"};
    }
    .address-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      margin: 22px 0;
    }
    .addr-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
    }
    .addr-label {
      font-size: 11px;
      font-weight: 800;
      color: #15803d;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 6px;
    }
    .addr-name {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .addr-line {
      font-size: 13px;
      color: #334155;
      line-height: 1.5;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    table.items-table thead tr {
      background: #0f172a;
      color: #ffffff;
    }
    table.items-table th {
      font-size: 12px;
      font-weight: 700;
      padding: 11px 12px;
      text-align: left;
    }
    table.items-table th.th-center { text-align: center; }
    table.items-table th.th-right { text-align: right; }
    table.items-table tbody tr {
      border-bottom: 1px solid #e2e8f0;
    }
    table.items-table td {
      font-size: 13px;
      padding: 12px;
      color: #1e293b;
    }
    .td-product { font-weight: 600; }
    .td-center { text-align: center; }
    .td-right { text-align: right; }
    .td-bold { font-weight: 700; }
    .bottom-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 24px;
      margin-top: 24px;
      align-items: flex-start;
    }
    .notes-area {
      font-size: 13px;
      color: #334155;
      line-height: 1.65;
    }
    .notes-title {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 6px 0;
      font-size: 13.5px;
      color: #334155;
    }
    .totals-table td.val {
      text-align: right;
      font-weight: 600;
      color: #0f172a;
    }
    .totals-table tr.grand-row td {
      border-top: 2px solid #0f172a;
      padding-top: 10px;
      padding-bottom: 8px;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    .totals-table tr.points-row td {
      font-size: 13px;
      font-weight: 700;
      color: #15803d;
      padding-top: 4px;
    }
    .footer-bar {
      margin-top: 32px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #64748b;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .toolbar { display: none !important; }
      .invoice-card { border: 1px solid #cbd5e1; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="btn btn-print" onclick="window.print()">🖨️ Print / Save PDF</button>
    <button class="btn btn-close" onclick="window.close()">✕ Close</button>
  </div>

  <div class="invoice-card">
    <div class="top-row">
      <div class="company-box">
        <img src="${logoUrl}" alt="Bright Smart Shop" class="company-logo" onerror="this.style.display='none'" />
        <div>
          <div class="company-name">Bright Smart Shop</div>
          <div class="company-meta">
            <div>Phone: +8801727629513</div>
            <div>Email: brightsmartshop24@gmail.com</div>
          </div>
        </div>
      </div>

      <div class="invoice-meta">
        <div class="invoice-badge">INVOICE</div>
        <div class="invoice-no">${invoiceNo}</div>
        <div class="invoice-sub">
          <div>Date: ${dateStr}</div>
          <div>Order ID: ${displayOrderId}</div>
        </div>
        <div class="paid-pill">Payment: ${paymentBadgeText}</div>
      </div>
    </div>

    <div class="address-grid">
      <div class="addr-box">
        <div class="addr-label">BILL TO</div>
        <div class="addr-name">${customerName}</div>
        <div class="addr-line">Customer ID: ${customerId}</div>
        ${customerEmail ? `<div class="addr-line">${customerEmail}</div>` : ""}
        <div class="addr-line">Phone: ${customerPhone}</div>
      </div>

      <div class="addr-box">
        <div class="addr-label">SHIP TO</div>
        <div class="addr-name">${customerName}</div>
        <div class="addr-line">${customerAddress}</div>
        <div class="addr-line">Delivery: ${deliveryType}</div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Product</th>
          <th class="th-center">Product ID</th>
          <th class="th-center">SKU</th>
          <th class="th-center">Qty</th>
          <th class="th-right">Unit price</th>
          <th class="th-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="bottom-grid">
      <div class="notes-area">
        <div class="notes-title">Thank you for your order!</div>
        <div>This invoice is generated from your order details.</div>
        <div style="margin-top: 6px;">Order status: <strong>${orderStatusText}</strong></div>
        <div>Payment method: <strong>${paymentMethodLabel}</strong></div>
      </div>

      <div>
        <table class="totals-table">
          <tr>
            <td>Subtotal</td>
            <td class="val">৳${subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Discount</td>
            <td class="val">- ৳০.০০</td>
          </tr>
          <tr>
            <td>Delivery charge</td>
            <td class="val">৳${deliveryCharge.toFixed(2)}</td>
          </tr>
          <tr class="grand-row">
            <td>Grand total</td>
            <td class="val">৳${grandTotal.toFixed(2)}</td>
          </tr>
          <tr class="points-row">
            <td>Points earned</td>
            <td class="val" style="color:#15803d;">${totalPoints.toFixed(2)}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="footer-bar">
      <span>Bright Smart Shop</span>
      <span>Invoice: ${invoiceNo}</span>
    </div>
  </div>

  <script>
    window.onload = function () {
      setTimeout(function () {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
  }
}

export default function ClientOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserOrders() {
      try {
        const savedUser = localStorage.getItem("bright_user");
        const params = new URLSearchParams();

        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          const userId = parsedUser.id || parsedUser._id;
          const phone = parsedUser.phone || parsedUser.mobile;

          // আইডি এবং ফোন নাম্বার দুইটা থাকলে দুইটাই পাঠানো হবে যাতে কোনো অর্ডার মিস না হয়
          if (userId) params.set("userId", userId);
          if (phone) params.set("phone", phone);
        }

        const queryString = params.toString();
        if (!queryString) {
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/orders?${queryString}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error("Orders fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUserOrders();
  }, []);

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 font-sans text-gray-800 space-y-6 min-h-[60vh]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <span className="text-xs font-black text-[#00875A] uppercase tracking-widest block mb-1">
            MY ORDER HISTORY
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">আমার অর্ডারসমূহ</h1>
          <p className="text-xs text-gray-500 mt-1">আপনার সকল অর্ডার ট্র্যাকিং এবং ডেলিভারি স্ট্যাটাস এখান থেকে দেখুন।</p>
        </div>
        <Link href="/shop" className="text-xs font-bold text-[#00875A] bg-emerald-50 px-5 py-2.5 rounded-full border border-emerald-200 hover:bg-[#00875A] hover:text-white transition-all shadow-sm">
          + নতুন কেনাকাটা
        </Link>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-[#00875A] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-[#00875A] animate-pulse">
            আপনার অর্ডার খোঁজা হচ্ছে...
          </p>
        </div>
      ) : orders.length > 0 ? (
        <div className="grid gap-5">
          {orders.map((ord, idx) => {
            const normStatus = String(ord.status || "").toLowerCase();
            const isInvoiceReady = ["confirmed", "paid", "delivered"].includes(normStatus);

            return (
              <div key={idx} className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-sm hover:border-[#00875A] transition-colors space-y-4 group relative overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4 text-xs">
                  <div>
                    <span className="font-extrabold text-gray-900 block text-base mb-1">অর্ডার: {ord.orderId || ord.orderNo}</span>
                    <span className="text-gray-500 font-bold">
                      {new Date(ord.createdAt).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-4 py-1.5 rounded-full font-black text-[11px] uppercase shadow-sm ${
                        ord.status === "Paid"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : ord.status === "Confirmed" || ord.status === "Delivered"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : ord.status === "Cancelled"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {ord.status === "Confirmed"
                        ? "✓ Order Confirmed"
                        : ord.status === "Paid"
                        ? "✅ Paid"
                        : ord.status || "Pending"}
                    </span>

                    {/* 🟢 অর্ডার কনফার্ম বা পেইড হলেই পিডিএফ ইনভয়েস বাটনটি দেখাবে */}
                    {isInvoiceReady ? (
                      <button
                        type="button"
                        onClick={() => openOrderInvoicePDF(ord)}
                        className="px-4 py-1.5 rounded-full bg-[#00875A] hover:bg-[#00704A] text-white font-black text-[11px] shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span>📄</span>
                        <span>ইনভয়েস (PDF)</span>
                      </button>
                    ) : (
                      normStatus !== "cancelled" && (
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                          ⏳ কনফার্ম হলে ইনভয়েস পাবেন
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="space-y-2.5">
                  {(ord.items || []).map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-xs sm:text-sm bg-gray-50/80 p-3 rounded-2xl border border-gray-100 group-hover:bg-emerald-50/30 transition-colors">
                      <span className="font-bold text-gray-800">
                        {item.title || item.name}{" "}
                        <span className="text-gray-400 ml-1 font-medium">(x{item.quantity || item.qty || 1})</span>
                      </span>
                      <span className="font-black text-[#00875A]">
                        ৳{Number(item.price || 0) * Number(item.quantity || item.qty || 1)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap justify-between items-center text-xs pt-3 border-t border-gray-100 font-bold gap-3">
                  <span className="text-gray-600 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
                    পেমেন্ট:{" "}
                    <span className="text-gray-900 ml-1">
                      {ord.paymentMethod === "office_receive"
                        ? "🏢 অফিস রিসিভ"
                        : ord.paymentMethod === "bkash"
                        ? "বিকাশ"
                        : ord.paymentMethod === "nagad"
                        ? "নগদ"
                        : "ক্যাশ অন ডেলিভারি"}
                    </span>
                  </span>
                  <span className="text-sm font-black text-gray-900 bg-emerald-50 px-4 py-1.5 rounded-xl border border-emerald-100">
                    সর্বমোট: <span className="text-[#00875A] ml-1 text-base">৳{ord.totalAmount}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border shadow-sm space-y-4 my-8">
          <div className="text-6xl mb-4">🛍️</div>
          <h2 className="text-lg font-black text-gray-800">আপনি এখনও কোনো অর্ডার করেননি!</h2>
          <p className="text-sm text-gray-500 font-medium">
            আপনার প্রয়োজনীয় জিনিসপত্র পছন্দ করতে শপ ভিজিট করুন।
          </p>
          <div className="pt-4">
            <Link href="/shop" className="inline-block bg-[#00875A] text-white font-bold text-sm px-8 py-3 rounded-xl hover:bg-[#00704A] hover:shadow-lg hover:-translate-y-0.5 transition-all">
              শপিং শুরু করুন ➔
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}