import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { api } from '../api/index.js'

function openOrderInvoicePDF(ord, savedUser) {
  if (typeof window === 'undefined') return

  const rawOrderId = String(ord.orderId || ord.orderNo || ord._id || '74')
  const cleanDigits = rawOrderId.replace(/\D/g, '') || '74'
  const invoiceNo = ord.invoiceNo || `GTI-2026-${cleanDigits.padStart(6, '0')}`
  const displayOrderId = ord.orderNo || ord.orderId || `#${cleanDigits}`

  const d = ord.createdAt ? new Date(ord.createdAt) : new Date()
  const formattedDate = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const formattedTime = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  const dateStr = `${formattedDate}, ${formattedTime}`

  const customerName = ord.customerName || ord.shipping?.name || savedUser?.name || 'Customer'
  const customerId =
    ord.customerId || ord.referralCode || savedUser?.referralCode || savedUser?.id || 'BSS-20260001'
  const customerPhone = ord.phone || ord.mobile || savedUser?.phone || 'N/A'
  const customerAddress = ord.address || ord.shipping?.address || savedUser?.address || 'N/A'

  const isOffice = ord.paymentMethod === 'office_receive'
  const deliveryType = isOffice ? 'Office Pickup' : 'Home Delivery'

  const payMethodRaw = String(ord.paymentMethod || 'cod').toLowerCase()
  const paymentMethodLabel =
    payMethodRaw === 'cod'
      ? 'Cod'
      : payMethodRaw === 'bkash'
      ? 'bKash'
      : payMethodRaw === 'nagad'
      ? 'Nagad'
      : payMethodRaw === 'office_receive'
      ? 'Office Receive'
      : ord.paymentMethod || 'Cod'

  const isPaid =
    String(ord.status || '').toLowerCase() === 'paid' ||
    String(ord.paymentStatus || '').toLowerCase() === 'paid'
  const paymentBadgeText = isPaid ? 'Paid' : 'Unpaid'
  const orderStatusText = ord.status || 'Confirmed'

  const items = Array.isArray(ord.items) ? ord.items : []
  let calculatedSubtotal = 0
  let calculatedPoints = 0

  const rowsHtml = items
    .map((item, idx) => {
      const title = item.title || item.name || 'Product'
      const prodId = item.productId || (item.id && String(item.id).slice(-4)) || idx + 1
      const sku = item.sku || `BSS-ITEM-00${idx + 1}`
      const qty = Number(item.quantity || item.qty || 1)
      const unitPrice = Number(item.price || 0)
      const lineTotal = unitPrice * qty
      const itemPts = Number(item.points || item.point || 0) * qty

      calculatedSubtotal += lineTotal
      calculatedPoints += itemPts

      return `
        <tr>
          <td style="font-weight:600;padding:10px;border-bottom:1px solid #e2e8f0;">${title}</td>
          <td style="text-align:center;padding:10px;border-bottom:1px solid #e2e8f0;">${prodId}</td>
          <td style="text-align:center;padding:10px;border-bottom:1px solid #e2e8f0;">${sku}</td>
          <td style="text-align:center;padding:10px;border-bottom:1px solid #e2e8f0;">${qty}</td>
          <td style="text-align:right;padding:10px;border-bottom:1px solid #e2e8f0;">৳${unitPrice.toFixed(2)}</td>
          <td style="text-align:right;font-weight:700;padding:10px;border-bottom:1px solid #e2e8f0;">৳${lineTotal.toFixed(2)}</td>
        </tr>
      `
    })
    .join('')

  const subtotal = Number(ord.subtotalPrice || calculatedSubtotal || ord.totalAmount || 0)
  const totalPoints = Number(ord.totalPoints ?? ord.points ?? calculatedPoints ?? 0)
  const deliveryCharge =
    ord.deliveryCharge !== undefined
      ? Number(ord.deliveryCharge)
      : isOffice || totalPoints >= 200
      ? 0
      : Math.max(0, Number(ord.totalAmount || subtotal) - subtotal)
  const grandTotal = Number(ord.totalAmount || subtotal + deliveryCharge)

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Invoice - ${invoiceNo}</title>
</head>
<body style="font-family:sans-serif;background:#f1f5f9;padding:20px;color:#1e293b;">
  <div style="max-width:780px;margin:0 auto 14px auto;text-align:right;">
    <button onclick="window.print()" style="padding:8px 16px;background:#15803d;color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer;">🖨️ Print / Save PDF</button>
  </div>
  <div style="max-width:780px;margin:0 auto;background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:28px;">
    <div style="display:flex;justify-content:space-between;border-bottom:2px solid #15803d;padding-bottom:16px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <img src="https://brightsmartshop24.com/logo.jpg" style="width:56px;height:56px;object-fit:contain;" />
        <div>
          <div style="font-size:20px;font-weight:800;">Bright Smart Shop</div>
          <div style="font-size:12px;color:#475569;">Phone: +8801727629513</div>
          <div style="font-size:12px;color:#475569;">Email: brightsmartshop24@gmail.com</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="background:#15803d;color:#fff;font-weight:800;font-size:12px;padding:4px 12px;border-radius:4px;display:inline-block;">INVOICE</div>
        <div style="font-size:15px;font-weight:800;margin-top:4px;">${invoiceNo}</div>
        <div style="font-size:12px;color:#475569;">Date: ${dateStr}</div>
        <div style="font-size:12px;color:#475569;">Order ID: ${displayOrderId}</div>
        <div style="font-size:11px;font-weight:700;margin-top:4px;color:${isPaid ? '#15803d' : '#b45309'};">Payment: ${paymentBadgeText}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:18px 0;">
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;">
        <div style="font-size:11px;font-weight:800;color:#15803d;">BILL TO</div>
        <div style="font-size:14px;font-weight:800;margin-top:4px;">${customerName}</div>
        <div style="font-size:12px;">Customer ID: ${customerId}</div>
        <div style="font-size:12px;">Phone: ${customerPhone}</div>
      </div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;">
        <div style="font-size:11px;font-weight:800;color:#15803d;">SHIP TO</div>
        <div style="font-size:14px;font-weight:800;margin-top:4px;">${customerName}</div>
        <div style="font-size:12px;">${customerAddress}</div>
        <div style="font-size:12px;">Delivery: ${deliveryType}</div>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr style="background:#0f172a;color:#fff;">
          <th style="padding:10px;text-align:left;">Product</th>
          <th style="padding:10px;text-align:center;">ID</th>
          <th style="padding:10px;text-align:center;">SKU</th>
          <th style="padding:10px;text-align:center;">Qty</th>
          <th style="padding:10px;text-align:right;">Price</th>
          <th style="padding:10px;text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <div style="display:flex;justify-content:space-between;margin-top:20px;font-size:13px;">
      <div>
        <div style="font-weight:800;">Thank you for your order!</div>
        <div style="margin-top:4px;">Order status: <strong>${orderStatusText}</strong></div>
        <div>Payment method: <strong>${paymentMethodLabel}</strong></div>
      </div>
      <div style="min-width:220px;">
        <div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Subtotal</span><strong>৳${subtotal.toFixed(2)}</strong></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Delivery charge</span><strong>৳${deliveryCharge.toFixed(2)}</strong></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:2px solid #0f172a;font-size:15px;font-weight:800;"><span>Grand total</span><span>৳${grandTotal.toFixed(2)}</span></div>
        <div style="display:flex;justify-content:space-between;color:#15803d;font-weight:700;"><span>Points earned</span><span>+${totalPoints.toFixed(2)}</span></div>
      </div>
    </div>
  </div>
</body>
</html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.open()
    win.document.write(html)
    win.document.close()
  }
}

export default function MyOrders() {
  const { user } = useApp()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const uid = user?._id || user?.id || ''
        const phone = user?.phone || user?.mobile || ''
        const res = await api.getOrders(uid, phone)
        if (active) setOrders(res.orders || res || [])
      } catch {
        if (active) setOrders([])
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [user])

  return (
    <div className="px-4 py-4 font-sans text-gray-800 space-y-4">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div>
          <button
            onClick={() => navigate('/me')}
            className="inline-flex items-center gap-1 text-xs font-black text-[#00875A] uppercase tracking-wider mb-1"
          >
            <ChevronLeft size={15} /> Back to Dashboard
          </button>
          <h1 className="text-xl font-black text-gray-900">আমার অর্ডারসমূহ</h1>
          <p className="text-[11px] text-gray-500">
            আপনার সকল অর্ডার ট্র্যাকিং এবং ইনভয়েস এখান থেকে দেখুন।
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-xs font-bold text-[#00875A] bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200"
        >
          + নতুন কেনাকাটা
        </button>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-[#00875A] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-[#00875A]">আপনার অর্ডার খোঁজা হচ্ছে...</p>
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((ord, idx) => {
            const normStatus = String(ord.status || '').toLowerCase()
            const isInvoiceReady = ['confirmed', 'paid', 'delivered'].includes(normStatus)

            return (
              <div
                key={ord._id || idx}
                className="bg-white rounded-3xl p-4 border border-gray-200 shadow-xs space-y-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 text-xs">
                  <div>
                    <span className="font-extrabold text-gray-900 block text-sm">
                      অর্ডার: {ord.orderId || ord.orderNo || `#${String(ord._id).slice(-6)}`}
                    </span>
                    <span className="text-gray-500 font-bold text-[11px]">
                      {ord.createdAt
                        ? new Date(ord.createdAt).toLocaleDateString('bn-BD', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : ''}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full font-black text-[10px] uppercase ${
                        ord.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : ord.status === 'Confirmed' || ord.status === 'Delivered'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : ord.status === 'Cancelled'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {ord.status === 'Confirmed'
                        ? '✓ Order Confirmed'
                        : ord.status === 'Paid'
                        ? '✅ Paid'
                        : ord.status || 'Pending'}
                    </span>

                    {isInvoiceReady ? (
                      <button
                        type="button"
                        onClick={() => openOrderInvoicePDF(ord, user)}
                        className="px-3 py-1 rounded-full bg-[#00875A] text-white font-black text-[10px] shadow-xs flex items-center gap-1"
                      >
                        <span>📄</span>
                        <span>ইনভয়েস (PDF)</span>
                      </button>
                    ) : (
                      normStatus !== 'cancelled' && (
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
                          ⏳ কনফার্ম হলে ইনভয়েস পাবেন
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {(ord.items || []).map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-xs bg-gray-50/80 p-2.5 rounded-2xl border border-gray-100"
                    >
                      <span className="font-bold text-gray-800">
                        {item.title || item.name}{' '}
                        <span className="text-gray-400 ml-1 font-medium">
                          (x{item.quantity || item.qty || 1})
                        </span>
                      </span>
                      <span className="font-black text-[#00875A]">
                        ৳{Number(item.price || 0) * Number(item.quantity || item.qty || 1)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap justify-between items-center text-xs pt-2 border-t border-gray-100 font-bold gap-2">
                  <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-xl border border-gray-200 text-[11px]">
                    পেমেন্ট:{' '}
                    <span className="text-gray-900">
                      {ord.paymentMethod === 'office_receive'
                        ? '🏢 অফিস রিসিভ'
                        : ord.paymentMethod === 'bkash'
                        ? 'বিকাশ'
                        : ord.paymentMethod === 'nagad'
                        ? 'নগদ'
                        : 'ক্যাশ অন ডেলিভারি'}
                    </span>
                  </span>
                  <span className="text-xs font-black text-gray-900 bg-emerald-50 px-3.5 py-1 rounded-xl border border-emerald-100">
                    সর্বমোট: <span className="text-[#00875A] ml-1 text-sm">৳{ord.totalAmount}</span>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-10 text-center border border-gray-200 space-y-3">
          <div className="text-5xl">🛍️</div>
          <h2 className="text-base font-black text-gray-800">আপনি এখনও কোনো অর্ডার করেননি!</h2>
          <button
            onClick={() => navigate('/')}
            className="bg-[#00875A] text-white font-bold text-xs px-6 py-3 rounded-xl"
          >
            শপিং শুরু করুন ➔
          </button>
        </div>
      )}
    </div>
  )
}