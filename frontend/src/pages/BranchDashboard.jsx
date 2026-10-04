import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import "./BranchPerformance.css";

function BranchPerformance() {

    const navigate = useNavigate();
    const { id } = useParams();

    const [filter, setFilter] = useState("today");

    const [branch, setBranch] = useState(null);

    const [stats, setStats] = useState({
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
    });

    const [orderStatus, setOrderStatus] = useState({
        pending: 0,
        delivered: 0,
        cutting: 0,
        stitching: 0,
        ready: 0,
        delivery: 0,
    });

    const [paymentModes, setPaymentModes] = useState({
        cash: 0,
        bank: 0,
        online: 0,
        cheque: 0,
        pos: 0,
    });

    const [employeeProduction, setEmployeeProduction] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ========================================================
    // LOAD API
    // ========================================================

    useEffect(() => {

        const loadPerformance = async () => {

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

                const data = response.data;

                setBranch(data.branch);

                setStats({
                    customers:
                        data.stats?.customers ?? 0,

                    orders:
                        data.stats?.orders ?? 0,

                    salesIncome:
                        data.stats?.sales_income ?? 0,

                    netProfit:
                        data.stats?.net_profit ?? 0,

                    totalIncome:
                        data.stats?.total_income ?? 0,

                    purchase:
                        data.stats?.purchase ?? 0,

                    expense:
                        data.stats?.expense ?? 0,

                    advance:
                        data.stats?.advance ?? 0,

                    balance:
                        data.stats?.balance ?? 0,

                    received:
                        data.stats?.received ?? 0,

                    billed:
                        data.stats?.billed ?? 0,

                    outstanding:
                        data.stats?.outstanding ?? 0,
                });

                setOrderStatus(
                    data.order_status ?? {}
                );

                setPaymentModes(
                    data.payment_modes ?? {}
                );

                setEmployeeProduction(
                    data.employee_production ?? []
                );

            } catch (err) {

                console.error(
                    "Branch performance API error:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    "Failed to load branch performance."
                );

            } finally {

                setLoading(false);
            }
        };

        if (id) {
            loadPerformance();
        }

    }, [id, filter]);

    // ========================================================
    // LOADING
    // ========================================================

    if (loading) {

        return (
            <div className="branch-performance-page">
                <div className="content-card">
                    Loading branch performance...
                </div>
            </div>
        );
    }

    // ========================================================
    // ERROR
    // ========================================================

    if (error) {

        return (
            <div className="branch-performance-page">

                <div className="content-card">

                    <h3>
                        Unable to load performance
                    </h3>

                    <p>
                        {error}
                    </p>

                    <button
                        className="back-btn"
                        onClick={() => navigate("/branches")}
                    >
                        Back to Branches
                    </button>

                </div>

            </div>
        );
    }

    // ========================================================
    // PAGE
    // ========================================================

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

                            <h2>
                                {branch?.name || "Branch"}
                            </h2>

                            <p>
                                Branch Performance
                                {branch?.address &&
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
                            onClick={() =>
                                setFilter(value)
                            }
                        >
                            {label}
                        </button>

                    ))}

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
                        <strong>
                            {stats.customers}
                        </strong>
                    </div>
                </div>

                <div className="performance-card purple">
                    <div className="card-icon">
                        <i className="bi bi-receipt-cutoff"></i>
                    </div>

                    <div>
                        <span>Orders</span>
                        <strong>
                            {stats.orders}
                        </strong>
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
                                    <i
                                        className={`bi ${icon}`}
                                    ></i>

                                    <span>
                                        {label}
                                    </span>
                                </div>

                                <strong>
                                    ₹{(
                                        paymentModes[key] || 0
                                    ).toLocaleString()}
                                </strong>

                            </div>

                        ))}

                    </div>

                </div>

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
                            <strong>
                                {orderStatus.pending || 0}
                            </strong>
                        </div>

                        <div className="status-box cutting">
                            <span>Cutting</span>
                            <strong>
                                {orderStatus.cutting || 0}
                            </strong>
                        </div>

                        <div className="status-box stitching">
                            <span>Stitching</span>
                            <strong>
                                {orderStatus.stitching || 0}
                            </strong>
                        </div>

                        <div className="status-box ready">
                            <span>Ready</span>
                            <strong>
                                {orderStatus.ready || 0}
                            </strong>
                        </div>

                        <div className="status-box delivery">
                            <span>Delivery</span>
                            <strong>
                                {orderStatus.delivery || 0}
                            </strong>
                        </div>

                        <div className="status-box delivered">
                            <span>Delivered</span>
                            <strong>
                                {orderStatus.delivered || 0}
                            </strong>
                        </div>

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

                {employeeProduction.length === 0 ? (

                    <div className="empty-production">
                        <i className="bi bi-person-workspace"></i>
                        <p>
                            No production data available.
                        </p>
                    </div>

                ) : (

                    <>

                        {employeeProduction.map(
                            (employee) => (

                                <div
                                    className="payment-row"
                                    key={employee.id}
                                >

                                    <div>
                                        <i className="bi bi-person"></i>

                                        <span>
                                            {employee.name}
                                        </span>
                                    </div>

                                    <strong>
                                        {employee.pieces} pieces
                                    </strong>

                                </div>

                            )
                        )}

                    </>
                )}

            </div>

        </div>
    );
}

export default BranchPerformance;