// src/pages/AdminDashboard.jsx
import { useMemo, useState, useCallback, useEffect } from "react";
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase";
import { useHostelAuth } from "../context/HostelAuthContext";
import AdminSidebar from "../components/AdminSidebar";
import AdminTopBar from "../components/AdminTopBar";
import KpiCard from "../components/KpiCard";
import LoadingSpinner from "../components/LoadingSpinner";
import AdminOverviewTab from "../components/AdminOverviewTab";
import AdminHostelsTab from "../components/AdminHostelsTab";
import AdminHotelsTab from "../components/AdminHotelsTab";
import AdminRegularTab from "../components/AdminRegularTab";
import AdminIssuesTab from "../components/AdminIssuesTab";
import AdminExpensesTab from "../components/AdminExpensesTab";
import AdminAnalyticsTab from "../components/AdminAnalyticsTab";
import InvoiceGeneratorModal from "../components/InvoiceGeneratorModal";
import { FiAlertCircle, FiUsers, FiTrendingUp, FiFileText, FiShoppingBag } from "react-icons/fi";
import { BiRupee } from "react-icons/bi";
import { GiWeight } from "react-icons/gi";

export default function AdminDashboard() {
  const { client, orders: baseOrders, logout } = useHostelAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      setIsSidebarCollapsed(isMobile);
      if (!isMobile) setIsMobileMenuOpen(false);
    };
    handleResize(); // Set initial state correctly
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const partner = client;
  const [allManagers, setAllManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [screenStats, setScreenStats] = useState([]);
  const [searchStats, setSearchStats] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);

  const [activeTab, setActiveTab] = useState("overview");
  const [dateFrom, setDateFrom] = useState("2026-03-01");
  const [dateTo, setDateTo] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0]);
  const [extraOrders, setExtraOrders] = useState([]);

  // Invoice Modal State
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Listen to Firestore for admin edits — wait for Firebase Auth to be ready first
  useEffect(() => {
    let unsubSnapshot = () => { };
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubSnapshot(); // clean up any previous listener
      if (user) {
        setLoading(true);
        // Listen for Admin Edits
        const editsRef = collection(db, "b2b_admin_edits");
        unsubSnapshot = onSnapshot(editsRef, (snapshot) => {
          const edits = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setExtraOrders(edits);
          setLoading(false);
        }, (error) => {
          console.error("Error fetching admin edits:", error);
          setLoading(false);
        });

        // Listen for Managers (Clients list)
        const managersRef = collection(db, "b2b_managers");
        const unsubManagers = onSnapshot(managersRef, (snapshot) => {
          const managers = snapshot.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(m => m.role !== "admin"); // Filter out admin themselves
          setAllManagers(managers);
        }, (err) => {
          console.error("Error fetching managers list:", err);
        });

        // Listen for Screen Analytics
        const screensRef = query(collection(db, "analytics", "screens", "popular"), orderBy("visitCount", "desc"), limit(10));
        const unsubScreens = onSnapshot(screensRef, (snapshot) => {
          setScreenStats(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => console.error("Error fetching screen stats:", err));

        // Listen for Search Analytics
        const searchesRef = query(collection(db, "analytics", "searches", "popular"), orderBy("count", "desc"), limit(10));
        const unsubSearches = onSnapshot(searchesRef, (snapshot) => {
          setSearchStats(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => console.error("Error fetching search stats:", err));

        // Listen for Total Users
        const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
          setTotalUsers(snapshot.size);
        }, (err) => console.error("Error fetching users:", err));

        return () => { unsubSnapshot(); unsubManagers(); unsubScreens(); unsubSearches(); unsubUsers(); };
      } else {
        setExtraOrders([]);
        setAllManagers([]);
        setScreenStats([]);
        setSearchStats([]);
        setTotalUsers(0);
        setLoading(false);
      }
    });
    return () => { unsubAuth(); unsubSnapshot(); };
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

  // KPI stats & Sparklines
  const stats = useMemo(() => {
    // Determine which orders to focus on for the KPI cards based on active tab
    let focusOrders = orders.filter(o => o.category !== "ISSUES");

    if (activeTab === "regular") {
      focusOrders = orders.filter(o => o.type === "regular");
    } else if (activeTab === "hostels") {
      focusOrders = orders.filter(o => o.type === "student" || o.type === "linen");
    } else if (activeTab === "hotels") {
      focusOrders = orders.filter(o => o.type === "airbnb");
    }

    const issues = orders.filter(o => o.category === "ISSUES");

    // Total Metrics
    const totalRevenue = focusOrders.reduce((s, o) => s + (o.amount || 0), 0);
    const totalOrders = focusOrders.length;
    const totalKg = focusOrders.reduce((s, o) => s + (o.weight || 0), 0);
    const totalClients = activeTab === "regular"
      ? new Set(focusOrders.filter(o => o.customerName && !o.id.includes("adj")).map(o => o.customerName)).size
      : activeTab === "hostels"
        ? new Set(focusOrders.map(o => o.property)).size
        : activeTab === "hotels"
          ? new Set(focusOrders.map(o => o.property)).size
          : allManagers.filter(m => m.role !== "admin").length;
    const openIssuesCount = issues.filter(i => i.resolveStatus !== "Resolved").length;

    // Segment Breakdowns for Overview
    const hostelRevenue = orders.filter(o => o.type === "student" || o.type === "linen").reduce((s, o) => s + (o.amount || 0), 0);
    const retailRevenue = orders.filter(o => o.type === "regular").reduce((s, o) => s + (o.amount || 0), 0);
    const hotelRevenue = orders.filter(o => o.type === "airbnb").reduce((s, o) => s + (o.amount || 0), 0);

    // Helper: Build daily trend data for sparklines
    const getTrend = (filterFn) => {
      return daysInRange.map(day => ({
        v: allOrders.filter(o => {
          const d = o.date ? parseInt(o.date.split("-")[2], 10) : o.day;
          return d === day && filterFn(o);
        }).reduce((s, o) => s + (o.amount || o.weight || 1), 0)
      }));
    };

    return {
      totalRevenue,
      totalOrders,
      totalKg,
      totalClients,
      openIssuesCount,
      breakdown: { hostelRevenue, retailRevenue, hotelRevenue },
      sparklines: {
        revenue: getTrend(o => {
          if (activeTab === "regular") return o.type === "regular";
          if (activeTab === "hostels") return o.type === "student" || o.type === "linen";
          if (activeTab === "hotels") return o.type === "airbnb";
          return o.category !== "ISSUES";
        }),
        orders: getTrend(o => {
          if (activeTab === "regular") return o.type === "regular";
          if (activeTab === "hostels") return o.type === "student" || o.type === "linen";
          if (activeTab === "hotels") return o.type === "airbnb";
          return o.category !== "ISSUES";
        }),
        kg: getTrend(o => {
          if (activeTab === "regular") return o.type === "regular";
          if (activeTab === "hostels") return o.type === "student" || o.type === "linen";
          if (activeTab === "hotels") return o.type === "airbnb";
          return o.category !== "ISSUES";
        }),
        clients: daysInRange.map((_, i) => ({ v: 10 + Math.sin(i) * 2 })), // Mock sparkle for static count
        issues: getTrend(o => o.category === "ISSUES")
      }
    };
  }, [orders, allOrders, allManagers, daysInRange, activeTab]);

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

  const getPageTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Dashboard Overview';
      case 'hostels': return 'Hostel Management';
      case 'hotels': return 'Hotel & Airbnb Analytics';
      case 'regular': return 'Regular B2C Orders';
      case 'issues': return 'Issue Tracker';
      case 'expenses': return 'CEO Expenses';
      case 'analytics': return 'Business Analytics';
      default: return 'Admin Portal';
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F1F5F9]" style={{ fontFamily: "DM Sans, sans-serif" }}>
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
        }}
        issuesCount={stats.openIssuesCount}
        user={partner}
        onLogout={logout}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[220px]'} ml-0`}>
        <AdminTopBar
          title={getPageTitle()}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          onExpensesClick={() => setActiveTab(activeTab === "expenses" ? "overview" : "expenses")}
          isExpensesActive={activeTab === "expenses"}
          orders={orders}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />

        <div className="p-4 lg:p-8">
          {/* Generate Invoice Action Bar */}
          {['overview', 'hostels', 'hotels', 'regular'].includes(activeTab) && (
            <div className="flex justify-end mb-4 animate-fade-in">
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-xl transition-all shadow-sm"
              >
                <FiFileText size={18} /> Generate Invoice
              </button>
            </div>
          )}

          {/* KPI Cards - Hidden on Analytics, Issues and Expenses tabs to reduce clutter */}
          {activeTab !== "issues" && activeTab !== "expenses" && activeTab !== "analytics" && (
            <div className={`grid grid-cols-1 md:grid-cols-2 ${activeTab === "overview" ? "lg:grid-cols-5" : "lg:grid-cols-4"} gap-6 mb-8`}>
              <KpiCard
                label={activeTab === "overview" ? "Revenue (Overall)" : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Revenue`}
                value={`₹${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={BiRupee}
                color="blue"
                onClick={() => setActiveTab("overview")}
                trend={activeTab === "overview" ? { direction: 'up', text: `Hostel: ₹${(stats.breakdown.hostelRevenue / 1000).toFixed(0)}k` } : null}
                sparklineData={stats.sparklines.revenue}
              />
              <KpiCard
                label="Total Orders"
                value={stats.totalOrders}
                icon={FiTrendingUp}
                color="purple"
                onClick={() => setActiveTab("overview")}
                sparklineData={stats.sparklines.orders}
              />
              <KpiCard
                label="KG Processed"
                value={`${stats.totalKg.toFixed(1)}`}
                icon={GiWeight}
                color="green"
                onClick={() => setActiveTab("hostels")}
                sparklineData={stats.sparklines.kg}
              />
              <KpiCard
                label={
                  activeTab === "regular" ? "Retail Customers" :
                    activeTab === "hostels" ? "Managed Hostels" :
                      activeTab === "hotels" ? "Active Properties" : "B2B Clients"
                }
                value={stats.totalClients}
                icon={FiUsers}
                color="amber"
                onClick={() => { if (activeTab === "overview") setActiveTab("regular"); }}
                sparklineData={stats.sparklines.clients}
              />
              {activeTab === "overview" && (
                <KpiCard
                  label="Open Issues"
                  value={stats.openIssuesCount}
                  icon={FiAlertCircle}
                  color="red"
                  onClick={() => setActiveTab("issues")}
                  trend={stats.openIssuesCount > 5 ? { direction: 'up', text: 'High' } : null}
                  sparklineData={stats.sparklines.issues}
                />
              )}
            </div>
          )}

          {/* Tab Content */}
          <div className="animate-fade-in">
            {activeTab === "overview" && <AdminOverviewTab orders={orders} clients={clients} daysInRange={daysInRange} onDeleteData={handleDeleteData} />}
            {activeTab === "hostels" && <AdminHostelsTab orders={orders} daysInRange={daysInRange} />}
            {activeTab === "hotels" && <AdminHotelsTab orders={orders} />}
            {activeTab === "regular" && <AdminRegularTab orders={orders} onAddOrder={handleAddOrder} onEditOrder={handleEditOrder} onDeleteOrder={handleDeleteData} />}
            {activeTab === "issues" && <AdminIssuesTab orders={orders} onAddIssue={handleAddIssue} onEditIssue={handleEditIssue} onDeleteIssue={handleDeleteData} />}
            {activeTab === "expenses" && <AdminExpensesTab />}
            {activeTab === "analytics" && <AdminAnalyticsTab orders={orders} screens={screenStats} searches={searchStats} totalUsers={totalUsers} />}
          </div>
        </div>
      </main>

      {/* Invoice Generator Modal Component */}
      <InvoiceGeneratorModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        orders={orders}
      />
    </div>
  );
}