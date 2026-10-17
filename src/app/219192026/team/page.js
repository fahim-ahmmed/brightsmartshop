"use client";

import React, { useState, useEffect } from "react";

export default function ManagementTeamPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Sub-Admin",
  });

  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);

  // Fetch Team Members
  const fetchTeam = async () => {
    try {
      const res = await fetch("/api/admin/team");
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data.members || data.team || []);
      }
    } catch (err) {
      console.error("Failed to load team members", err);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleCreateSubAdmin = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.name) {
      alert("Please fill in name, email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Sub-Admin created successfully!");
        setFormData({ name: "", email: "", password: "", role: "Sub-Admin" });
        fetchTeam(); // Refresh List
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to create Sub-Admin.");
      }
    } catch (err) {
      console.error("Sub-admin creation error", err);
      alert("Error occurred while creating sub-admin.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (id) => {
    if (confirm("Are you sure you want to delete this Sub-Admin?")) {
      try {
        const res = await fetch(`/api/admin/team?id=${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setTeamMembers(teamMembers.filter((m) => (m._id || m.id) !== id));
          alert("Sub-Admin removed successfully.");
        }
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  };

  return (
    <div className="space-y-8 font-sans text-slate-100">
      <div className="bg-[#1E293B] p-6 rounded-3xl border border-slate-800 shadow-xl flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white">Management Team & Sub-Admins</h1>
          <p className="text-xs text-slate-400 mt-1">
            Add Sub-Admins with direct email & password access.
          </p>
        </div>
        <span className="px-3.5 py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-black rounded-xl">
          Total Team: {teamMembers.length}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-5 bg-[#1E293B] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
            Add New Sub-Admin
          </h2>

          <form onSubmit={handleCreateSubAdmin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Arif Rahman"
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Login Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="subadmin@brightsmartshop.com"
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="Sub-Admin" className="bg-[#0F172A] text-white">Sub-Admin</option>
                <option value="Product Manager" className="bg-[#0F172A] text-white">Product Manager</option>
                <option value="Order Manager" className="bg-[#0F172A] text-white">Order Manager</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              {loading ? "Creating..." : "👑 Add Sub-Admin Account"}
            </button>
          </form>
        </div>

        {/* Team Members List */}
        <div className="lg:col-span-7 bg-[#1E293B] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
            Active Management Team
          </h3>

          <div className="space-y-3">
            {teamMembers.length > 0 ? (
              teamMembers.map((member) => (
                <div
                  key={member._id || member.id}
                  className="p-4 bg-[#0F172A] rounded-2xl border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 font-black flex items-center justify-center text-sm border border-purple-500/30">
                      {member.name ? member.name[0].toUpperCase() : "A"}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white flex items-center gap-2">
                        {member.name}
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] rounded-full font-black">
                          {member.role || "Sub-Admin"}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{member.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteMember(member._id || member.id)}
                    className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-8 text-center italic">
                No Sub-Admins added yet. Use the form to add one.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}