import { useMemo, useState, useCallback, useEffect } from "react";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useHostelAuth } from "../context/HostelAuthContext";
import { getCategoryForProperty } from "../data/hostelOrders";
import { CLIENT_CREDENTIALS } from "../data/hostelAuth";
import TopNav from "../components/TopNav";
import KpiCard from "../components/KpiCard";
import LoadingSpinner from "../components/LoadingSpinner";
import AdminOverviewTab from "../components/AdminOverviewTab";
import AdminHostelsTab from "../components/AdminHostelsTab";
import AdminHotelsTab from "../components/AdminHotelsTab";
import AdminRegularTab from "../components/AdminRegularTab";
import AdminIssuesTab from "../components/AdminIssuesTab";
import AdminExpensesTab from "../components/AdminExpensesTab";
import { FiPackage, FiAlertTriangle, FiCalendar, FiUsers } from "react-icons/fi";
import { BiRupee } from "react-icons/bi";
import { GiWeight } from "react-icons/gi";
import ExportCSV from "../components/ExportCSV";

const TABS = [
  { key: "overview", label: "📋 Overview" },
  { key: "hostels", label: "🏨 Hostels" },
  { key: "hotels", label: "🏩 Hotels & Airbnbs" },
  { key: "regular", label: "🛵 Regular Orders" },
  { key: "issues", label: "⚠️ Issues" },
];

export default function AdminDashboard() {
  const { client, orders: baseOrders } = useHostelAuth();
  const partner = client;
  const allManagers = CLIENT_CREDENTIALS.filter(c => c.id !== "admin-1");
  const loading = false;

  const [activeTab, setActiveTab] = useState("overview");
  const [dateFrom, setDateFrom] = useState("2026-03-01");
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [extraOrders, setExtraOrders] = useState([]);

  // Listen to Firestore for admin edits
  useEffect(() => {
    const editsRef = collection(db, "b2b_admin_edits");
    const unsub = onSnapshot(editsRef, (snapshot) => {
      const edits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("Firebase edits loaded:", edits);
      setExtraOrders(edits);
    }, (error) => {
      console.error("Error fetching admin edits:", error);
    });
    return () => unsub();
  }, []);

  const handleAddOrder = useCallback(async (order) => {
    try {
      await setDoc(doc(db, "b2b_admin_edits", order.id), order);
    } catch (err) {
      console.error("Failed to add order", err);
    }
  }, []);

  const handleEditOrder = useCallback(async (updatedOrder) => {
    try {
      if (!updatedOrder.id) throw new Error("Order ID missing");
      await setDoc(doc(db, "b2b_admin_edits", String(updatedOrder.id)), updatedOrder);
    } catch (err) {
      console.error("Failed to edit order", err);
    }
  }, []);

  // Filtered overlapping orders logic
  const allOrders = useMemo(() => {
    // baseOrders without the ones that are edited (which live in extraOrders)
    const extraIds = new Set(extraOrders.map(o => o.id));
    const cleanBase = baseOrders.filter(o => !extraIds.has(o.id));
    // Merge base data with extra orders, then filter out any soft-deleted records
    return [...cleanBase, ...extraOrders].filter(o => !o.isDeleted);
  }, [baseOrders, extraOrders]);

  // Date-filtered orders
  const orders = useMemo(() => {
    if (!dateFrom && !dateTo) return allOrders;
    return allOrders.filter(o => {
      if (!o.date) return true;
      if (dateFrom && o.date < dateFrom) return false;
      if (dateTo && o.date > dateTo) return false;
      return true;
    });
  }, [allOrders, dateFrom, dateTo]);

  // Days in range
  const daysInRange = useMemo(() => {
    const from = new Date(dateFrom || "2026-03-01");
    const to = new Date(dateTo || "2026-03-10");
    const days = [];
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      days.push(d.getDate());
    }
    return days;
  }, [dateFrom, dateTo]);

  // KPI stats
  const stats = useMemo(() => {
    const regular = orders.filter(o => o.category !== "ISSUES");
    const issues = orders.filter(o => o.category === "ISSUES");
    const totalOrders = regular.length;
    const totalRevenue = regular.reduce((s, o) => s + (o.amount || 0), 0);
    const totalKg = regular.reduce((s, o) => s + (o.weight || 0), 0);
    const openIssues = issues.filter(i => i.resolveStatus !== "Resolved").length;
    const totalClients = allManagers.filter(m => m.role !== "admin").length;
    return { totalOrders, totalRevenue, totalKg, openIssues, totalClients };
  }, [orders, allManagers]);

  const clients = useMemo(() => allManagers.filter(m => m.role !== "admin"), [allManagers]);


  const handleAddIssue = useCallback(async (issue) => {
    try {
      await setDoc(doc(db, "b2b_admin_edits", issue.id), issue);
    } catch (err) {
      console.error("Failed to add issue", err);
    }
  }, []);

  const handleEditIssue = useCallback(async (updatedIssue) => {
    try {
      if (!updatedIssue.id) throw new Error("Issue ID missing");
      await setDoc(doc(db, "b2b_admin_edits", String(updatedIssue.id)), updatedIssue);
    } catch (err) {
      console.error("Failed to edit issue", err);
    }
  }, []);

  const handleDeleteData = useCallback(async (item) => {
    if (!window.confirm("Are you sure you want to delete this specific record permanently?")) return;
    try {
      if (!item.id) throw new Error("ID missing for delete action");
      
      const idStr = String(item.id);
      // If the ID explicitly implies it was manually created from the dashboard (not historical static data), actually delete it from Firestore
      if (idStr.startsWith("reg-new-") || idStr.startsWith("issue-new-")) {
          await deleteDoc(doc(db, "b2b_admin_edits", idStr));
      } else {
          // Otherwise, it’s a historical static data point and we MUST use soft-delete { isDeleted: true } as an override to keep it hidden
          await setDoc(doc(db, "b2b_admin_edits", idStr), { ...item, isDeleted: true });
      }
    } catch (err) {
      console.error("Failed to delete record", err);
    }
  }, []);

  if (loading) return <LoadingSpinner fullscreen />;

  return (
    <div className="min-h-screen bg-[#F0F7FF]" style={{ fontFamily: "Poppins, sans-serif" }}>
      <TopNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#0D47A1] to-[#1565C0] rounded-2xl p-6 mb-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-full pointer-events-none">
            <div className="absolute right-[-20%] top-[-40%] w-64 h-64 bg-white opacity-10 rounded-full" />
            <div className="absolute right-[10%] bottom-[-50%] w-56 h-56 bg-white opacity-20 rounded-full" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-sm">Admin</span>
              <p className="text-white/80 text-sm font-medium mt-2 mb-1">Welcome back,</p>
              <h1 className="text-2xl font-bold">{partner?.name}</h1>
            </div>
            <div className="flex items-center gap-3">
              {/* CEO Expenses Button */}
              <button onClick={() => setActiveTab(activeTab === "expenses" ? "overview" : "expenses")}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md border ${activeTab === "expenses" ? 'bg-white text-[#0D47A1] border-white' : 'bg-amber-400 text-amber-900 border-amber-300 hover:bg-amber-300'}`}>
                💰 CEO Expenses
              </button>
              {/* Date Range Filter */}
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20">
                <FiCalendar size={16} className="text-white/70" />
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="bg-transparent text-white text-sm outline-none border-none w-[130px] [color-scheme:dark]" />
                <span className="text-white/50 text-xs">to</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="bg-transparent text-white text-sm outline-none border-none w-[130px] [color-scheme:dark]" />
              </div>
              <ExportCSV orders={orders} />
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <KpiCard icon={BiRupee} value={`₹${stats.totalRevenue.toLocaleString()}`} label="Total Revenue" color="orange" />
          <KpiCard icon={FiPackage} value={stats.totalOrders} label="Total Orders" sublabel="Excl. issues" color="brand" />
          <KpiCard icon={GiWeight} value={`${stats.totalKg.toFixed(1)} KG`} label="KG Processed" color="green" />
          <KpiCard icon={FiUsers} value={stats.totalClients} label="B2B Clients" color="purple" />
          <KpiCard icon={FiAlertTriangle} value={stats.openIssues} label="Open Issues" color={stats.openIssues > 0 ? "danger" : "green"} />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-1.5 mb-8">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.key ? 'bg-[#1976D2] text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && <AdminOverviewTab orders={orders} clients={clients} daysInRange={daysInRange} onDeleteData={handleDeleteData} />}
        {activeTab === "hostels" && <AdminHostelsTab orders={orders} daysInRange={daysInRange} />}
        {activeTab === "hotels" && <AdminHotelsTab orders={orders} />}
        {activeTab === "regular" && <AdminRegularTab orders={orders} onAddOrder={handleAddOrder} onEditOrder={handleEditOrder} onDeleteOrder={handleDeleteData} />}
        {activeTab === "issues" && <AdminIssuesTab orders={orders} onAddIssue={handleAddIssue} onEditIssue={handleEditIssue} onDeleteIssue={handleDeleteData} />}
        {activeTab === "expenses" && <AdminExpensesTab />}
      </div>
    </div>
  );
}