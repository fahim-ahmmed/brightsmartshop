# ডিপ্লয় নির্দেশিকা

## ১. আগে যা লাগবে
- **MongoDB Atlas** (ফ্রি M0 দিয়ে শুরু করা যায়, চালু সাইটের জন্য M10+ ও backup চালু রাখুন)
- **Cloudinary** অ্যাকাউন্ট (ছবি আপলোড)
- **Resend** অ্যাকাউন্ট ও আপনার ডোমেইন যাচাই (পাসওয়ার্ড রিসেট ইমেইল)

## ২. Environment variables (সব `.env.example`-এ)
`MONGODB_URI`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`,
`RESEND_API_KEY`, `EMAIL_FROM`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

`BETTER_AUTH_URL` ও `NEXT_PUBLIC_SITE_URL` অবশ্যই চূড়ান্ত ডোমেইন হতে হবে (https সহ)।

## ৩. প্রথমবার ডেটা বসানো (নিজের কম্পিউটার থেকে, চালু ডেটাবেসের URI দিয়ে)
1. `npm run seed:shop` — ক্যাটাগরি, পণ্য, ব্যানার, টিম
2. `npm run seed:levels` — ২৪ লেভেল
3. সাইটে রেজিস্টার করুন, তারপর `npm run make-admin -- আপনার@ইমেইল`
4. `npm run migrate:images` — পুরোনো সাইটের ছবি Cloudinary-তে সরে যাবে (**পুরোনো সাইট বন্ধ করার আগে**)

## ৪A. Vercel
1. কোড GitHub-এ তুলুন, Vercel-এ import করুন
2. উপরের env গুলো Project Settings → Environment Variables-এ দিন
3. Atlas → Network Access-এ আপাতত `0.0.0.0/0` দিন (Vercel-এর IP নির্দিষ্ট নয়; ইউজার/পাসওয়ার্ড শক্ত রাখুন)
4. Domain যোগ করে DNS বদলান

## ৪B. নিজের সার্ভার (VPS)
1. সার্ভারে Docker ও Docker Compose বসান
2. কোড ও `.env.local` সার্ভারে রাখুন
3. `docker compose up -d --build`
4. Nginx বা Caddy দিয়ে https (Let's Encrypt) বসিয়ে port 3000-এ পাঠান
5. Atlas Network Access-এ সার্ভারের IP দিন

## ৫. চালুর পরে
- `/api/health` ঠিকানায় একটা আপটাইম মনিটর বসান (UptimeRobot ইত্যাদি)
- Atlas-এ ব্যাকআপ চালু আছে কিনা দেখুন
- একটা সত্যিকারের অর্ডার দিয়ে পুরো পথ পরীক্ষা করুন: রেজিস্টার → কেনা → অ্যাডমিনে Delivered → Dashboard-এ Wallet → টাকা তোলা → অ্যাডমিনে Approve/Paid
- `/sitemap.xml` ও `/robots.txt` দেখে Google Search Console-এ জমা দিন
