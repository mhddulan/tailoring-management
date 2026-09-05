import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Filler,
    Tooltip,
    Legend,
} from "chart.js";

import api from "../services/api";
import "./Dashboard.css";


/* =========================================================
   CHART.JS
========================================================= */

Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Filler,
    Tooltip,
    Legend
);


/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard() {

    const navigate = useNavigate();

    const chartRef = useRef(null);
    const chartInstance = useRef(null);


    /* =====================================================
       STATE
    ===================================================== */

    const [data, setData] = useState(null);

    const [filter, setFilter] = useState("today");

    const [fromDate, setFromDate] = useState("");

    const [toDate, setToDate] = useState("");

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    /* =====================================================
       MONEY FORMAT
    ===================================================== */

    const money = (value) => {

        return `SAR ${Number(value || 0).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        )}`;

    };


    /* =====================================================
       LOAD DASHBOARD
    ===================================================== */

    const loadDashboard = async (
        selectedFilter = filter,
        customFrom = "",
        customTo = ""
    ) => {

        try {

            setLoading(true);

            setError("");


            let url =
                `dashboard/?filter=${selectedFilter}`;


            if (
                selectedFilter === "custom" &&
                customFrom &&
                customTo
            ) {

                url +=
                    `&from_date=${customFrom}` +
                    `&to_date=${customTo}`;

            }


            const response =
                await api.get(url);


            console.log(
                "DASHBOARD RESPONSE:",
                response.data
            );


            setData(response.data);

        } catch (err) {

            console.error(
                "DASHBOARD ERROR:",
                err
            );


            if (
                err.response?.status === 401
            ) {

                localStorage.removeItem(
                    "token"
                );

                localStorage.removeItem(
                    "user"
                );

                navigate("/login");

                return;
            }


            if (
                err.response?.status === 403
            ) {

                setError(
                    "You are not authorized to view this dashboard."
                );

                return;
            }


            setError(
                err.response?.data?.message ||
                "Unable to load dashboard."
            );

        } finally {

            setLoading(false);

        }

    };


    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(() => {

        loadDashboard("today");

    }, []);


    /* =====================================================
       CHART
    ===================================================== */

    useEffect(() => {

        if (
            !data?.chart ||
            !chartRef.current
        ) {

            return;

        }


        if (chartInstance.current) {

            chartInstance.current.destroy();

        }


        chartInstance.current =
            new Chart(
                chartRef.current,
                {

                    type: "line",

                    data: {

                        labels:
                            data.chart.months || [],

                        datasets: [

                            {

                                label:
                                    "Sales",

                                data:
                                    data.chart.sales || [],

                                tension:
                                    0.35,

                                fill:
                                    true,

                                borderWidth:
                                    2,

                                pointRadius:
                                    3,

                            },

                        ],

                    },


                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,


                        interaction: {

                            intersect:
                                false,

                            mode:
                                "index",

                        },


                        plugins: {

                            legend: {

                                display:
                                    true,

                                position:
                                    "top",

                            },


                            tooltip: {

                                callbacks: {

                                    label:
                                        function (
                                            context
                                        ) {

                                            return (
                                                " Sales: " +
                                                money(
                                                    context.parsed.y
                                                )
                                            );

                                        },

                                },

                            },

                        },


                        scales: {

                            x: {

                                grid: {

                                    display:
                                        false,

                                },

                            },


                            y: {

                                beginAtZero:
                                    true,

                                ticks: {

                                    callback:
                                        function (
                                            value
                                        ) {

                                            return (
                                                "SAR " +
                                                Number(
                                                    value
                                                ).toLocaleString(
                                                    "en-IN"
                                                )
                                            );

                                        },

                                },

                            },

                        },

                    },

                }
            );


        return () => {

            if (
                chartInstance.current
            ) {

                chartInstance.current.destroy();

                chartInstance.current =
                    null;

            }

        };

    }, [data]);


    /* =====================================================
       QUICK FILTER
    ===================================================== */

    const handleFilter = (
        selectedFilter
    ) => {

        setFilter(
            selectedFilter
        );

        loadDashboard(
            selectedFilter
        );

    };


    /* =====================================================
       CUSTOM DATE
    ===================================================== */

    const handleCustomFilter = () => {

        if (
            !fromDate ||
            !toDate
        ) {

            setError(
                "Please select both From Date and To Date."
            );

            return;

        }


        setFilter(
            "custom"
        );


        loadDashboard(
            "custom",
            fromDate,
            toDate
        );

    };


    /* =====================================================
       DATA SHORTCUTS
    ===================================================== */

    const statistics =
        data?.statistics || {};


    const payments =
        data?.payments || {};


    const orderStatus =
        data?.order_status || {};


    const branches =
        data?.branch_performance || [];


    const recentOrders =
        data?.recent_orders || [];


    const recentPayments =
        data?.recent_payments || [];


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <div className="dashboard-page">


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div className="dashboard-error">

                    <i className="bi bi-exclamation-triangle-fill"></i>

                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                    >
                        ×
                    </button>

                </div>

            )}


            {/* =================================================
                PERIOD FILTER
            ================================================= */}

            <div className="dashboard-card period-card">

                <div className="period-info">

                    <h3>
                        Dashboard Period
                    </h3>

                    <p>

                        {data?.period?.from_date ||
                            "-"}

                        {" → "}

                        {data?.period?.to_date ||
                            "-"}

                    </p>

                </div>


                <div className="filter-area">


                    {/* QUICK FILTERS */}

                    <div className="filter-buttons">

                        <button
                            type="button"
                            className={
                                filter === "today"
                                    ? "filter active"
                                    : "filter"
                            }
                            onClick={() =>
                                handleFilter(
                                    "today"
                                )
                            }
                        >
                            Today
                        </button>


                        <button
                            type="button"
                            className={
                                filter === "yesterday"
                                    ? "filter active"
                                    : "filter"
                            }
                            onClick={() =>
                                handleFilter(
                                    "yesterday"
                                )
                            }
                        >
                            Yesterday
                        </button>


                        <button
                            type="button"
                            className={
                                filter === "week"
                                    ? "filter active"
                                    : "filter"
                            }
                            onClick={() =>
                                handleFilter(
                                    "week"
                                )
                            }
                        >
                            This Week
                        </button>


                        <button
                            type="button"
                            className={
                                filter === "month"
                                    ? "filter active"
                                    : "filter"
                            }
                            onClick={() =>
                                handleFilter(
                                    "month"
                                )
                            }
                        >
                            This Month
                        </button>

                    </div>


                    {/* CUSTOM DATE */}

                    <div className="custom-date-area">

                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) =>
                                setFromDate(
                                    e.target.value
                                )
                            }
                        />


                        <span>
                            to
                        </span>


                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) =>
                                setToDate(
                                    e.target.value
                                )
                            }
                        />


                        <button
                            type="button"
                            onClick={
                                handleCustomFilter
                            }
                        >
                            Apply
                        </button>

                    </div>

                </div>

            </div>


            {/* =================================================
                MAIN STATISTICS
            ================================================= */}

            <div className="stats-grid">


                <StatCard
                    label="TOTAL BRANCHES"
                    value={
                        loading
                            ? "..."
                            : statistics.total_branches
                    }
                    icon="bi-buildings-fill"
                />


                <StatCard
                    label="TOTAL CUSTOMERS"
                    value={
                        loading
                            ? "..."
                            : statistics.total_customers
                    }
                    icon="bi-people-fill"
                />


                <StatCard
                    label="ORDERS"
                    value={
                        loading
                            ? "..."
                            : statistics.total_orders
                    }
                    sub="Selected period"
                    icon="bi-bag-check-fill"
                />


                <StatCard
                    label="PENDING ORDERS"
                    value={
                        loading
                            ? "..."
                            : orderStatus.pending_orders || 0
                    }
                    sub="Selected period"
                    icon="bi-clock-history"
                />


                <StatCard
                    label="DELIVERED ORDERS"
                    value={
                        loading
                            ? "..."
                            : orderStatus.delivered_orders || 0
                    }
                    sub="Selected period"
                    icon="bi-check-circle-fill"
                />


                <StatCard
                    label="SALES RECEIVED"
                    value={
                        money(
                            statistics.total_sales
                        )
                    }
                    type="success"
                    icon="bi-currency-dollar"
                />

            </div>


            {/* =================================================
                ACCOUNTING
            ================================================= */}

            <div className="stats-grid">


                <StatCard
                    label="TOTAL INCOME"
                    value={
                        money(
                            statistics.total_income
                        )
                    }
                    type="success"
                    icon="bi-arrow-down-left"
                />


                <StatCard
                    label="PURCHASE"
                    value={
                        money(
                            statistics.total_purchase
                        )
                    }
                    type="danger"
                    icon="bi-box-seam"
                />


                <StatCard
                    label="OTHER EXPENSE"
                    value={
                        money(
                            statistics.total_expense
                        )
                    }
                    type="danger"
                    icon="bi-receipt"
                />


                <StatCard
                    label="NET PROFIT"
                    value={
                        money(
                            statistics.net_profit
                        )
                    }
                    type={
                        Number(
                            statistics.net_profit
                        ) >= 0
                            ? "success"
                            : "danger"
                    }
                    icon="bi-graph-up-arrow"
                />

            </div>


            {/* =================================================
                PAYMENT CARDS
            ================================================= */}

            <div className="three-grid">


                <MoneyCard
                    label="CASH RECEIVED"
                    value={
                        payments.cash
                    }
                    type="success"
                    icon="bi-cash-stack"
                />


                <MoneyCard
                    label="BANK RECEIVED"
                    value={
                        payments.bank
                    }
                    type="primary"
                    icon="bi-bank"
                />


                <MoneyCard
                    label="OUTSTANDING BALANCE"
                    value={
                        payments.outstanding_balance
                    }
                    type="danger"
                    icon="bi-exclamation-circle"
                />

            </div>


            {/* =================================================
                PAYMENT SUMMARIES
            ================================================= */}

            <div className="two-grid">


                {/* PAYMENT MODE */}

                <div className="table-card">

                    <div className="table-card-header">

                        <div>

                            <h3>
                                Payment Mode Summary
                            </h3>

                            <p>
                                Payments by method
                            </p>

                        </div>

                    </div>


                    <MoneyRow
                        label="Cash"
                        value={
                            payments.cash
                        }
                    />


                    <MoneyRow
                        label="Bank"
                        value={
                            payments.bank
                        }
                    />


                    <MoneyRow
                        label="Online"
                        value={
                            payments.online
                        }
                    />


                    <MoneyRow
                        label="Cheque"
                        value={
                            payments.cheque
                        }
                    />


                    <MoneyRow
                        label="POS"
                        value={
                            payments.pos
                        }
                    />

                </div>


                {/* PAYMENT TYPE */}

                <div className="table-card">

                    <div className="table-card-header">

                        <div>

                            <h3>
                                Payment Type Summary
                            </h3>

                            <p>
                                Payment collection
                            </p>

                        </div>

                    </div>


                    <MoneyRow
                        label="Advance"
                        value={
                            payments.total_advance
                        }
                    />


                    <MoneyRow
                        label="Balance Payment"
                        value={
                            payments.total_balance_payment
                        }
                    />


                    <MoneyRow
                        label="Total Received"
                        value={
                            payments.total_received
                        }
                        success
                    />

                </div>

            </div>


            {/* =================================================
                ORDER STATUS
            ================================================= */}

            <div className="table-card">

                <div className="table-card-header">

                    <div>

                        <h3>
                            Order Status
                        </h3>

                        <p>
                            Current orders in selected period
                        </p>

                    </div>

                </div>


                <div className="status-grid">

                    <StatusItem
                        label="Pending"
                        value={
                            orderStatus.pending
                        }
                    />


                    <StatusItem
                        label="Cutting"
                        value={
                            orderStatus.cutting
                        }
                    />


                    <StatusItem
                        label="Stitching"
                        value={
                            orderStatus.stitching
                        }
                    />


                    <StatusItem
                        label="Ready"
                        value={
                            orderStatus.ready
                        }
                    />


                    <StatusItem
                        label="Delivery"
                        value={
                            orderStatus.delivery
                        }
                    />


                    <StatusItem
                        label="Delivered"
                        value={
                            orderStatus.delivered
                        }
                        success
                    />

                </div>

            </div>


            {/* =================================================
                SALES CHART + BRANCH PERFORMANCE
            ================================================= */}

            <div className="two-grid">


                {/* SALES CHART */}

                <div className="dashboard-card">

                    <div className="card-header">

                        <div>

                            <h3>
                                Sales Trend
                            </h3>

                            <p>
                                Monthly sales performance
                            </p>

                        </div>

                    </div>


                    <div className="chart-container">

                        {data?.chart?.months?.length ? (

                            <canvas
                                ref={chartRef}
                            />

                        ) : (

                            <div className="chart-empty">

                                <i className="bi bi-bar-chart"></i>

                                <span>
                                    No sales data available.
                                </span>

                            </div>

                        )}

                    </div>

                </div>


                {/* BRANCH PERFORMANCE */}

                <div className="table-card">

                    <div className="table-card-header">

                        <div>

                            <h3>
                                Branch Performance
                            </h3>

                            <p>
                                Sales and profit by branch
                            </p>

                        </div>

                    </div>


                    <div className="responsive-table">

                        <table>

                            <thead>

                                <tr>

                                    <th>
                                        Branch
                                    </th>

                                    <th>
                                        Orders
                                    </th>

                                    <th>
                                        Sales
                                    </th>

                                    <th>
                                        Profit
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {branches.length > 0 ? (

                                    branches.map(
                                        (branch) => (

                                            <tr
                                                key={
                                                    branch.id
                                                }
                                            >

                                                <td>
                                                    <strong>
                                                        {
                                                            branch.name
                                                        }
                                                    </strong>
                                                </td>

                                                <td>
                                                    {
                                                        branch.orders
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        money(
                                                            branch.sales
                                                        )
                                                    }
                                                </td>

                                                <td
                                                    className={
                                                        Number(
                                                            branch.profit
                                                        ) >= 0
                                                            ? "success-text"
                                                            : "danger-text"
                                                    }
                                                >
                                                    {
                                                        money(
                                                            branch.profit
                                                        )
                                                    }
                                                </td>

                                            </tr>

                                        )
                                    )

                                ) : (

                                    <EmptyRow
                                        columns="4"
                                        text="No branch data available."
                                    />

                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>


            {/* =================================================
                RECENT ORDERS
            ================================================= */}

            <div className="table-card">

                <div className="table-card-header">

                    <div>

                        <h3>
                            Recent Orders
                        </h3>

                        <p>
                            Latest orders in selected period
                        </p>

                    </div>

                </div>


                <div className="responsive-table">

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Order
                                </th>

                                <th>
                                    Customer
                                </th>

                                <th>
                                    Date
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Amount
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {recentOrders.length > 0 ? (

                                recentOrders.map(
                                    (order) => (

                                        <tr
                                            key={
                                                order.id
                                            }
                                        >

                                            <td>

                                                <strong>
                                                    #
                                                    {
                                                        order.id
                                                    }
                                                </strong>

                                            </td>


                                            <td>
                                                {
                                                    order.customer
                                                }
                                            </td>


                                            <td>
                                                {
                                                    order.date
                                                }
                                            </td>


                                            <td>

                                                <StatusBadge
                                                    status={
                                                        order.status
                                                    }
                                                />

                                            </td>


                                            <td>

                                                <strong>
                                                    {
                                                        money(
                                                            order.amount
                                                        )
                                                    }
                                                </strong>

                                            </td>

                                        </tr>

                                    )
                                )

                            ) : (

                                <EmptyRow
                                    columns="5"
                                    text="No orders found for this period."
                                />

                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            {/* =================================================
                RECENT PAYMENTS
            ================================================= */}

            <div className="table-card">

                <div className="table-card-header">

                    <div>

                        <h3>
                            Recent Payments
                        </h3>

                        <p>
                            Latest payment transactions
                        </p>

                    </div>

                </div>


                <div className="responsive-table">

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Payment
                                </th>

                                <th>
                                    Customer
                                </th>

                                <th>
                                    Date
                                </th>

                                <th>
                                    Mode
                                </th>

                                <th>
                                    Type
                                </th>

                                <th>
                                    Amount
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {recentPayments.length > 0 ? (

                                recentPayments.map(
                                    (payment) => (

                                        <tr
                                            key={
                                                payment.id
                                            }
                                        >

                                            <td>

                                                <strong>
                                                    #
                                                    {
                                                        payment.id
                                                    }
                                                </strong>

                                            </td>


                                            <td>
                                                {
                                                    payment.customer
                                                }
                                            </td>


                                            <td>
                                                {
                                                    payment.date
                                                }
                                            </td>


                                            <td>
                                                <span className="table-badge">
                                                    {
                                                        payment.mode
                                                    }
                                                </span>
                                            </td>


                                            <td>
                                                {
                                                    payment.type
                                                }
                                            </td>


                                            <td className="success-text">

                                                <strong>
                                                    {
                                                        money(
                                                            payment.amount
                                                        )
                                                    }
                                                </strong>

                                            </td>

                                        </tr>

                                    )
                                )

                            ) : (

                                <EmptyRow
                                    columns="6"
                                    text="No payments found for this period."
                                />

                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            {/* =================================================
                PERIOD SUMMARY
            ================================================= */}

            <div className="period-summary">


                <SummaryItem
                    label="SELECTED PERIOD"
                    value={
                        <>
                            {data?.period?.from_date ||
                                "-"}

                            {" → "}

                            {data?.period?.to_date ||
                                "-"}
                        </>
                    }
                />


                <SummaryItem
                    label="TOTAL BILLED"
                    value={
                        money(
                            payments.total_billed
                        )
                    }
                />


                <SummaryItem
                    label="TOTAL RECEIVED"
                    value={
                        money(
                            payments.total_received
                        )
                    }
                    success
                />


                <SummaryItem
                    label="OUTSTANDING"
                    value={
                        money(
                            payments.outstanding_balance
                        )
                    }
                    danger
                />

            </div>


        </div>

    );
}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
    label,
    value,
    sub,
    icon,
    type,
}) {

    return (

        <div className="stat-card">


            <div className="stat-content">

                <div className="stat-label">
                    {label}
                </div>


                <h3
                    className={
                        type
                            ? `${type}-text`
                            : ""
                    }
                >
                    {value}
                </h3>


                {sub && (

                    <small>
                        {sub}
                    </small>

                )}

            </div>


            <div className="stat-icon-wrapper">

                <i
                    className={`bi ${icon}`}
                ></i>

            </div>

        </div>

    );
}


/* =========================================================
   MONEY CARD
========================================================= */

function MoneyCard({
    label,
    value,
    type,
    icon,
}) {

    return (

        <div className="money-card">


            <div>

                <span>
                    {label}
                </span>


                <h3
                    className={
                        `${type}-text`
                    }
                >

                    SAR{" "}

                    {Number(
                        value || 0
                    ).toLocaleString(
                        "en-IN",
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        }
                    )}

                </h3>

            </div>


            <div className="money-icon">

                <i
                    className={`bi ${icon}`}
                ></i>

            </div>

        </div>

    );
}


/* =========================================================
   MONEY ROW
========================================================= */

function MoneyRow({
    label,
    value,
    success = false,
}) {

    return (

        <div className="table-row">

            <span>
                {label}
            </span>


            <strong
                className={
                    success
                        ? "success-text"
                        : ""
                }
            >

                SAR{" "}

                {Number(
                    value || 0
                ).toLocaleString(
                    "en-IN",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }
                )}

            </strong>

        </div>

    );
}


/* =========================================================
   STATUS ITEM
========================================================= */

function StatusItem({
    label,
    value,
    success = false,
}) {

    return (

        <div className="status-item">

            <div className="status-item-label">

                <span
                    className={
                        success
                            ? "status-dot success"
                            : "status-dot"
                    }
                ></span>

                {label}

            </div>


            <strong>
                {value || 0}
            </strong>

        </div>

    );
}


/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
    status,
}) {

    const statusClass =
        String(status || "")
            .toLowerCase()
            .replace(/\s+/g, "-");


    return (

        <span
            className={`status-badge ${statusClass}`}
        >
            {status || "Unknown"}
        </span>

    );
}


/* =========================================================
   SUMMARY ITEM
========================================================= */

function SummaryItem({
    label,
    value,
    success = false,
    danger = false,
}) {

    let className = "";

    if (success) {
        className = "success-text";
    }

    if (danger) {
        className = "danger-text";
    }


    return (

        <div>

            <span>
                {label}
            </span>


            <strong
                className={className}
            >
                {value}
            </strong>

        </div>

    );
}


/* =========================================================
   EMPTY ROW
========================================================= */

function EmptyRow({
    columns,
    text,
}) {

    return (

        <tr>

            <td
                colSpan={columns}
                className="empty"
            >
                {text}
            </td>

        </tr>

    );
}


export default Dashboard;