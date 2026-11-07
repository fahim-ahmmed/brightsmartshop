# Bright Smart Shop (Next.js, JavaScript) — সম্পূর্ণ (ভাগ ১–৫)

## চালানোর নিয়ম
1. `npm install`
2. `.env.example` কপি করে `.env.local` বানান ও মানগুলো বসান
3. `npm run seed:shop` ও `npm run seed:levels`
4. `npm run dev` → http://localhost:3000
5. রেজিস্টার করে `npm run make-admin -- you@example.com` চালান, তারপর `/admin`-এ যান

## স্ক্রিপ্ট
- `npm run seed:shop | seed:levels | seed:notification`
- `npm run make-admin -- email` — কাউকে admin বানায়
- `npm run deliver-order -- BSS-XXXX` — পরীক্ষার জন্য (অ্যাডমিন প্যানেল থেকেও করা যায়)
- `npm run migrate:images` — পুরোনো ছবি Cloudinary-তে
- `npm test` — unit ও wallet টেস্ট (প্রথমবার mongodb-memory-server একটা MongoDB ডাউনলোড করবে)
- `npm run e2e` — Playwright (`npx playwright install` একবার চালাতে হবে; ডেটা সিড করা থাকতে হবে)

## অ্যাডমিন প্যানেল (`/admin`, শুধু role=admin)
Dashboard, Orders (স্ট্যাটাস বদল, Delivered হলে Level পুরস্কার), Withdrawals (Approve/Paid/Reject),
Products ও Categories (ছবি আপলোডসহ), Hero banners, Management team, Levels, Notification bar, Users, Audit log

ডিপ্লয়: `DEPLOY.md` দেখুন।
# brightsmartshop
