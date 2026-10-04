import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import "./BranchPerformance.css";

function BranchPerformance() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [filter, setFilter] = useState("today");

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ============================================================
    // LOAD BRANCH PERFORMANCE
    // ============================================================

    useEffect(() => {
        const loadBranchPerformance = async () => {
            if (!id) {
                setError("Branch ID is missing.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");

                const response = await api.get(
                    `/branch-performance/${id}/`,
                    {
                        params: {
                            filter: filter,
                        },
                    }
                );

                console.log(
                    "Branch Performance API:",
                    response.data
                );

                setData(response.data);

            } catch (err) {
                console.error(
                    "Branch Performance API Error:",
                    err
                );

                setError(
                    err.response?.data?.detail ||
                    err.response?.data?.message ||
                    "Failed to load branch performance."
                );

            } finally {
                setLoading(false);
            }
        };

        loadBranchPerformance();

    }, [id, filter]);


    // ============================================================
    // HELPERS
    // ============================================================

    const number = (value) => {
        return Number(value || 0);
    };

    const money = (value) => {
        return number(value).toLocaleString("en-IN", {
            maximumFractionDigits: 2,
        });
    };


    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {
        return (
            <div className="branch-performance-page">

                <div className="performance-header">

                    <div className="performance-title">

                        <div className="performance-icon">
                            <i className="bi bi-building-fill"></i>
                        </div>

                        <div>
                            <h2>Branch Performance</h2>
                            <p>Loading branch data...</p>
                        </div>

                    </div>

                </div>

                <div className="content-card">
                    <div className="empty-production">
                        <i className="bi bi-hourglass-split"></i>
                        <p>Loading performance data...</p>
                    </div>
                </div>

            </div>
        );
    }


    // ============================================================
    // ERROR
    // ============================================================

    if (error) {
        return (
            <div className="branch-performance-page">

                <div className="performance-header">

                    <div className="performance-title">

                        <div className="performance-icon">
                            <i className="bi bi-building-fill"></i>
                        </div>

                        <div>
                            <h2>Branch Performance</h2>
                            <p>Unable to load branch data</p>
                        </div>

                    </div>

                    <button
                        className="back-btn"
                        onClick={() => navigate("/branches")}
                    >
                        <i className="bi bi-arrow-left"></i>
                        Back to Branches
                    </button>

                </div>

                <div className="content-card">

                    <div className="empty-production">

                        <i className="bi bi-exclamation-triangle"></i>

                        <p>{error}</p>

                        <button
                            className="apply-btn"
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </button>

                    </div>

                </div>

            </div>
        );
    }


    // ============================================================
    // API DATA
    // ============================================================

    const branch = data?.branch || {};

    const stats = data?.stats || {};

    const payments = data?.payments || {};

    const orderStatus = data?.order_status || {};

    const production = data?.production || {};

    const employees = data?.employees || [];

    const chart = data?.chart || {};

    const recentOrders = data?.recent_orders || [];

    const recentPayments = data?.recent_payments || [];


    // ============================================================
    // HEADER / FALLBACK VALUES
    // ============================================================

    const branchName =
        branch.name ||
        data?.branch_name ||
        `Branch ${id}`;

    const branchAddress =
        branch.address ||
        "";

    const branchPhone =
        branch.phone ||
        "";


    // ============================================================
    // STATS
    // ============================================================

    const customers =
        stats.customers ??
        stats.total_customers ??
        0;

    const orders =
        stats.orders ??
        stats.total_orders ??
        0;

    const salesIncome =
        stats.salesIncome ??
        stats.sales_income ??
        stats.total_sales ??
        0;

    const netProfit =
        stats.netProfit ??
        stats.net_profit ??
        0;

    const totalIncome =
        stats.totalIncome ??
        stats.total_income ??
        0;

    const purchase =
        stats.purchase ??
        stats.total_purchase ??
        0;

    const expense =
        stats.expense ??
        stats.total_expense ??
        0;

    const advance =
        stats.advance ??
        stats.total_advance ??
        payments.total_advance ??
        0;

    const balance =
        stats.balance ??
        stats.total_balance_payment ??
        payments.total_balance_payment ??
        0;

    const received =
        stats.received ??
        stats.total_received ??
        payments.total_received ??
        0;

    const billed =
        stats.billed ??
        stats.total_billed ??
        payments.total_billed ??
        0;

    const outstanding =
        stats.outstanding ??
        stats.outstanding_balance ??
        payments.outstanding_balance ??
        0;


    // ============================================================
    // PAYMENT MODES
    // ============================================================

    const paymentModes = {

        cash:
            payments.cash ??
            0,

        bank:
            payments.bank ??
            0,

        online:
            payments.online ??
            0,

        cheque:
            payments.cheque ??
            0,

        pos:
            payments.pos ??
            0,

    };


    // ============================================================
    // ORDER STATUS
    // ============================================================

    const statuses = {

        pending:
            orderStatus.pending ??
            0,

        cutting:
            orderStatus.cutting ??
            0,

        stitching:
            orderStatus.stitching ??
            0,

        ready:
            orderStatus.ready ??
            0,

        delivery:
            orderStatus.delivery ??
            0,

        delivered:
            orderStatus.delivered ??
            0,

    };


    // ============================================================
    // PRODUCTION
    // ============================================================

    const totalPieces =
        production.total_pieces ??
        production.totalPieces ??
        data?.total_pieces ??
        0;


    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div className="branch-performance-page">

            {/* ====================================================
                HEADER
            ==================================================== */}

            <div className="performance-header">

                <div>

                    <div className="performance-title">

                        <div className="performance-icon">
                            <i className="bi bi-building-fill"></i>
                        </div>

                        <div>

                            <h2>
                                {branchName}
                            </h2>

                            <p>

                                Branch Performance

                                {branchAddress &&
                                    ` • ${branchAddress}`}

                                {branchPhone &&
                                    ` • ${branchPhone}`}

                            </p>

                        </div>

                    </div>

                </div>


                <button
                    className="back-btn"
                    onClick={() => navigate("/branches")}
                >

                    <i className="bi bi-arrow-left"></i>

                    Back to Branches

                </button>

            </div>


            {/* ====================================================
                DATE FILTERS
            ==================================================== */}

            <div className="performance-filter-card">

                <div className="filter-title">

                    <i className="bi bi-calendar3"></i>

                    Performance Period

                </div>


                <div className="filter-buttons">

                    {[
                        ["today", "Today"],
                        ["yesterday", "Yesterday"],
                        ["week", "This Week"],
                        ["month", "This Month"],
                    ].map(([value, label]) => (

                        <button
                            key={value}
                            className={
                                filter === value
                                    ? "filter-btn active"
                                    : "filter-btn"
                            }
                            onClick={() =>
                                setFilter(value)
                            }
                        >

                            {label}

                        </button>

                    ))}


                    <div className="custom-date">

                        <input
                            type="date"
                            className="date-input"
                        />

                        <span>
                            to
                        </span>

                        <input
                            type="date"
                            className="date-input"
                        />

                        <button
                            className="apply-btn"
                            type="button"
                        >
                            Apply
                        </button>

                    </div>

                </div>

            </div>


            {/* ====================================================
                KPI CARDS
            ==================================================== */}

            <div className="performance-grid">


                {/* CUSTOMERS */}

                <div className="performance-card blue">

                    <div className="card-icon">
                        <i className="bi bi-people-fill"></i>
                    </div>

                    <div>

                        <span>
                            Customers
                        </span>

                        <strong>
                            {customers}
                        </strong>

                    </div>

                </div>


                {/* ORDERS */}

                <div className="performance-card purple">

                    <div className="card-icon">
                        <i className="bi bi-receipt-cutoff"></i>
                    </div>

                    <div>

                        <span>
                            Orders
                        </span>

                        <strong>
                            {orders}
                        </strong>

                    </div>

                </div>


                {/* SALES */}

                <div className="performance-card green">

                    <div className="card-icon">
                        <i className="bi bi-cash-stack"></i>
                    </div>

                    <div>

                        <span>
                            Sales Income
                        </span>

                        <strong>
                            ₹{money(salesIncome)}
                        </strong>

                    </div>

                </div>


                {/* PROFIT */}

                <div className="performance-card orange">

                    <div className="card-icon">
                        <i className="bi bi-graph-up-arrow"></i>
                    </div>

                    <div>

                        <span>
                            Net Profit
                        </span>

                        <strong>
                            ₹{money(netProfit)}
                        </strong>

                    </div>

                </div>

            </div>


            {/* ====================================================
                FINANCIAL + COLLECTION
            ==================================================== */}

            <div className="summary-grid">


                {/* FINANCIAL */}

                <div className="summary-card">

                    <div className="summary-header">

                        <h5>

                            <i className="bi bi-wallet2"></i>

                            Financial Summary

                        </h5>

                    </div>


                    <div className="summary-items">


                        <div>

                            <span>
                                Total Income
                            </span>

                            <strong>
                                ₹{money(totalIncome)}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Purchase
                            </span>

                            <strong>
                                ₹{money(purchase)}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Other Expense
                            </span>

                            <strong>
                                ₹{money(expense)}
                            </strong>

                        </div>


                        <div className="profit-item">

                            <span>
                                Net Profit
                            </span>

                            <strong>
                                ₹{money(netProfit)}
                            </strong>

                        </div>

                    </div>

                </div>


                {/* COLLECTION */}

                <div className="summary-card">

                    <div className="summary-header">

                        <h5>

                            <i className="bi bi-credit-card-fill"></i>

                            Collection Summary

                        </h5>

                    </div>


                    <div className="summary-items">


                        <div>

                            <span>
                                Advance
                            </span>

                            <strong>
                                ₹{money(advance)}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Balance
                            </span>

                            <strong>
                                ₹{money(balance)}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Total Received
                            </span>

                            <strong>
                                ₹{money(received)}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Outstanding
                            </span>

                            <strong>
                                ₹{money(outstanding)}
                            </strong>

                        </div>

                    </div>

                </div>

            </div>


            {/* ====================================================
                PAYMENT + ORDER STATUS
            ==================================================== */}

            <div className="two-column-grid">


                {/* PAYMENT MODES */}

                <div className="content-card">

                    <div className="content-card-header">

                        <h5>

                            <i className="bi bi-credit-card"></i>

                            Payment Modes

                        </h5>

                    </div>


                    <div className="payment-list">

                        {[
                            ["Cash", "cash", "bi-cash"],
                            ["Bank", "bank", "bi-bank"],
                            ["Online", "online", "bi-globe"],
                            ["Cheque", "cheque", "bi-receipt"],
                            ["POS", "pos", "bi-credit-card"],
                        ].map(
                            ([label, key, icon]) => (

                                <div
                                    className="payment-row"
                                    key={key}
                                >

                                    <div>

                                        <i
                                            className={`bi ${icon}`}
                                        ></i>

                                        <span>
                                            {label}
                                        </span>

                                    </div>


                                    <strong>
                                        ₹{money(
                                            paymentModes[key]
                                        )}
                                    </strong>

                                </div>

                            )
                        )}

                    </div>

                </div>


                {/* ORDER STATUS */}

                <div className="content-card">

                    <div className="content-card-header">

                        <h5>

                            <i className="bi bi-list-check"></i>

                            Order Status

                        </h5>

                    </div>


                    <div className="status-grid">


                        <div className="status-box pending">

                            <span>
                                Pending
                            </span>

                            <strong>
                                {statuses.pending}
                            </strong>

                        </div>


                        <div className="status-box cutting">

                            <span>
                                Cutting
                            </span>

                            <strong>
                                {statuses.cutting}
                            </strong>

                        </div>


                        <div className="status-box stitching">

                            <span>
                                Stitching
                            </span>

                            <strong>
                                {statuses.stitching}
                            </strong>

                        </div>


                        <div className="status-box ready">

                            <span>
                                Ready
                            </span>

                            <strong>
                                {statuses.ready}
                            </strong>

                        </div>


                        <div className="status-box delivery">

                            <span>
                                Delivery
                            </span>

                            <strong>
                                {statuses.delivery}
                            </strong>

                        </div>


                        <div className="status-box delivered">

                            <span>
                                Delivered
                            </span>

                            <strong>
                                {statuses.delivered}
                            </strong>

                        </div>

                    </div>

                </div>

            </div>


            {/* ====================================================
                CHARTS
            ==================================================== */}

            <div className="charts-grid">


                {/* FINANCIAL CHART */}

                <div className="chart-card">

                    <div className="chart-header">

                        <h5>

                            <i className="bi bi-bar-chart-fill"></i>

                            Financial Overview

                        </h5>

                    </div>


                    <div className="chart-placeholder">

                        <i className="bi bi-bar-chart"></i>

                        <span>
                            Financial chart
                        </span>

                    </div>

                </div>


                {/* PAYMENT CHART */}

                <div className="chart-card">

                    <div className="chart-header">

                        <h5>

                            <i className="bi bi-pie-chart-fill"></i>

                            Payment Distribution

                        </h5>

                    </div>


                    <div className="chart-placeholder">

                        <i className="bi bi-pie-chart"></i>

                        <span>
                            Payment distribution
                        </span>

                    </div>

                </div>

            </div>


            {/* ====================================================
                EMPLOYEE PRODUCTION
            ==================================================== */}

            <div className="content-card">

                <div className="content-card-header">

                    <h5>

                        <i className="bi bi-person-workspace"></i>

                        Employee Production

                    </h5>

                </div>


                {employees.length === 0 ? (

                    <div className="empty-production">

                        <i className="bi bi-person-workspace"></i>

                        <p>
                            No production data available.
                        </p>

                    </div>

                ) : (

                    <div className="payment-list">

                        {employees.map(
                            (employee, index) => (

                                <div
                                    className="payment-row"
                                    key={
                                        employee.id ||
                                        index
                                    }
                                >

                                    <div>

                                        <i className="bi bi-person"></i>

                                        <span>
                                            {
                                                employee.name ||
                                                employee.employee_name ||
                                                "Employee"
                                            }
                                        </span>

                                    </div>

                                    <strong>
                                        {
                                            employee.total_pieces ||
                                            employee.pieces ||
                                            employee.quantity ||
                                            0
                                        } pieces
                                    </strong>

                                </div>

                            )
                        )}

                    </div>

                )}


                <div className="total-pieces">

                    Total Pieces:

                    <strong>
                        {totalPieces}
                    </strong>

                </div>

            </div>


            {/* ====================================================
                EMPLOYEE PERFORMANCE
            ==================================================== */}

            <div className="chart-card full-chart">

                <div className="chart-header">

                    <h5>

                        <i className="bi bi-people-fill"></i>

                        Employee Performance

                    </h5>

                </div>


                {employees.length === 0 ? (

                    <div className="chart-placeholder large">

                        <i className="bi bi-bar-chart-line"></i>

                        <span>
                            Employee performance
                        </span>

                    </div>

                ) : (

                    <div className="payment-list">

                        {employees.map(
                            (employee, index) => (

                                <div
                                    className="payment-row"
                                    key={
                                        employee.id ||
                                        index
                                    }
                                >

                                    <div>

                                        <i className="bi bi-person-workspace"></i>

                                        <span>
                                            {
                                                employee.name ||
                                                employee.employee_name ||
                                                "Employee"
                                            }
                                        </span>

                                    </div>

                                    <strong>
                                        {
                                            employee.total_pieces ||
                                            employee.pieces ||
                                            employee.quantity ||
                                            0
                                        }
                                    </strong>

                                </div>

                            )
                        )}

                    </div>

                )}

            </div>


            {/* ====================================================
                SALES TREND
            ==================================================== */}

            <div className="chart-card full-chart">

                <div className="chart-header">

                    <h5>

                        <i className="bi bi-graph-up"></i>

                        Sales Trend

                    </h5>

                </div>


                {chart?.months?.length > 0 ? (

                    <div className="payment-list">

                        {chart.months.map(
                            (month, index) => (

                                <div
                                    className="payment-row"
                                    key={month}
                                >

                                    <div>

                                        <i className="bi bi-calendar3"></i>

                                        <span>
                                            {month}
                                        </span>

                                    </div>

                                    <strong>
                                        ₹{money(
                                            chart.sales?.[index] ||
                                            0
                                        )}
                                    </strong>

                                </div>

                            )
                        )}

                    </div>

                ) : (

                    <div className="chart-placeholder large">

                        <i className="bi bi-graph-up"></i>

                        <span>
                            Sales trend
                        </span>

                    </div>

                )}

            </div>


            {/* ====================================================
                RECENT ORDERS
            ==================================================== */}

            <div className="content-card">

                <div className="content-card-header">

                    <h5>

                        <i className="bi bi-receipt"></i>

                        Recent Orders

                    </h5>

                </div>


                {recentOrders.length === 0 ? (

                    <div className="empty-production">

                        <i className="bi bi-receipt"></i>

                        <p>
                            No recent orders.
                        </p>

                    </div>

                ) : (

                    <div className="payment-list">

                        {recentOrders.map(
                            (order, index) => (

                                <div
                                    className="payment-row"
                                    key={
                                        order.id ||
                                        index
                                    }
                                >

                                    <div>

                                        <i className="bi bi-receipt"></i>

                                        <span>

                                            {order.customer ||
                                                order.customer_name ||
                                                `Order #${order.id}`}

                                        </span>

                                    </div>

                                    <strong>

                                        ₹{money(
                                            order.amount ||
                                            order.total_amount ||
                                            0
                                        )}

                                    </strong>

                                </div>

                            )
                        )}

                    </div>

                )}

            </div>


            {/* ====================================================
                RECENT PAYMENTS
            ==================================================== */}

            <div className="content-card">

                <div className="content-card-header">

                    <h5>

                        <i className="bi bi-cash-coin"></i>

                        Recent Payments

                    </h5>

                </div>


                {recentPayments.length === 0 ? (

                    <div className="empty-production">

                        <i className="bi bi-cash-coin"></i>

                        <p>
                            No recent payments.
                        </p>

                    </div>

                ) : (

                    <div className="payment-list">

                        {recentPayments.map(
                            (payment, index) => (

                                <div
                                    className="payment-row"
                                    key={
                                        payment.id ||
                                        index
                                    }
                                >

                                    <div>

                                        <i className="bi bi-cash-coin"></i>

                                        <span>

                                            {payment.customer ||
                                                payment.customer_name ||
                                                `Payment #${payment.id}`}

                                        </span>

                                    </div>

                                    <strong>

                                        ₹{money(
                                            payment.amount ||
                                            0
                                        )}

                                    </strong>

                                </div>

                            )
                        )}

                    </div>

                )}

            </div>

        </div>
    );
}

export default BranchPerformance;