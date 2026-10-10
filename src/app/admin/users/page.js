"use client";

import React, { useState, useEffect } from "react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch registered users from database
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        // Support array response or object with users key
        const userList = Array.isArray(data) ? data : data.users || [];
        setUsers(userList);
      } else {
        setError("Failed to fetch users from server.");
      }
    } catch (err) {
      console.error("Users loading error:", err);
      setError("Network or API endpoint issue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Banner */}
      <div className="bg-[#1E293B] p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Registered Users & Accounts</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time registered customer and staff accounts from database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>🔄</span> Refresh Users
          </button>
          <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 rounded-xl">
            Total: {users.length}
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#1E293B] p-6 rounded-3xl border border-slate-800 shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-emerald-400 animate-pulse">
            Loading Real-time Accounts from Database...
          </div>
        ) : error ? (
          <div className="py-10 text-center text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4">
            {error} (Make sure `/api/admin/users` API endpoint is implemented)
          </div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3">SL</th>
                  <th className="py-3">User Name</th>
                  <th className="py-3">Email Address</th>
                  <th className="py-3">Role</th>
                  <th className="py-3 text-right">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u, idx) => (
                  <tr key={u._id || u.id || idx}>
                    <td className="py-3 text-slate-500 font-mono">{idx + 1}</td>
                    <td className="py-3 font-bold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-500/30">
                        {u.name ? u.name[0].toUpperCase() : "U"}
                      </div>
                      <span>{u.name || "Customer User"}</span>
                    </td>
                    <td className="py-3 text-slate-300 font-mono">{u.email}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${
                        u.role === "Admin" || u.role === "Super Admin"
                          ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}>
                        {u.role || "Customer"}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-400 font-mono">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Recent"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center space-y-3">
            <div className="text-4xl">👥</div>
            <h3 className="text-sm font-bold text-white">No Users Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              ক্লিক করুন <strong>Refresh Users</strong> বাটনে অথবা নিশ্চিত করুন সাইন-আপ করার পর অ্যাকাউন্ট ডাটাবেজে সেভ হচ্ছে।
            </p>
          </div>
        )}
      </div>

    </div>
  );
}