export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Mongoose lean ডকুমেন্টকে client-এ পাঠানোর উপযোগী সাধারণ অবজেক্টে বদলায় (ObjectId → string, Date → ISO)
export const serialize = (doc) => JSON.parse(JSON.stringify(doc));
