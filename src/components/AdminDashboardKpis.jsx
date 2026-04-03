import { FiAlertCircle, FiTrendingUp, FiUsers } from "react-icons/fi";
import { BiRupee } from "react-icons/bi";
import { GiWeight } from "react-icons/gi";
import KpiCard from "./KpiCard";

function getKpiDefinitions({ activeTab, onTabChange, stats }) {
  return [
    {
      key: "revenue",
      label: activeTab === "overview" ? "Revenue (Overall)" : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Revenue`,
      value: `₹${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: BiRupee,
      color: "blue",
      onClick: () => onTabChange("overview"),
      trend: activeTab === "overview" ? { direction: "up", text: `Hostel: ₹${(stats.breakdown.hostelRevenue / 1000).toFixed(0)}k` } : null,
      sparklineData: stats.sparklines.revenue,
    },
    {
      key: "orders",
      label: "Total Orders",
      value: stats.totalOrders,
      icon: FiTrendingUp,
      color: "purple",
      onClick: () => onTabChange("overview"),
      sparklineData: stats.sparklines.orders,
    },
    {
      key: "kg",
      label: "KG Processed",
      value: `${stats.totalKg.toFixed(1)}`,
      icon: GiWeight,
      color: "green",
      onClick: () => onTabChange("hostels"),
      sparklineData: stats.sparklines.kg,
    },
    {
      key: "clients",
      label: activeTab === "hostels" ? "Managed Hostels" : activeTab === "hotels" ? "Active Properties" : "B2B Clients",
      value: stats.totalClients,
      icon: FiUsers,
      color: "amber",
      onClick: () => {
        if (activeTab === "overview") onTabChange("regular");
      },
      sparklineData: stats.sparklines.clients,
    },
    ...(activeTab === "overview"
      ? [{
        key: "issues",
        label: "Open Issues",
        value: stats.openIssuesCount,
        icon: FiAlertCircle,
        color: "red",
        onClick: () => onTabChange("issues"),
        trend: stats.openIssuesCount > 5 ? { direction: "up", text: "High" } : null,
        sparklineData: stats.sparklines.issues,
      }]
      : []),
  ];
}

export default function AdminDashboardKpis({ activeTab, columnsClass, onTabChange, stats }) {
  const kpis = getKpiDefinitions({ activeTab, onTabChange, stats });

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 ${columnsClass} gap-6 mb-8`}>
      {kpis.map((kpi) => (
        <KpiCard
          key={kpi.key}
          label={kpi.label}
          value={kpi.value}
          icon={kpi.icon}
          color={kpi.color}
          onClick={kpi.onClick}
          trend={kpi.trend}
          sparklineData={kpi.sparklineData}
        />
      ))}
    </div>
  );
}
