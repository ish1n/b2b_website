import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TopNav from "../components/TopNav";
import KpiCard from "../components/KpiCard";
import StatusBar from "../components/StatusBar";
import LoadingSpinner from "../components/LoadingSpinner";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { FiPackage, FiUsers, FiBarChart2, FiSearch, FiArrowRight, FiBriefcase } from "react-icons/fi";
import { BiRupee } from "react-icons/bi";

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const AVATAR_COLORS = ['#1976D2', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2', '#BE185D'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border-l-4 border-[#1976D2] shadow-lg rounded-xl p-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <p className="text-[#1976D2] font-semibold text-xs mb-1">{label}</p>
                <p className="text-gray-800 font-bold text-sm">{payload[0].value} orders</p>
            </div>
        );
    }
    return null;
};

export default function AdminDashboard() {
    const { partner, orders, allManagers, loading } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");

    const stats = useMemo(() => {
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((s, o) => s + (o.amount || 0), 0);
        const tenants = [...new Set(orders.map(o => o.tenant))].filter(Boolean);
        const delivered = orders.filter(o => o.status === 'Delivered').length;
        const confirmed = orders.filter(o => o.status === 'Confirmed').length;
        const pending = orders.filter(o => o.status === 'Pending').length;

        // Trends
        const currentMonth = new Date().getMonth() + 1;
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const currOrdersData = orders.filter(o => o.month === currentMonth);
        const prevOrdersData = orders.filter(o => o.month === prevMonth);

        const diffOrders = currOrdersData.length - prevOrdersData.length;
        const ordersTrend = diffOrders > 0
            ? { direction: 'up', text: `↑ +${diffOrders} this month` }
            : diffOrders < 0
                ? { direction: 'down', text: `↓ ${diffOrders} this month` }
                : { direction: 'same', text: `— No change` };

        const currRev = currOrdersData.reduce((sum, o) => sum + (o.amount || 0), 0);
        const prevRev = prevOrdersData.reduce((sum, o) => sum + (o.amount || 0), 0);
        const diffRev = currRev - prevRev;
        const revTrend = diffRev > 0
            ? { direction: 'up', text: `↑ +₹${diffRev.toLocaleString()} this month` }
            : diffRev < 0
                ? { direction: 'down', text: `↓ -₹${Math.abs(diffRev).toLocaleString()} this month` }
                : { direction: 'same', text: `— No change` };

        // Monthly chart
        const monthMap = {};
        for (let m = 1; m <= 12; m++) monthMap[m] = 0;
        orders.forEach(o => { if (o.month) monthMap[o.month]++; });
        const chartData = Object.entries(monthMap)
            .map(([m, count]) => ({ month: MONTH_NAMES[+m], orders: count }));

        // Client stats
        const clientStats = allManagers.map(mgr => {
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
        }).sort((a, b) => b.totalOrders - a.totalOrders);

        return {
            totalOrders, totalRevenue, tenants, delivered, confirmed, pending,
            chartData, clientStats, ordersTrend, revTrend,
            totalClients: allManagers.length
        };
    }, [orders, allManagers]);

    const filteredClients = stats.clientStats.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const todayDateStr = new Intl.DateTimeFormat('en-US', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date());

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
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-sm">
                                    Admin
                                </span>
                            </div>
                            <p className="text-white/80 text-sm font-medium mb-1">Welcome back,</p>
                            <h1 className="text-2xl font-bold mb-1">{partner?.name}</h1>
                            <p className="text-blue-200 text-sm font-light">{todayDateStr}</p>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <KpiCard
                        icon={FiPackage}
                        value={stats.totalOrders}
                        label="Total Orders"
                        color="brand"
                        trend={stats.ordersTrend}
                    />
                    <KpiCard
                        icon={BiRupee}
                        value={`₹${stats.totalRevenue.toLocaleString()}`}
                        label="Total Revenue"
                        color="orange"
                        trend={stats.revTrend}
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
                        label="Total Tenants"
                        color="green"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Bar Chart */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h2 className="text-base font-bold text-gray-900 mb-1">Monthly Orders (All Clients)</h2>
                        <p className="text-xs text-gray-400 mb-5">Aggregated orders across all B2B partners</p>
                        {stats.chartData.some(d => d.orders > 0) ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={stats.chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f5" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F0F7FF' }} />
                                    <Bar dataKey="orders" fill="#0D47A1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-48 flex flex-col items-center justify-center text-gray-400 text-sm">
                                <FiBarChart2 size={32} className="text-gray-300 mb-2" />
                                No orders yet
                            </div>
                        )}
                    </div>

                    {/* Status Breakdown */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
                        <div>
                            <h2 className="text-base font-bold text-gray-900 mb-1">Order Status</h2>
                            <p className="text-xs text-gray-400 mb-6">Breakdown across all clients</p>
                            <div className="space-y-5">
                                {stats.delivered > 0 && <StatusBar label="Delivered" value={stats.delivered} total={stats.totalOrders} color="green" />}
                                {stats.confirmed > 0 && <StatusBar label="Confirmed" value={stats.confirmed} total={stats.totalOrders} color="brand" />}
                                {stats.pending > 0 && <StatusBar label="Pending" value={stats.pending} total={stats.totalOrders} color="orange" />}
                            </div>
                        </div>
                        <div className="mt-auto pt-4 border-t border-gray-100">
                            <div className="flex justify-between items-center text-xs text-gray-500">
                                <span className="uppercase font-semibold tracking-wider">Total Orders</span>
                                <span className="font-bold text-gray-800 text-lg">{stats.totalOrders}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Clients Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
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
