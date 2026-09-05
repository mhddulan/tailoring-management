import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./BranchPerformance.css";

function BranchPerformance() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [filter, setFilter] = useState("today");

    // Temporary data.
    // API connection will be added later.
    const branch = {
        id,
        name: "a1",
        address: "Branch Address",
        phone: "0000000000",
    };

    const stats = {
        customers: 0,
        orders: 0,
        salesIncome: 0,
        netProfit: 0,
        totalIncome: 0,
        purchase: 0,
        expense: 0,
        advance: 0,
        balance: 0,
        received: 0,
        billed: 0,
        outstanding: 0,
    };

    const orderStatus = {
        pending: 0,
        delivered: 0,
        cutting: 0,
        stitching: 0,
        ready: 0,
        delivery: 0,
    };

    const paymentModes = {
        cash: 0,
        bank: 0,
        online: 0,
        cheque: 0,
        pos: 0,
    };

    return (
        <div className="branch-performance-page">

            {/* HEADER */}
            <div className="performance-header">

                <div>
                    <div className="performance-title">

                        <div className="performance-icon">
                            <i className="bi bi-building-fill"></i>
                        </div>

                        <div>
                            <h2>{branch.name}</h2>

                            <p>
                                Branch Performance
                                {branch.address &&
                                    ` • ${branch.address}`}
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


            {/* DATE FILTERS */}
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
                            onClick={() => setFilter(value)}
                        >
                            {label}
                        </button>
                    ))}

                    <div className="custom-date">
                        <input
                            type="date"
                            className="date-input"
                        />

                        <span>to</span>

                        <input
                            type="date"
                            className="date-input"
                        />

                        <button className="apply-btn">
                            Apply
                        </button>
                    </div>

                </div>

            </div>


            {/* KPI CARDS */}
            <div className="performance-grid">

                <div className="performance-card blue">
                    <div className="card-icon">
                        <i className="bi bi-people-fill"></i>
                    </div>

                    <div>
                        <span>Customers</span>
                        <strong>{stats.customers}</strong>
                    </div>
                </div>


                <div className="performance-card purple">
                    <div className="card-icon">
                        <i className="bi bi-receipt-cutoff"></i>
                    </div>

                    <div>
                        <span>Orders</span>
                        <strong>{stats.orders}</strong>
                    </div>
                </div>


                <div className="performance-card green">
                    <div className="card-icon">
                        <i className="bi bi-cash-stack"></i>
                    </div>

                    <div>
                        <span>Sales Income</span>
                        <strong>
                            ₹{stats.salesIncome.toLocaleString()}
                        </strong>
                    </div>
                </div>


                <div className="performance-card orange">
                    <div className="card-icon">
                        <i className="bi bi-graph-up-arrow"></i>
                    </div>

                    <div>
                        <span>Net Profit</span>
                        <strong>
                            ₹{stats.netProfit.toLocaleString()}
                        </strong>
                    </div>
                </div>

            </div>


            {/* FINANCIAL + COLLECTION */}
            <div className="summary-grid">

                <div className="summary-card">

                    <div className="summary-header">
                        <h5>
                            <i className="bi bi-wallet2"></i>
                            Financial Summary
                        </h5>
                    </div>

                    <div className="summary-items">

                        <div>
                            <span>Total Income</span>
                            <strong>
                                ₹{stats.totalIncome.toLocaleString()}
                            </strong>
                        </div>

                        <div>
                            <span>Purchase</span>
                            <strong>
                                ₹{stats.purchase.toLocaleString()}
                            </strong>
                        </div>

                        <div>
                            <span>Other Expense</span>
                            <strong>
                                ₹{stats.expense.toLocaleString()}
                            </strong>
                        </div>

                        <div className="profit-item">
                            <span>Net Profit</span>
                            <strong>
                                ₹{stats.netProfit.toLocaleString()}
                            </strong>
                        </div>

                    </div>

                </div>


                <div className="summary-card">

                    <div className="summary-header">
                        <h5>
                            <i className="bi bi-credit-card-fill"></i>
                            Collection Summary
                        </h5>
                    </div>

                    <div className="summary-items">

                        <div>
                            <span>Advance</span>
                            <strong>
                                ₹{stats.advance.toLocaleString()}
                            </strong>
                        </div>

                        <div>
                            <span>Balance</span>
                            <strong>
                                ₹{stats.balance.toLocaleString()}
                            </strong>
                        </div>

                        <div>
                            <span>Total Received</span>
                            <strong>
                                ₹{stats.received.toLocaleString()}
                            </strong>
                        </div>

                        <div>
                            <span>Outstanding</span>
                            <strong>
                                ₹{stats.outstanding.toLocaleString()}
                            </strong>
                        </div>

                    </div>

                </div>

            </div>


            {/* PAYMENT + ORDER STATUS */}
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
                        ].map(([label, key, icon]) => (
                            <div
                                className="payment-row"
                                key={key}
                            >
                                <div>
                                    <i className={`bi ${icon}`}></i>
                                    <span>{label}</span>
                                </div>

                                <strong>
                                    ₹{paymentModes[key].toLocaleString()}
                                </strong>
                            </div>
                        ))}

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
                            <span>Pending</span>
                            <strong>{orderStatus.pending}</strong>
                        </div>

                        <div className="status-box cutting">
                            <span>Cutting</span>
                            <strong>{orderStatus.cutting}</strong>
                        </div>

                        <div className="status-box stitching">
                            <span>Stitching</span>
                            <strong>{orderStatus.stitching}</strong>
                        </div>

                        <div className="status-box ready">
                            <span>Ready</span>
                            <strong>{orderStatus.ready}</strong>
                        </div>

                        <div className="status-box delivery">
                            <span>Delivery</span>
                            <strong>{orderStatus.delivery}</strong>
                        </div>

                        <div className="status-box delivered">
                            <span>Delivered</span>
                            <strong>{orderStatus.delivered}</strong>
                        </div>

                    </div>

                </div>

            </div>


            {/* CHARTS */}
            <div className="charts-grid">

                <div className="chart-card">
                    <div className="chart-header">
                        <h5>
                            <i className="bi bi-bar-chart-fill"></i>
                            Financial Overview
                        </h5>
                    </div>

                    <div className="chart-placeholder">
                        <i className="bi bi-bar-chart"></i>
                        <span>Financial chart</span>
                    </div>
                </div>


                <div className="chart-card">
                    <div className="chart-header">
                        <h5>
                            <i className="bi bi-pie-chart-fill"></i>
                            Payment Distribution
                        </h5>
                    </div>

                    <div className="chart-placeholder">
                        <i className="bi bi-pie-chart"></i>
                        <span>Payment distribution</span>
                    </div>
                </div>

            </div>


            {/* EMPLOYEE PRODUCTION */}
            <div className="content-card">

                <div className="content-card-header">
                    <h5>
                        <i className="bi bi-person-workspace"></i>
                        Employee Production
                    </h5>
                </div>

                <div className="empty-production">
                    <i className="bi bi-person-workspace"></i>
                    <p>No production data available.</p>
                </div>

                <div className="total-pieces">
                    Total Pieces:
                    <strong>0</strong>
                </div>

            </div>


            {/* EMPLOYEE PERFORMANCE */}
            <div className="chart-card full-chart">

                <div className="chart-header">
                    <h5>
                        <i className="bi bi-people-fill"></i>
                        Employee Performance
                    </h5>
                </div>

                <div className="chart-placeholder large">
                    <i className="bi bi-bar-chart-line"></i>
                    <span>Employee performance</span>
                </div>

            </div>


            {/* SALES TREND */}
            <div className="chart-card full-chart">

                <div className="chart-header">
                    <h5>
                        <i className="bi bi-graph-up"></i>
                        Sales Trend
                    </h5>
                </div>

                <div className="chart-placeholder large">
                    <i className="bi bi-graph-up"></i>
                    <span>Sales trend</span>
                </div>

            </div>


            {/* RECENT ORDERS */}
            <div className="content-card">

                <div className="content-card-header">
                    <h5>
                        <i className="bi bi-receipt"></i>
                        Recent Orders
                    </h5>
                </div>

                <div className="empty-production">
                    <i className="bi bi-receipt"></i>
                    <p>No recent orders.</p>
                </div>

            </div>


            {/* RECENT PAYMENTS */}
            <div className="content-card">

                <div className="content-card-header">
                    <h5>
                        <i className="bi bi-cash-coin"></i>
                        Recent Payments
                    </h5>
                </div>

                <div className="empty-production">
                    <i className="bi bi-cash-coin"></i>
                    <p>No recent payments.</p>
                </div>

            </div>

        </div>
    );
}

export default BranchPerformance;