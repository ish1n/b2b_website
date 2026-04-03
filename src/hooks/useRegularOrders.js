import { useMemo } from "react";

export const REGULAR_CHANNELS = ["All", "App", "Website", "WhatsApp", "Outlet", "Call", "Student"];
export const REGULAR_SERVICE_TYPES = ["Wash & Fold", "Wash & Iron", "Wash & Fold + Iron", "Dry Clean", "Other"];
export const REGULAR_RATE_MAP = {
  "Wash & Fold": 55,
  "Wash & Iron": 90,
  "Wash & Fold + Iron": 120,
  "Dry Clean": 150,
  Other: 0,
};
export const REGULAR_STATUS_OPTIONS = ["Confirmed", "Pickup Done", "In Progress", "Delivered", "Pending"];

export function createEmptyRegularOrderForm() {
  return {
    customerName: "",
    phone: "",
    channel: "App",
    serviceType: "Wash & Fold",
    weight: "",
    clothes: "",
    amount: "",
    pickupDate: "",
    deliveryDate: "",
    notes: "",
    status: "Confirmed",
    id: null,
  };
}

export function getServiceLabel(service = "") {
  const [label] = String(service).split(/\s(?:—|-)\s/u);
  return label || "Wash & Fold";
}

export function useRegularOrders(orders, channelFilter) {
  const regularOrders = useMemo(
    () => orders.filter((order) => order.type === "regular"),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    const scopedOrders = channelFilter === "All"
      ? regularOrders
      : regularOrders.filter((order) => order.channel === channelFilter);

    return [...scopedOrders].sort((left, right) => new Date(right.date) - new Date(left.date));
  }, [channelFilter, regularOrders]);

  const channelStats = useMemo(() => {
    const stats = Object.fromEntries(
      REGULAR_CHANNELS.filter((channel) => channel !== "All").map((channel) => [channel, { count: 0, revenue: 0 }])
    );

    regularOrders.forEach((order) => {
      if (!stats[order.channel]) return;
      stats[order.channel].count += 1;
      stats[order.channel].revenue += order.amount || 0;
    });

    return stats;
  }, [regularOrders]);

  return {
    channelStats,
    filteredOrders,
  };
}
