import { MongoClient } from 'mongodb';

const email = process.argv[2]?.toLowerCase();
if (!email) {
  console.error('ব্যবহার: npm run make-admin -- user@example.com');
  process.exit(1);
}
const client = new MongoClient(process.env.MONGODB_URI);
const res = await client.db().collection('user').updateOne({ email }, { $set: { role: 'admin' } });
console.log(res.matchedCount ? `${email} এখন admin` : 'এই ইমেইলে কোনো ইউজার পাওয়া যায়নি');
await client.close();
