import { useMemo, useState, useCallback, useEffect } from "react";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { db, auth } from "../firebase";
import { useHostelAuth } from "../context/HostelAuthContext";
import { getCategoryForProperty } from "../data/hostelOrders";
import { CLIENT_CREDENTIALS } from "../data/hostelAuth";
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
import { FiHome, FiActivity, FiInbox, FiAlertCircle, FiUsers, FiTrendingUp } from "react-icons/fi";
import { BiRupee } from "react-icons/bi";
import { GiWeight } from "react-icons/gi";


export default function AdminDashboard() {
  const { client, orders: baseOrders, logout } = useHostelAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const partner = client;
  const allManagers = CLIENT_CREDENTIALS.filter(c => c.id !== "admin-1");
  const loading = false;

  const [activeTab, setActiveTab] = useState("overview");
  const [dateFrom, setDateFrom] = useState("2026-03-01");
  const [dateTo, setDateTo] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0]);
  const [extraOrders, setExtraOrders] = useState([]);

  // Listen to Firestore for admin edits — wait for Firebase Auth to be ready first
  useEffect(() => {
    let unsubSnapshot = () => {};
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubSnapshot(); // clean up any previous listener
      if (user) {
        const editsRef = collection(db, "b2b_admin_edits");
        unsubSnapshot = onSnapshot(editsRef, (snapshot) => {
          const edits = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          console.log("Firebase edits loaded:", edits);
          setExtraOrders(edits);
        }, (error) => {
          console.error("Error fetching admin edits:", error);
        });
      } else {
        setExtraOrders([]); // Clear edits on logout
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
    const regular = orders.filter(o => o.category !== "ISSUES");
    const issues = orders.filter(o => o.category === "ISSUES");
    
    // Total Metrics
    const totalRevenue = regular.reduce((s, o) => s + (o.amount || 0), 0);
    const totalOrders = regular.length;
    const totalKg = regular.reduce((s, o) => s + (o.weight || 0), 0);
    const totalClients = allManagers.filter(m => m.role !== "admin").length;
    const openIssuesCount = issues.filter(i => i.resolveStatus !== "Resolved").length;

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
        sparklines: {
            revenue: getTrend(o => o.category !== "ISSUES"),
            orders: getTrend(o => o.category !== "ISSUES"),
            kg: getTrend(o => o.category !== "ISSUES"),
            clients: daysInRange.map((_, i) => ({ v: 10 + Math.sin(i) * 2 })), // Mock sparkle for static count
            issues: getTrend(o => o.category === "ISSUES")
        }
    };
  }, [orders, allOrders, allManagers, daysInRange]);

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
    switch(activeTab) {
        case 'overview': return 'Dashboard Overview';
        case 'hostels': return 'Hostel Management';
        case 'hotels': return 'Hotel & Airbnb Analytics';
        case 'regular': return 'Regular B2C Orders';
        case 'issues': return 'Issue Tracker';
        case 'expenses': return 'CEO Expenses';
        default: return 'Admin Portal';
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F1F5F9]" style={{ fontFamily: "DM Sans, sans-serif" }}>
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        issuesCount={stats.openIssuesCount} 
        user={partner} 
        onLogout={logout}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'ml-[80px]' : 'ml-[220px]'}`}>
        <AdminTopBar 
            title={getPageTitle()}
            dateFrom={dateFrom}
            setDateFrom={setDateFrom}
            dateTo={dateTo}
            setDateTo={setDateTo}
            onExpensesClick={() => setActiveTab(activeTab === "expenses" ? "overview" : "expenses")}
            isExpensesActive={activeTab === "expenses"}
            orders={orders}
        />

        <div className="p-8">
            {/* KPI Cards - Hidden on Issues and Expenses tabs to reduce clutter */}
            {activeTab !== "issues" && activeTab !== "expenses" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <KpiCard 
                        label="Total Revenue" 
                        value={`₹${stats.totalRevenue.toLocaleString()}`} 
                        icon={BiRupee} 
                        color="blue" 
                        trend={{ direction: 'up', text: '12% inc' }}
                        sparklineData={stats.sparklines.revenue}
                    />
                    <KpiCard 
                        label="Total Orders" 
                        value={stats.totalOrders} 
                        icon={FiTrendingUp} 
                        color="purple" 
                        trend={{ direction: 'up', text: '5% inc' }}
                        sparklineData={stats.sparklines.orders}
                    />
                    <KpiCard 
                        label="KG Processed" 
                        value={`${stats.totalKg.toFixed(1)}`} 
                        icon={GiWeight} 
                        color="green" 
                        trend={{ direction: 'down', text: '2% dec' }}
                        sparklineData={stats.sparklines.kg}
                    />
                    <KpiCard 
                        label="B2B Clients" 
                        value={stats.totalClients} 
                        icon={FiUsers} 
                        color="amber" 
                        trend={{ direction: 'up', text: 'New +2' }}
                        sparklineData={stats.sparklines.clients}
                    />
                    <KpiCard 
                        label="Open Issues" 
                        value={stats.openIssuesCount} 
                        icon={FiAlertCircle} 
                        color="red" 
                        trend={stats.openIssuesCount > 5 ? { direction: 'up', text: 'High' } : null}
                        sparklineData={stats.sparklines.issues}
                    />
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
            </div>
        </div>
      </main>
    </div>
  );
}