import { useMemo, useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { FiX, FiLoader, FiPlus, FiTrash2 } from "react-icons/fi";
import { HOTEL_ITEMS, ITEM_RATE_MAP, STUDENT_RATE_PER_KG } from "../config/orderRateCard";
import { ORDER_CATEGORIES, ORDER_STATUSES, ORDER_TYPES } from "../constants/orders";
import { normalizePropertyName } from "../utils/orderNormalization";

const getTodayString = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];

export default function AdminAddOrderModal({ isOpen, onClose, onSuccess }) {
  const [orderCategory, setOrderCategory] = useState("hostel");
  const [hostelType, setHostelType] = useState("student");
  const [propertyName, setPropertyName] = useState("");
  const [orderDate, setOrderDate] = useState(getTodayString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [weight, setWeight] = useState("");
  const [totalClothes, setTotalClothes] = useState("");
  const [studentCount, setStudentCount] = useState("");
  const [studentRate, setStudentRate] = useState(String(STUDENT_RATE_PER_KG));
  const [hotelItems, setHotelItems] = useState([{ name: "Single Bedsheet", quantity: 1, rate: ITEM_RATE_MAP["Single Bedsheet"] }]);

  const isStudent = orderCategory === "hostel" && hostelType === "student";
  const isItemized = orderCategory === "hotel" || (orderCategory === "hostel" && hostelType === "linen");

  const calculatedAmount = useMemo(() => {
    if (isStudent) {
      const parsedWeight = Number(weight);
      const parsedRate = Number(studentRate);
      if (!parsedWeight || parsedWeight <= 0 || !parsedRate || parsedRate <= 0) return 0;
      return Number((parsedWeight * parsedRate).toFixed(2));
    }

    if (isItemized) {
      return hotelItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0), 0);
    }

    return 0;
  }, [hotelItems, isItemized, isStudent, studentRate, weight]);

  if (!isOpen) return null;

  const resetForm = () => {
    setPropertyName("");
    setOrderDate(getTodayString());
    setWeight("");
    setTotalClothes("");
    setStudentCount("");
    setStudentRate(String(STUDENT_RATE_PER_KG));
    setHotelItems([{ name: "Single Bedsheet", quantity: 1, rate: ITEM_RATE_MAP["Single Bedsheet"] }]);
  };

  const handleHotelItemChange = (index, field, value) => {
    const nextItems = [...hotelItems];
    if (field === "name") {
      nextItems[index].name = value;
      nextItems[index].rate = ITEM_RATE_MAP[value] ?? nextItems[index].rate ?? "";
    } else {
      nextItems[index][field] = value;
    }
    setHotelItems(nextItems);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!propertyName.trim()) throw new Error("Property name is required.");
      const normalizedPropertyName = normalizePropertyName(propertyName);

      let orderPayload = {
        createdAt: serverTimestamp(),
        property: normalizedPropertyName,
        date: orderDate || getTodayString(),
        status: ORDER_STATUSES.PENDING,
      };

      if (isStudent) {
        if (!weight || !studentCount) throw new Error("Weight and Student Count are required for Student Laundry.");
        orderPayload = {
          ...orderPayload,
          category: ORDER_CATEGORIES.STUDENT_LAUNDRY,
          type: ORDER_TYPES.STUDENT,
          amount: calculatedAmount,
          weight: Number(weight),
          studentCount: Number(studentCount),
          items: totalClothes ? Number(totalClothes) : 0,
          service: `${Number(studentCount)} Students, ${Number(weight)} KG`,
          ratePerKg: Number(studentRate) || 0,
        };
      } else if (isItemized) {
        const validItems = hotelItems.filter((item) => item.name.trim() !== "" && item.quantity > 0);
        if (validItems.length === 0) throw new Error("Please add at least one valid item.");

        const details = {};
        const pricing = {};
        let totalCalculatedItems = 0;

        validItems.forEach((item) => {
          details[item.name] = Number(item.quantity);
          pricing[item.name] = Number(item.rate) || 0;
          totalCalculatedItems += Number(item.quantity);
        });

        orderPayload = {
          ...orderPayload,
          category: orderCategory === "hotel" ? ORDER_CATEGORIES.AIRBNB : ORDER_CATEGORIES.LINEN,
          type: orderCategory === "hotel" ? ORDER_TYPES.AIRBNB : ORDER_TYPES.LINEN,
          amount: calculatedAmount,
          details,
          items: totalCalculatedItems,
          service: validItems.map((item) => `${item.quantity} ${item.name}`).join(", "),
          pricing,
        };
      }

      await addDoc(collection(db, "b2b_orders"), orderPayload);

      if (onSuccess) {
        onSuccess({
          loggedType: orderCategory,
          orderDate: orderPayload.date,
          propertyName: orderPayload.property,
        });
      }

      resetForm();
      onClose();
    } catch (submissionError) {
      console.error("Order logging failed:", submissionError);
      setError(submissionError.message || "Failed to log order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-[#F8FAFC]">
          <div>
            <h2 className="text-lg font-black text-[#0F172A] tracking-tight">Log New Order</h2>
            <p className="text-xs font-bold text-slate-500 mt-0.5">Manually add an order to the system</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold">{error}</div>}

          <div className="flex bg-slate-100 p-1 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => setOrderCategory("hostel")}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${orderCategory === "hostel" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Hostel Bulk
            </button>
            <button
              type="button"
              onClick={() => setOrderCategory("hotel")}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${orderCategory === "hotel" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Hotel & Airbnb
            </button>
          </div>

          <form id="admin-order-form" onSubmit={handleSubmit} className="space-y-5">
            {orderCategory === "hostel" && (
              <div className="flex gap-3 mb-4">
                <label className="flex-1 relative cursor-pointer group">
                  <input type="radio" name="hostelType" className="peer sr-only" checked={hostelType === "student"} onChange={() => setHostelType("student")} />
                  <div className="p-3 border-2 rounded-xl border-slate-100 peer-checked:border-blue-500 peer-checked:bg-blue-50 transition-all text-center">
                    <p className="text-xs font-black text-slate-500 peer-checked:text-blue-700 uppercase tracking-wide">Student Laundry</p>
                  </div>
                </label>
                <label className="flex-1 relative cursor-pointer group">
                  <input type="radio" name="hostelType" className="peer sr-only" checked={hostelType === "linen"} onChange={() => setHostelType("linen")} />
                  <div className="p-3 border-2 rounded-xl border-slate-100 peer-checked:border-blue-500 peer-checked:bg-blue-50 transition-all text-center">
                    <p className="text-xs font-black text-slate-500 peer-checked:text-blue-700 uppercase tracking-wide">Linen Wash</p>
                  </div>
                </label>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Property Name</label>
              <input
                type="text"
                value={propertyName}
                onChange={(event) => setPropertyName(event.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold text-[#0F172A] focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="e.g., Stanza Living, Airbnb Viman Nagar"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Order Date</label>
              <input
                type="date"
                value={orderDate}
                onChange={(event) => setOrderDate(event.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold text-[#0F172A] focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                required
              />
            </div>

            <hr className="border-slate-100" />

            {isStudent && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Weight (kg)</label>
                    <input type="number" step="any" min="0" value={weight} onChange={(event) => setWeight(event.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold text-[#0F172A] focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g., 45.5" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Number of Students</label>
                    <input type="number" min="1" value={studentCount} onChange={(event) => setStudentCount(event.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold text-[#0F172A] focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g., 20" required />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Clothes</label>
                  <input type="number" min="1" value={totalClothes} onChange={(event) => setTotalClothes(event.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold text-[#0F172A] focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g., 150" />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Rate Per KG</label>
                  <input type="number" min="0" step="0.01" value={studentRate} onChange={(event) => setStudentRate(event.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold text-[#0F172A] focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g., 55" />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bill Amount</label>
                  <input type="text" value={`Rs ${calculatedAmount.toFixed(2)}`} readOnly className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-black text-emerald-700 bg-emerald-50 focus:outline-none" />
                  <p className="mt-1 text-[11px] font-bold text-slate-400">Auto-calculated at Rs {Number(studentRate) || 0}/kg</p>
                </div>
              </div>
            )}

            {isItemized && (
              <div className="space-y-3 pt-2">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Item Breakdown</label>
                {hotelItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input type="text" list="hotel-items-admin" placeholder="Item name" value={item.name} onChange={(event) => handleHotelItemChange(index, "name", event.target.value)} className="flex-1 p-2.5 border border-slate-200 rounded-xl text-sm font-bold text-[#0F172A] focus:ring-2 focus:ring-indigo-500 outline-none" required />
                    <datalist id="hotel-items-admin">
                      {HOTEL_ITEMS.map((itemName) => <option key={itemName} value={itemName} />)}
                    </datalist>
                    <input type="number" min="1" value={item.quantity} onChange={(event) => handleHotelItemChange(index, "quantity", event.target.value)} className="w-20 p-2.5 border border-slate-200 rounded-xl text-sm font-bold text-[#0F172A] focus:ring-2 focus:ring-indigo-500 outline-none text-center" required />
                    <input type="number" min="0" step="0.01" value={item.rate ?? ""} onChange={(event) => handleHotelItemChange(index, "rate", event.target.value)} className="w-24 p-2.5 border border-slate-200 rounded-xl text-sm font-bold text-[#0F172A] focus:ring-2 focus:ring-indigo-500 outline-none text-center" placeholder="Rate" required />
                    <button type="button" onClick={() => setHotelItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => setHotelItems((current) => [...current, { name: "", quantity: 1, rate: "" }])} className="flex items-center gap-1.5 text-xs font-black text-indigo-600 hover:text-indigo-700 mt-2 uppercase tracking-wide">
                  <FiPlus size={14} /> Add Line Item
                </button>
                <div className="pt-2">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bill Amount</label>
                  <input type="text" value={`Rs ${calculatedAmount.toFixed(2)}`} readOnly className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-black text-emerald-700 bg-emerald-50 focus:outline-none" />
                  <p className="mt-1 text-[11px] font-bold text-slate-400">Auto-calculated from the selected item quantities and rate card.</p>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button type="submit" form="admin-order-form" disabled={isSubmitting} className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-white rounded-xl transition-all shadow-md ${orderCategory === "hostel" ? "bg-blue-600 hover:bg-blue-700" : "bg-indigo-600 hover:bg-indigo-700"} disabled:opacity-70`}>
            {isSubmitting ? <FiLoader className="animate-spin" /> : null}
            {isSubmitting ? "Saving..." : "Log Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
