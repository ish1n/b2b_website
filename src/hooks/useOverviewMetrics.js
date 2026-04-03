import { useMemo } from "react";
import { getCategoryForProperty } from "../data/hostelOrders";
import { getOrderTypeLabel, ORDER_CATEGORIES, ORDER_TYPES } from "../constants/orders";

function getDisplayLabel(fullDate, previousDate) {
  const dayNum = parseInt(fullDate.split("-")[2], 10);
  const isNewMonth = !previousDate || previousDate.slice(0, 7) !== fullDate.slice(0, 7);
  return isNewMonth ? `${fullDate.slice(5, 7)}/${fullDate.slice(8, 10)}` : String(dayNum);
}

export function useOverviewMetrics({ orders, daysInRange }) {
  const nonIssueOrders = useMemo(
    () => orders.filter((order) => order.category !== ORDER_CATEGORIES.ISSUES),
    [orders]
  );

  const dailyRevenue = useMemo(
    () =>
      daysInRange.map((fullDate, index) => {
        const dayOrders = nonIssueOrders.filter((order) => order.date === fullDate);
        return {
          day: getDisplayLabel(fullDate, daysInRange[index - 1]),
          fullDate,
          revenue: dayOrders.reduce((sum, order) => sum + (order.amount || 0), 0),
        };
      }),
    [daysInRange, nonIssueOrders]
  );

  const totalRevenue = useMemo(
    () => nonIssueOrders.reduce((sum, order) => sum + (order.amount || 0), 0),
    [nonIssueOrders]
  );

  const categoryBreakdown = useMemo(() => {
    const categoryMap = {};

    nonIssueOrders.forEach((order) => {
      const category = order.channel === "Website"
        ? { key: "website", label: "Website Store", color: "#6366F1" }
        : getCategoryForProperty(order.property || order.tenant);

      if (!categoryMap[category.key]) {
        categoryMap[category.key] = { label: category.label, color: category.color, orders: 0, revenue: 0 };
      }

      categoryMap[category.key].orders += 1;
      categoryMap[category.key].revenue += order.amount || 0;
    });

    return Object.values(categoryMap)
      .map((category) => ({
        ...category,
        share: totalRevenue > 0 ? (category.revenue / totalRevenue) * 100 : 0,
      }))
      .sort((left, right) => right.revenue - left.revenue);
  }, [nonIssueOrders, totalRevenue]);

  const propertyRows = useMemo(() => {
    const propertyMap = new Map();

    nonIssueOrders.forEach((order) => {
      const key = order.type === ORDER_TYPES.REGULAR ? (order.channel || order.property || "Retail") : order.property;
      if (!key) return;

      if (!propertyMap.has(key)) {
        propertyMap.set(key, {
          id: key.toLowerCase().replace(/\s+/g, "-"),
          name: key,
          properties: [key],
          hostelType: getOrderTypeLabel(order.type),
          rev: 0,
          kg: 0,
          clothes: 0,
          orders: 0,
          issues: 0,
          last: null,
        });
      }

      const row = propertyMap.get(key);
      row.rev += order.amount || 0;
      row.kg += order.weight || 0;
      row.clothes += order.items || 0;
      row.orders += 1;

      if (order.date) {
        const currentDate = new Date(order.date);
        if (!row.last || currentDate > row.last) row.last = currentDate;
      }
    });

    return Array.from(propertyMap.values());
  }, [nonIssueOrders]);

  return {
    categoryBreakdown,
    dailyRevenue,
    propertyRows,
    totalRevenue,
  };
}
