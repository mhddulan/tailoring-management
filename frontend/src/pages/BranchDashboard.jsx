import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./BranchDashboard.css";

const DEFAULT_ENDPOINT = "/branch-dashboard/";
const money = (value) =>
    `SAR ${Number(value || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
const dateLabel = (value) => {
    if (!value) return "—";
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleDateString("en-GB");
};

function StatCard({ title, value, icon, tone = "blue", onClick, subtitle }) {
    const content = (
        <>
            <div className="branch-stat-copy">
                <p>{title}</p>
                <h2>{value}</h2>
                {subtitle ? <small>{subtitle}</small> : null}
            </div>
            <div className="branch-stat-icon" aria-hidden="true">{icon}</div>
        </>
    );
    return onClick ? (
        <button type="button" className={`branch-stat-card ${tone} clickable`} onClick={onClick}>
            {content}
        </button>
    ) : (
        <div className={`branch-stat-card ${tone}`}>{content}</div>
    );
}

function Panel({ title, icon, children, className = "" }) {
    return (
        <section className={`branch-panel ${className}`}>
            <div className="branch-panel-heading"><h3>{icon ? <span>{icon} </span> : null}{title}</h3></div>
            {children}
        </section>
    );
}

function SimpleBars({ labels = [], values = [], format = (v) => v }) {
    const max = Math.max(1, ...values.map((v) => Number(v) || 0));
    if (!labels.length) return <div className="branch-empty">No chart data available for this period.</div>;
    return (
        <div className="branch-bars">
            {labels.map((label, index) => {
                const value = Number(values[index]) || 0;
                return <div className="branch-bar-row" key={`${label}-${index}`}>
                    <div className="branch-bar-label"><span>{label}</span><strong>{format(value)}</strong></div>
                    <div className="branch-bar-track"><div className="branch-bar-fill" style={{ width: `${Math.max(0, (value / max) * 100)}%` }} /></div>
                </div>;
            })}
        </div>
    );
}

export default function BranchDashboard() {
    const navigate = useNavigate();
    const [payload, setPayload] = useState(null);
    const [filter, setFilter] = useState("today");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [showCustom, setShowCustom] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadDashboard = useCallback(async (selectedFilter = filter, start = fromDate, end = toDate) => {
        setLoading(true);
        setError("");
        try {
            const params = { filter: selectedFilter };
            if (selectedFilter === "custom") {
                if (start) params.from_date = start;
                if (end) params.to_date = end;
            }
            // If your api.js already prefixes /api, use "branch-dashboard-data/" here instead.
            const response = await api.get(DEFAULT_ENDPOINT, { params });
            const data = response?.data ?? {};
            if (data.success === false) throw new Error(data.message || "Unable to load branch dashboard.");
            setPayload(data);
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Unable to load branch dashboard.");
        } finally {
            setLoading(false);
        }
    }, [filter, fromDate, toDate]);

    useEffect(() => { loadDashboard("today", "", ""); }, []); // initial dashboard load

    const stats = payload?.counts || payload?.statistics || {};
    const financial = payload?.financial || payload?.statistics || {};
    const payments = payload?.payments || {};
    const period = payload?.filter || payload?.period || {};
    const recentOrders = payload?.recent_orders || [];
    const recentPayments = payload?.recent_payments || [];
    const branchName = payload?.branch?.name || payload?.branch_name || "Branch Dashboard";

    const orderStatusLabels = ["Pending", "Cutting", "Stitching", "Ready", "Delivery", "Delivered"];
    const orderStatusValues = [stats.pending, stats.cutting, stats.stitching, stats.ready, stats.delivery, stats.delivered].map((v) => Number(v || 0));
    const financialLabels = ["Income", "Purchase", "Other Expense", "Net Profit"];
    const financialValues = [financial.total_income, financial.total_purchase, financial.total_expense, financial.net_profit].map((v) => Number(v || 0));
    const paymentLabels = ["Cash", "Bank", "Online", "Cheque", "POS"];
    const paymentValues = paymentLabels.map((label) => Number(payments[label.toLowerCase()] || 0));
    const sales = Number(financial.total_sales || 0);
    const purchase = Number(financial.total_purchase || 0);
    const expense = Number(financial.total_expense || 0);
    const netProfit = Number(financial.net_profit || 0);
    const pendingCount = Number(stats.pending || 0);
    const pendingAmount = Number(payments.pending_order_amount ?? payments.pending_amount ?? payments.outstanding_balance ?? 0);
    const cashBalance = payload?.balances?.cash_in_hand ?? payments.cash_balance ?? financial.cash_balance ?? payload?.balances?.cash;
    const bankBalance = payload?.balances?.cash_in_bank ?? payments.bank_balance ?? financial.bank_balance ?? payload?.balances?.bank;

    const selectedRange = useMemo(() => {
        const start = period.from_date || fromDate;
        const end = period.to_date || toDate;
        if (start && end) return `${dateLabel(start)} → ${dateLabel(end)}`;
        return "Selected period";
    }, [period.from_date, period.to_date, fromDate, toDate]);

    const applyQuickFilter = (value) => {
        setFilter(value);
        setShowCustom(false);
        loadDashboard(value, "", "");
    };

    const applyCustomFilter = (event) => {
        event.preventDefault();
        if (!fromDate || !toDate) {
            setError("Please select both From Date and To Date.");
            return;
        }
        setFilter("custom");
        loadDashboard("custom", fromDate, toDate);
    };

    const openPendingOrders = () => {
        // Adjust this route if your app uses a different order-list route.
        navigate("/orders?status=Pending");
    };

    if (loading && !payload) {
        return <div className="branch-dashboard-page"><div className="branch-loading"><span className="branch-spinner" />Loading branch dashboard…</div></div>;
    }

    return (
        <main className="branch-dashboard-page">
            <header className="branch-dashboard-header">
                <div><div className="branch-eyebrow">STITCHING PRO · BRANCH OVERVIEW</div><h1>▦ {branchName}</h1><p>Branch business overview and performance</p></div>
                <div className="branch-period"><small>Selected Period</small><strong>{selectedRange}</strong></div>
            </header>

            {error ? <div className="branch-alert" role="alert"><span>{error}</span><button type="button" onClick={() => loadDashboard()}>Retry</button></div> : null}

            <Panel title="Dashboard Period" icon="▦" className="branch-filter-panel">
                <div className="branch-filter-top"><p>Select the period for your branch statistics.</p><div className="branch-filter-buttons">
                    {[["today", "Today"], ["yesterday", "Yesterday"], ["week", "This Week"], ["month", "This Month"]].map(([value, label]) =>
                        <button key={value} type="button" className={filter === value ? "active" : ""} onClick={() => applyQuickFilter(value)}>{label}</button>
                    )}
                    <button type="button" className={filter === "custom" ? "active" : ""} onClick={() => setShowCustom((v) => !v)}>Custom</button>
                </div></div>
                {showCustom ? <form className="branch-custom-filter" onSubmit={applyCustomFilter}>
                    <label>From Date<input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} required /></label>
                    <label>To Date<input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} required /></label>
                    <button type="submit">Apply Filter</button>
                </form> : null}
            </Panel>

            <div className="branch-stat-grid">
                <StatCard title="Customers" value={stats.customers ?? stats.total_customers ?? 0} icon="♙" tone="blue" />
                <StatCard title="Orders" value={stats.orders ?? stats.total_orders ?? 0} icon="▣" tone="orange" />
                <StatCard title="Sales Income" value={money(sales)} icon="↗" tone="green" />
                <StatCard title="Total Collection" value={money(payments.total_received ?? 0)} icon="▤" tone="purple" />
            </div>

            <div className="branch-stat-grid">
                <StatCard title="Total Income" value={money(financial.total_income)} icon="↓" tone="green" />
                <StatCard title="Purchase" value={money(purchase)} icon="▧" tone="orange" />
                <StatCard title="Other Expense" value={money(expense)} icon="−" tone="red" />
                <StatCard title="Net Profit" value={money(netProfit)} icon="↗" tone="blue" />
            </div>

            <div className="branch-stat-grid branch-balance-grid">
                <StatCard title="Cash in Hand" value={cashBalance == null ? "Not provided by API" : money(cashBalance)} subtitle={cashBalance == null ? "Backend balance fields required" : "Current branch cash balance"} icon="₹" tone="green" />
                <StatCard title="Bank Balance" value={bankBalance == null ? "Not provided by API" : money(bankBalance)} subtitle={bankBalance == null ? "Backend balance fields required" : "Current branch bank balance"} icon="▤" tone="blue" />
                <StatCard title="Pending Orders" value={pendingCount} subtitle={`${money(pendingAmount)} outstanding`} icon="◷" tone="orange" onClick={openPendingOrders} />
                <StatCard title="Outstanding Balance" value={money(payments.outstanding_balance ?? 0)} subtitle="Unpaid customer balances" icon="!" tone="red" onClick={openPendingOrders} />
            </div>

            <Panel title="Order Status" icon="☷">
                <div className="branch-status-grid">{orderStatusLabels.map((label, index) => <button type="button" key={label} className={`branch-status-item status-${label.toLowerCase()}`} onClick={label === "Pending" ? openPendingOrders : undefined}>
                    <span className="branch-status-number">{orderStatusValues[index]}</span><span>{label}</span>
                </button>)}</div>
            </Panel>

            <div className="branch-two-column">
                <Panel title="Payment Modes" icon="▤"><div className="branch-table-wrap"><table><tbody>
                    {paymentLabels.map((label, index) => <tr key={label}><td>{label}</td><td className="number-cell">{money(paymentValues[index])}</td></tr>)}
                </tbody></table></div></Panel>
                <Panel title="Payment Summary" icon="₹"><div className="branch-summary-grid">
                    <div><small>Advance</small><strong>{money(payments.total_advance)}</strong></div>
                    <div><small>Balance Payment</small><strong>{money(payments.total_balance_payment)}</strong></div>
                    <div className="summary-highlight"><small>Total Received</small><strong>{money(payments.total_received)}</strong></div>
                    <div><small>Total Billed</small><strong>{money(payments.total_billed)}</strong></div>
                    <div className="summary-danger"><small>Outstanding</small><strong>{money(payments.outstanding_balance)}</strong></div>
                </div></Panel>
            </div>

            <div className="branch-two-column">
                <Panel title="Financial Overview" icon="↗"><SimpleBars labels={financialLabels} values={financialValues} format={money} /></Panel>
                <Panel title="Financial Distribution" icon="◉"><SimpleBars labels={["Sales", "Purchase", "Other Expense"]} values={[sales, purchase, expense]} format={money} /></Panel>
            </div>
            <div className="branch-two-column">
                <Panel title="Sales & Expenses" icon="▥"><SimpleBars labels={["Sales Income", "Expenses"]} values={[sales, purchase + expense]} format={money} /></Panel>
                <Panel title="Payment Collection" icon="▤"><SimpleBars labels={paymentLabels} values={paymentValues} format={money} /></Panel>
            </div>
            <Panel title="Order Status Overview" icon="▥"><SimpleBars labels={orderStatusLabels} values={orderStatusValues} /></Panel>

            <Panel title="Recent Orders" icon="▣"><div className="branch-table-wrap"><table><thead><tr><th>Bill / Order</th><th>Customer</th><th>Date</th><th>Status</th><th className="number-cell">Amount</th><th className="number-cell">Pending</th></tr></thead><tbody>
                {recentOrders.length ? recentOrders.map((order) => <tr key={order.id}><td className="strong-cell">{order.bill_number ? `#${order.bill_number}` : `#${order.id}`}</td><td>{order.customer || order.customer_name || "—"}</td><td>{dateLabel(order.order_date || order.date)}</td><td><span className={`branch-badge badge-${String(order.status || "pending").toLowerCase()}`}>{order.status || "—"}</span></td><td className="number-cell">{money(order.total_amount ?? order.amount)}</td><td className="number-cell">{money(order.balance_due ?? order.pending_amount ?? 0)}</td></tr>) : <tr><td colSpan="6" className="branch-empty">No recent orders found.</td></tr>}
            </tbody></table></div></Panel>

            <Panel title="Recent Payments" icon="▤"><div className="branch-table-wrap"><table><thead><tr><th>Payment</th><th>Customer</th><th>Date</th><th>Mode</th><th>Type</th><th className="number-cell">Amount</th></tr></thead><tbody>
                {recentPayments.length ? recentPayments.map((payment, index) => <tr key={`${payment.source || "payment"}-${payment.id}-${index}`}><td className="strong-cell">#{payment.id}</td><td>{payment.customer || "—"}</td><td>{dateLabel(payment.payment_date || payment.date)}</td><td>{payment.payment_mode || payment.mode || "—"}</td><td>{payment.payment_type || payment.type || "—"}</td><td className="number-cell positive-money">{money(payment.amount)}</td></tr>) : <tr><td colSpan="6" className="branch-empty">No recent payments found.</td></tr>}
            </tbody></table></div></Panel>
            {loading ? <div className="branch-refresh-note">Refreshing dashboard…</div> : null}
        </main>
    );
}
