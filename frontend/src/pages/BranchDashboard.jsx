import { useEffect, useState } from "react";
import api from "../services/api";
import "./BranchDashboard.css";

function BranchDashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [selectedFilter, setSelectedFilter] = useState("today");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchDashboard();
    }, [selectedFilter]);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                `branch-dashboard/?filter=${selectedFilter}`
            );

            console.log("Branch Dashboard API Response:", response.data);

            if (response.data?.success === false) {
                setError(
                    response.data.message ||
                    "Unable to load dashboard."
                );
                return;
            }

            setDashboard(response.data);
        } catch (err) {
            console.error("Branch Dashboard API Error:", err);

            if (err.response?.status === 401) {
                setError("Authentication failed. Please login again.");
            } else if (err.response?.status === 403) {
                setError(
                    err.response?.data?.message ||
                    "You do not have permission to access this dashboard."
                );
            } else {
                setError(
                    err.response?.data?.message ||
                    err.response?.data?.detail ||
                    "Unable to connect to the server."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const money = (value) => {
        return `₹${Number(value || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    if (loading) {
        return (
            <div className="container-fluid py-4 branch-dashboard">
                <div className="dashboard-loading">
                    <div className="spinner-border" />
                    <p>Loading branch dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-fluid py-4 branch-dashboard">
                <div className="dashboard-error">
                    <i className="bi bi-exclamation-triangle-fill"></i>

                    <h4>Unable to Load Dashboard</h4>

                    <p>{error}</p>

                    <button
                        className="btn btn-primary"
                        onClick={fetchDashboard}
                    >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!dashboard) {
        return null;
    }

    const counts = dashboard.counts || {};
    const financial = dashboard.financial || {};
    const payments = dashboard.payments || {};

    const recentOrders = dashboard.recent_orders || [];
    const recentPayments = dashboard.recent_payments || [];

    return (
        <div className="container-fluid py-4 branch-dashboard">

            {/* HEADER */}
            <div className="dashboard-header mb-4">

                <div>
                    <h2 className="fw-bold mb-1">
                        <i className="bi bi-shop me-2"></i>
                        {dashboard.branch?.name || "Branch Dashboard"}
                    </h2>

                    <p className="text-muted mb-0">
                        Branch Management & Overview
                    </p>
                </div>

                <div className="branch-status-box">
                    <i className="bi bi-circle-fill text-success me-2"></i>
                    Online
                </div>

            </div>

            {/* FILTER */}
            <div className="dashboard-card mb-4">
                <div className="card-body">

                    <div className="filter-header">

                        <div>
                            <h5 className="fw-bold mb-1">
                                <i className="bi bi-calendar3 me-2"></i>
                                Dashboard Period
                            </h5>

                            <small className="text-muted">
                                {dashboard.filter?.from_date}
                                {" "}to{" "}
                                {dashboard.filter?.to_date}
                            </small>
                        </div>

                        <div className="dashboard-filter">

                            {[
                                ["today", "Today"],
                                ["yesterday", "Yesterday"],
                                ["week", "This Week"],
                                ["month", "This Month"],
                            ].map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    className={
                                        selectedFilter === value
                                            ? "filter-btn active"
                                            : "filter-btn"
                                    }
                                    onClick={() =>
                                        setSelectedFilter(value)
                                    }
                                >
                                    {label}
                                </button>
                            ))}

                        </div>

                    </div>

                </div>
            </div>

            {/* BASIC STATISTICS */}
            <div className="row g-4 mb-4">

                <StatCard
                    icon="bi-people-fill"
                    title="Customers"
                    value={counts.customers}
                    className="card-blue"
                />

                <StatCard
                    icon="bi-receipt"
                    title="Orders"
                    value={counts.orders}
                    className="card-green"
                />

                <StatCard
                    icon="bi-hourglass-split"
                    title="Pending"
                    value={counts.pending}
                    className="card-orange"
                />

                <StatCard
                    icon="bi-check-circle-fill"
                    title="Delivered"
                    value={counts.delivered}
                    className="card-purple"
                />

            </div>

            {/* FINANCIAL STATISTICS */}
            <div className="row g-4 mb-4">

                <StatCard
                    icon="bi-cash-stack"
                    title="Total Sales"
                    value={money(financial.total_sales)}
                    className="card-green"
                />

                <StatCard
                    icon="bi-wallet2"
                    title="Total Income"
                    value={money(financial.total_income)}
                    className="card-blue"
                />

                <StatCard
                    icon="bi-cart-dash"
                    title="Purchase"
                    value={money(financial.total_purchase)}
                    className="card-orange"
                />

                <StatCard
                    icon="bi-graph-up-arrow"
                    title="Net Profit"
                    value={money(financial.net_profit)}
                    className="card-purple"
                />

            </div>

            {/* ORDER STATUS + PAYMENT MODES */}
            <div className="row g-4 mb-4">

                {/* ORDER STATUS */}
                <div className="col-12 col-xl-7">

                    <div className="dashboard-card h-100">

                        <div className="card-body">

                            <h5 className="fw-bold mb-4">
                                <i className="bi bi-list-check me-2"></i>
                                Order Status
                            </h5>

                            <div className="row g-3">

                                <StatusBox
                                    title="Pending"
                                    value={counts.pending}
                                    icon="bi-hourglass"
                                />

                                <StatusBox
                                    title="Cutting"
                                    value={counts.cutting}
                                    icon="bi-scissors"
                                />

                                <StatusBox
                                    title="Stitching"
                                    value={counts.stitching}
                                    icon="bi-gear"
                                />

                                <StatusBox
                                    title="Ready"
                                    value={counts.ready}
                                    icon="bi-check2-circle"
                                />

                                <StatusBox
                                    title="Delivery"
                                    value={counts.delivery}
                                    icon="bi-truck"
                                />

                                <StatusBox
                                    title="Delivered"
                                    value={counts.delivered}
                                    icon="bi-bag-check"
                                />

                            </div>

                        </div>

                    </div>

                </div>

                {/* PAYMENT MODES */}
                <div className="col-12 col-xl-5">

                    <div className="dashboard-card h-100">

                        <div className="card-body">

                            <h5 className="fw-bold mb-4">
                                <i className="bi bi-credit-card me-2"></i>
                                Payment Modes
                            </h5>

                            <PaymentRow
                                title="Cash"
                                value={payments.cash}
                                icon="bi-cash"
                            />

                            <PaymentRow
                                title="Bank"
                                value={payments.bank}
                                icon="bi-bank"
                            />

                            <PaymentRow
                                title="Online"
                                value={payments.online}
                                icon="bi-phone"
                            />

                            <PaymentRow
                                title="Cheque"
                                value={payments.cheque}
                                icon="bi-file-earmark-text"
                            />

                            <PaymentRow
                                title="POS"
                                value={payments.pos}
                                icon="bi-credit-card"
                            />

                        </div>

                    </div>

                </div>

            </div>

            {/* PAYMENT SUMMARY */}
            <div className="dashboard-card mb-4">

                <div className="card-body">

                    <h5 className="fw-bold mb-4">
                        <i className="bi bi-bar-chart-fill me-2"></i>
                        Payment Summary
                    </h5>

                    <div className="row g-3">

                        <SummaryBox
                            title="Advance"
                            value={payments.total_advance}
                        />

                        <SummaryBox
                            title="Balance Payment"
                            value={payments.total_balance_payment}
                        />

                        <SummaryBox
                            title="Total Received"
                            value={payments.total_received}
                        />

                        <SummaryBox
                            title="Total Billed"
                            value={payments.total_billed}
                        />

                        <SummaryBox
                            title="Outstanding"
                            value={payments.outstanding_balance}
                            danger
                        />

                    </div>

                </div>

            </div>

            {/* RECENT ORDERS */}
            <div className="dashboard-card mb-4">

                <div className="card-body">

                    <div className="d-flex justify-content-between align-items-center mb-4">

                        <h5 className="fw-bold mb-0">
                            <i className="bi bi-receipt-cutoff me-2"></i>
                            Recent Orders
                        </h5>

                        <span className="badge bg-light text-dark">
                            {recentOrders.length} orders
                        </span>

                    </div>

                    {recentOrders.length === 0 ? (

                        <EmptyState
                            icon="bi-inbox"
                            text="No recent orders found."
                        />

                    ) : (

                        <div className="table-responsive">

                            <table className="table align-middle">

                                <thead>
                                    <tr>
                                        <th>Order</th>
                                        <th>Customer</th>
                                        <th>Status</th>
                                        <th>Amount</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {recentOrders.map((order) => (

                                        <tr key={order.id}>

                                            <td>
                                                <strong>
                                                    #{order.id}
                                                </strong>
                                            </td>

                                            <td>
                                                {order.customer || "-"}
                                            </td>

                                            <td>
                                                <span className="status-badge">
                                                    {order.status || "-"}
                                                </span>
                                            </td>

                                            <td>
                                                {money(order.total_amount)}
                                            </td>

                                            <td>
                                                {order.order_date || "-"}
                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </div>

            {/* RECENT PAYMENTS */}
            <div className="dashboard-card mb-4">

                <div className="card-body">

                    <div className="d-flex justify-content-between align-items-center mb-4">

                        <h5 className="fw-bold mb-0">
                            <i className="bi bi-currency-rupee me-2"></i>
                            Recent Payments
                        </h5>

                        <span className="badge bg-light text-dark">
                            {recentPayments.length} payments
                        </span>

                    </div>

                    {recentPayments.length === 0 ? (

                        <EmptyState
                            icon="bi-cash"
                            text="No recent payments found."
                        />

                    ) : (

                        <div className="table-responsive">

                            <table className="table align-middle">

                                <thead>
                                    <tr>
                                        <th>Customer</th>
                                        <th>Amount</th>
                                        <th>Type</th>
                                        <th>Mode</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {recentPayments.map((payment) => (

                                        <tr key={payment.id}>

                                            <td>
                                                {payment.customer || "-"}
                                            </td>

                                            <td className="fw-semibold">
                                                {money(payment.amount)}
                                            </td>

                                            <td>
                                                {payment.payment_type || "-"}
                                            </td>

                                            <td>
                                                <span className="status-badge">
                                                    {payment.payment_mode || "-"}
                                                </span>
                                            </td>

                                            <td>
                                                {payment.payment_date || "-"}
                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </div>

        </div>
    );
}


/* =========================
   STAT CARD
========================= */

function StatCard({
    icon,
    title,
    value,
    className = "",
}) {
    return (
        <div className="col-12 col-sm-6 col-xl-3">

            <div className={`dashboard-stat-card ${className}`}>

                <div className="stat-icon">
                    <i className={`bi ${icon}`}></i>
                </div>

                <div>
                    <p className="stat-title mb-1">
                        {title}
                    </p>

                    <h3 className="stat-value mb-0">
                        {value ?? 0}
                    </h3>
                </div>

            </div>

        </div>
    );
}


/* =========================
   STATUS BOX
========================= */

function StatusBox({
    title,
    value,
    icon,
}) {
    return (
        <div className="col-6 col-md-4">

            <div className="branch-status-box text-center">

                <i className={`bi ${icon} status-icon`}></i>

                <h4 className="fw-bold mb-1">
                    {value ?? 0}
                </h4>

                <small className="text-muted">
                    {title}
                </small>

            </div>

        </div>
    );
}


/* =========================
   PAYMENT ROW
========================= */

function PaymentRow({
    title,
    value,
    icon,
}) {
    return (
        <div className="payment-row">

            <div className="d-flex align-items-center gap-3">

                <div className="payment-icon">
                    <i className={`bi ${icon}`}></i>
                </div>

                <span className="fw-semibold">
                    {title}
                </span>

            </div>

            <strong>
                ₹{Number(value || 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}
            </strong>

        </div>
    );
}


/* =========================
   SUMMARY BOX
========================= */

function SummaryBox({
    title,
    value,
    danger = false,
}) {
    return (
        <div className="col-12 col-sm-6 col-lg">

            <div
                className={
                    danger
                        ? "summary-box danger"
                        : "summary-box"
                }
            >

                <small>
                    {title}
                </small>

                <h5 className="fw-bold mb-0">
                    ₹{Number(value || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}
                </h5>

            </div>

        </div>
    );
}


/* =========================
   EMPTY STATE
========================= */

function EmptyState({
    icon,
    text,
}) {
    return (
        <div className="empty-state">

            <i className={`bi ${icon}`}></i>

            <p>
                {text}
            </p>

        </div>
    );
}


export default BranchDashboard;