"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Edit Modal States
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    userId: "",
    name: "",
    phone: "",
    password: "",
    role: "Customer",
  });
  const [updating, setUpdating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const userList = Array.isArray(data) ? data : data.users || [];
        setUsers(userList);
      } else {
        setError("Failed to fetch users from server.");
        toast.error("Failed to fetch user data!");
      }
    } catch (err) {
      console.error("Users loading error:", err);
      setError("Network or API endpoint issue.");
      toast.error("Network error!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Search Filter Logic
  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  // Sorting Logic (Top IDs on top)
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (a.isSystemFounder && !b.isSystemFounder) return -1;
    if (!a.isSystemFounder && b.isSystemFounder) return 1;

    if (a.isSystemFounder && b.isSystemFounder) {
      const numA = parseInt(a.name?.replace(/\D/g, "")) || 0;
      const numB = parseInt(b.name?.replace(/\D/g, "")) || 0;
      return numA - numB;
    }

    return 0;
  });

  // 🟢 Excel/CSV Download Handler
  const handleDownloadExcel = () => {
    if (!sortedUsers || sortedUsers.length === 0) {
      toast.error("No users available to export!");
      return;
    }

    // CSV Header: Name, Phone Number, Address, ID, Sponsor ID
    let csvContent = "Name,Phone Number,Address,ID,Sponsor ID\n";

    sortedUsers.forEach((u) => {
      const name = `"${(u.name || "Customer").replace(/"/g, '""')}"`;
      const phone = `"${getDisplayPhone(u).replace(/"/g, '""')}"`;
      const address = `"${(u.address || u.deliveryAddress || "").replace(/"/g, '""')}"`;
      const id = `"${(u._id || u.id || u.referralCode || "").replace(/"/g, '""')}"`;
      const sponsorId = `"${(u.sponsorCode || u.referredBy || "").replace(/"/g, '""')}"`;

      csvContent += `${name},${phone},${address},${id},${sponsorId}\n`;
    });

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Registered_Users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Excel sheet downloaded successfully!");
  };

  // 1. Open Edit Modal
  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setEditForm({
      userId: user._id || user.id,
      name: user.name || "",
      phone: getDisplayPhone(user),
      password: user.password || user.rawPassword || "",
      role: user.role || "Customer",
    });
  };

  // 2. Submit Edit Form
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setUpdating(true);
    const toastId = toast.loading("Updating user information...");

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || "Information updated successfully!", { id: toastId });
        setEditingUser(null);
        fetchUsers();
      } else {
        toast.error(data.message || "Failed to update information.", { id: toastId });
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Server error occurred.", { id: toastId });
    } finally {
      setUpdating(false);
    }
  };

  // 3. Delete User Handler
  const handleDeleteUser = async (userId, userName) => {
    const toastId = toast.loading(`Deleting "${userName || "this user"}"...`);

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        setUsers(users.filter((u) => (u._id || u.id) !== userId));
        toast.success("User deleted successfully!", { id: toastId });
      } else {
        toast.error(data.message || "Failed to delete user.", { id: toastId });
      }
    } catch (err) {
      console.error("Delete user error:", err);
      toast.error("Server error occurred.", { id: toastId });
    }
  };

  const getDisplayPhone = (u) => {
    if (u.phone) return u.phone;
    if (u.email && u.email.includes("@brightsmartshop.local")) {
      return u.email.split("@")[0];
    }
    return u.email || "N/A";
  };

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

        <div className="flex flex-wrap items-center gap-3">
          {/* 🟢 Download Excel Button */}
          <button
            onClick={handleDownloadExcel}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>📊</span> Download Excel
          </button>

          <button
            onClick={() => {
              fetchUsers();
              toast.success("User list refreshed successfully!");
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>🔄</span> Refresh Users
          </button>

          <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 rounded-xl">
            Total: {users.length}
          </span>
        </div>
      </div>

      {/* Search Box */}
      <div className="bg-[#1E293B] p-4 rounded-2xl border border-slate-800">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or phone number..."
          className="w-full sm:w-96 bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Users Table */}
      <div className="bg-[#1E293B] p-6 rounded-3xl border border-slate-800 shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-emerald-400 animate-pulse">
            Loading Real-time Accounts from Database...
          </div>
        ) : error ? (
          <div className="py-10 text-center text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4">
            {error}
          </div>
        ) : sortedUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3">SL</th>
                  <th className="py-3">User Name</th>
                  <th className="py-3">Mobile Number</th>
                  <th className="py-3">Password</th>
                  <th className="py-3">Role</th>
                  <th className="py-3">Joined Date</th>
                  <th className="py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sortedUsers.map((u, idx) => {
                  const uid = u._id || u.id;
                  return (
                    <tr 
                      key={uid || idx} 
                      className={`transition-colors ${u.isSystemFounder ? "bg-amber-500/10 hover:bg-amber-500/20" : "hover:bg-slate-800/60"}`}
                    >
                      <td className="py-3 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="py-3 font-bold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-500/30">
                          {u.name ? u.name[0].toUpperCase() : "U"}
                        </div>
                        <span className={u.isSystemFounder ? "text-amber-400" : ""}>
                          {u.name || "Customer User"}
                        </span>
                        {u.isSystemFounder && (
                          <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full uppercase shadow-md tracking-wider whitespace-nowrap">
                            👑 Top ID
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-slate-300 font-mono font-bold text-emerald-400">
                        {getDisplayPhone(u)}
                      </td>
                      <td className="py-3 text-amber-300 font-mono font-semibold">
                        {u.password || u.rawPassword || "••••••••"}
                      </td>
                      <td className="py-3">
                        <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${
                          u.role === "Admin" || u.role === "Super Admin" || u.role === "admin"
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}>
                          {u.role || "Customer"}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400 font-mono">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Recent"}
                      </td>
                      
                      {/* Action Buttons */}
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-[11px] rounded-xl transition-all cursor-pointer border border-emerald-500/20 flex items-center gap-1"
                          >
                            <span>✏️</span> Edit
                          </button>

                          <button
                            onClick={() => handleDeleteUser(uid, u.name)}
                            className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-[11px] rounded-xl transition-all cursor-pointer border border-rose-500/20"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center space-y-3">
            <div className="text-4xl">👥</div>
            <h3 className="text-sm font-bold text-white">No Users Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No registered users found.
            </p>
          </div>
        )}
      </div>

      {/* EDIT USER POPUP MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#1E293B] border border-slate-700 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-6 relative">
            
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>✏️</span> Edit User Information
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white font-bold text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">User Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Mobile Number *</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold font-mono"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Password</label>
                <input
                  type="text"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-amber-300 focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="Enter new password"
                />
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Account Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold cursor-pointer"
                >
                  <option value="Customer">Customer</option>
                  <option value="sub-admin">Sub-Admin</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  {updating ? "Updating..." : "💾 Save Changes"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}