import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCategoryForTenant } from "../data/mockOrders";
import TopNav from "../components/TopNav";
import KpiCard from "../components/KpiCard";
import StatusBar from "../components/StatusBar";
import LoadingSpinner from "../components/LoadingSpinner";
import OrderTable from "../components/OrderTable";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { FiPackage, FiUsers, FiBarChart2, FiSearch, FiArrowRight, FiBriefcase, FiFilter, FiAlertTriangle, FiCalendar } from "react-icons/fi";
import { BiRupee } from "react-icons/bi";

const DATE_RANGE = "Mar 1 – Mar 10, 2026";
const DAYS_IN_RANGE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const AVATAR_COLORS = ['#1976D2', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2', '#BE185D'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border-l-4 border-[#1976D2] shadow-lg rounded-xl p-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <p className="text-[#1976D2] font-semibold text-xs mb-1">Mar {label}</p>
                <p className="text-gray-800 font-bold text-sm">{payload[0].value} orders</p>
                {payload[1] && <p className="text-gray-500 text-xs">₹{payload[1].value.toLocaleString()}</p>}
            </div>
        );
    }
    return null;
};

export default function AdminDashboard() {
    const { partner, orders, allManagers, loading } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterTenant, setFilterTenant] = useState("All");
    const [filterCategory, setFilterCategory] = useState("All");

    const stats = useMemo(() => {
        // Separate issues from regular orders for KPI calculations
        const regularOrders = orders.filter(o => o.tenant !== "Issues & Complaints");
        const issueOrders = orders.filter(o => o.tenant === "Issues & Complaints" || o.hasIssue);

        const totalOrders = regularOrders.length;
        const totalRevenue = regularOrders.reduce((s, o) => s + (o.amount || 0), 0);
        const tenants = [...new Set(regularOrders.map(o => o.tenant))].filter(Boolean);
        const delivered = regularOrders.filter(o => o.status === 'Delivered').length;
        const confirmed = regularOrders.filter(o => o.status === 'Confirmed').length;
        const pending = regularOrders.filter(o => o.status === 'Pending').length;

        // Daily chart (Mar 1-10)
        const dailyChartData = DAYS_IN_RANGE.map(day => {
            const dayOrders = regularOrders.filter(o => o.day === day);
            return {
                day,
                orders: dayOrders.length,
                revenue: dayOrders.reduce((sum, o) => sum + (o.amount || 0), 0)
            };
        });

        // Category breakdown
        const categoryMap = {};
        regularOrders.forEach(o => {
            const cat = getCategoryForTenant(o.tenant);
            if (!categoryMap[cat.key]) {
                categoryMap[cat.key] = { label: cat.label, color: cat.color, orders: 0, revenue: 0 };
            }
            categoryMap[cat.key].orders++;
            categoryMap[cat.key].revenue += (o.amount || 0);
        });
        const categoryBreakdown = Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue);

        // Client stats
        const clientStats = allManagers
            .filter(m => m.role !== "admin")
            .map(mgr => {
                const partnerNames = mgr.partnernames || [];
                const clientOrders = orders.filter(o => partnerNames.includes(o.tenant));
                const clientRevenue = clientOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

                let lastOrder = null;
                clientOrders.forEach(o => {
                    if (o.date) {
                        const d = new Date(o.date);
                        if (!lastOrder || d > lastOrder) lastOrder = d;
                    }
                });

                return {
                    id: mgr.id,
                    name: mgr.name,
                    email: mgr.email || "—",
                    partners: partnerNames,
                    partnerCount: partnerNames.length,
                    totalOrders: clientOrders.length,
                    totalRevenue: clientRevenue,
                    lastOrder
                };
            }).sort((a, b) => b.totalRevenue - a.totalRevenue);

        const availableTenants = [...new Set(orders.map(o => o.tenant))].filter(Boolean).sort();

        return {
            totalOrders, totalRevenue, tenants, delivered, confirmed, pending,
            dailyChartData, categoryBreakdown, clientStats,
            issueOrders, totalClients: allManagers.filter(m => m.role !== 'admin').length,
            availableTenants
        };
    }, [orders, allManagers]);

    // Filtered orders for table
    const filteredDetailedOrders = useMemo(() => {
        return orders.filter(order => {
            const matchTenant = filterTenant === "All" || order.tenant === filterTenant;
            const matchCategory = filterCategory === "All" || getCategoryForTenant(order.tenant).key === filterCategory;
            return matchTenant && matchCategory;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [orders, filterTenant, filterCategory]);

    const filteredClients = stats.clientStats.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <LoadingSpinner fullscreen />;

    return (
        <div className="min-h-screen bg-[#F0F7FF]" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <TopNav />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Admin Greeting Banner */}
                <div className="bg-gradient-to-r from-[#0D47A1] to-[#1565C0] rounded-2xl p-6 mb-8 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-64 h-full pointer-events-none">
                        <div className="absolute right-[-20%] top-[-40%] w-64 h-64 bg-white opacity-10 rounded-full" />
                        <div className="absolute right-[10%] bottom-[-50%] w-56 h-56 bg-white opacity-20 rounded-full" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-sm">
                                Admin
                            </span>
                        </div>
                        <p className="text-white/80 text-sm font-medium mb-1">Welcome back,</p>
                        <h1 className="text-2xl font-bold">{partner?.name}</h1>
                    </div>
                </div>

                {/* Issues Alert Panel */}
                {stats.issueOrders.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-8">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                <FiAlertTriangle size={16} className="text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-red-800">{stats.issueOrders.length} Open Issue{stats.issueOrders.length !== 1 ? 's' : ''}</h3>
                                <p className="text-xs text-red-500">Requires attention</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {stats.issueOrders.map(issue => (
                                <div key={issue.id} className="bg-white rounded-xl px-4 py-3 border border-red-100 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap flex-shrink-0">
                                        {issue.issueType || "Issue"}
                                    </span>
                                    <p className="text-sm text-gray-700 flex-1">{issue.service}</p>
                                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
                                        <span>{issue.date}</span>
                                        {issue.reportedBy && <span>by {issue.reportedBy}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <KpiCard
                        icon={FiPackage}
                        value={stats.totalOrders}
                        label="Total Orders"
                        sublabel="Excl. issues"
                        color="brand"
                    />
                    <KpiCard
                        icon={BiRupee}
                        value={`₹${stats.totalRevenue.toLocaleString()}`}
                        label="Total Revenue"
                        sublabel={DATE_RANGE}
                        color="orange"
                    />
                    <KpiCard
                        icon={FiBriefcase}
                        value={stats.totalClients}
                        label="B2B Clients"
                        color="purple"
                    />
                    <KpiCard
                        icon={FiUsers}
                        value={stats.tenants.length}
                        label="Active Tenants"
                        color="green"
                    />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Daily Bar Chart */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Daily Orders</h2>
                                <p className="text-xs text-gray-400">{DATE_RANGE}</p>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={stats.dailyChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f5" vertical={false} />
                                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F0F7FF' }} />
                                <Bar dataKey="orders" fill="#0D47A1" radius={[6, 6, 0, 0]} maxBarSize={45} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Right Column — Status + Categories */}
                    <div className="space-y-6">
                        {/* Status Breakdown */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-base font-bold text-gray-900 mb-1">Order Status</h2>
                            <p className="text-xs text-gray-400 mb-5">Across all tenants</p>
                            <div className="space-y-4">
                                {stats.delivered > 0 && <StatusBar label="Delivered" value={stats.delivered} total={stats.totalOrders} color="green" />}
                                {stats.confirmed > 0 && <StatusBar label="Confirmed" value={stats.confirmed} total={stats.totalOrders} color="brand" />}
                                {stats.pending > 0 && <StatusBar label="Pending" value={stats.pending} total={stats.totalOrders} color="orange" />}
                            </div>
                        </div>

                        {/* Category Breakdown */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-base font-bold text-gray-900 mb-4">Revenue by Category</h2>
                            <div className="space-y-3">
                                {stats.categoryBreakdown.map(cat => (
                                    <div key={cat.label} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                                            <span className="text-xs font-medium text-gray-600">{cat.label}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-gray-800">₹{cat.revenue.toLocaleString()}</span>
                                            <span className="text-[10px] text-gray-400 ml-1.5">({cat.orders})</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Orders Log */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
                    <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Detailed Order Log</h2>
                            <p className="text-xs text-gray-500 mt-1">All orders from {DATE_RANGE}. Issues are highlighted in red.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Category Filter */}
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                <FiFilter className="text-gray-400" size={14} />
                                <select
                                    className="bg-transparent text-sm text-gray-700 outline-none cursor-pointer"
                                    value={filterCategory}
                                    onChange={(e) => { setFilterCategory(e.target.value); setFilterTenant("All"); }}
                                >
                                    <option value="All">All Categories</option>
                                    <option value="STUDENT_LAUNDRY">Student Laundry (B2B)</option>
                                    <option value="LINEN_SERVICES">Linen Services (B2B)</option>
                                    <option value="B2C_RETAIL">Retail Customers (B2C)</option>
                                    <option value="AIRBNB">Airbnb Services</option>
                                    <option value="ISSUES">Issues & Complaints</option>
                                </select>
                            </div>

                            {/* Tenant Filter */}
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                <FiFilter className="text-gray-400" size={14} />
                                <select
                                    className="bg-transparent text-sm text-gray-700 outline-none cursor-pointer"
                                    value={filterTenant}
                                    onChange={(e) => setFilterTenant(e.target.value)}
                                >
                                    <option value="All">All Hostels / Clients</option>
                                    {stats.availableTenants.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <OrderTable orders={filteredDetailedOrders} showTenant={true} />
                </div>

                {/* Clients Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                        <div>
                            <h2 className="text-base font-bold text-gray-900">B2B Clients Overview</h2>
                            <p className="text-xs text-gray-400 mt-0.5">All registered B2B managers and their performance</p>
                        </div>
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search clients..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="border border-gray-200 rounded-lg pl-9 pr-3 py-2 w-full sm:w-64 text-sm focus:border-blue-400 focus:outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[750px]">
                            <thead>
                                <tr className="bg-[#E8EAF6] border-y border-indigo-100">
                                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 rounded-tl-xl w-12">#</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Client</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Partners</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Last Order</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Orders</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Revenue</th>
                                    <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3 rounded-tr-xl">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClients.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-8 text-gray-400 text-sm">No clients found</td></tr>
                                ) : filteredClients.map((client, idx) => {
                                    const initial = client.name ? client.name.charAt(0).toUpperCase() : '?';
                                    const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                                    const orderDateStr = client.lastOrder
                                        ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(client.lastOrder)
                                        : '—';

                                    return (
                                        <tr key={client.id} className="border-b border-gray-50 hover:bg-[#F0F7FF]/50 transition-colors">
                                            <td className="px-4 py-3 text-xs font-bold text-gray-400">{idx + 1}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                                                        style={{ backgroundColor: avatarColor }}
                                                    >
                                                        {initial}
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-semibold text-gray-800 block">{client.name}</span>
                                                        <span className="text-[11px] text-gray-400">{client.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="bg-blue-50 text-[#1976D2] text-xs font-semibold px-2.5 py-1 rounded-full">
                                                    {client.partnerCount} partner{client.partnerCount !== 1 ? 's' : ''}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500 font-medium">{orderDateStr}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 font-semibold">{client.totalOrders}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-800">₹{client.totalRevenue.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right">
                                                {client.partners.length > 0 && (
                                                    <button
                                                        onClick={() => navigate(`/tenants/${encodeURIComponent(client.partners[0])}/months`)}
                                                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#E8EAF6] text-[#0D47A1] text-xs font-semibold border border-indigo-100 hover:bg-indigo-100 transition-all"
                                                    >
                                                        View <FiArrowRight size={12} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}