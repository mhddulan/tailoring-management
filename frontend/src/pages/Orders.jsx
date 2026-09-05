import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Orders.css";

function Orders() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const statusChoices = [
        "Pending",
        "Cutting",
        "Stitching",
        "Ready",
        "Delivery",
        "Delivered",
    ];

    // =========================================================
    // LOAD ORDERS
    // =========================================================

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("orders/");

            const data = response.data;

            setOrders(
                Array.isArray(data)
                    ? data
                    : data.results || []
            );
        } catch (err) {
            console.error("Unable to load orders:", err);

            setError(
                err.response?.data?.detail ||
                err.response?.data?.error ||
                "Unable to load orders."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // FILTER
    // =========================================================

    const filteredOrders = useMemo(() => {
        let result = [...orders];

        const searchValue = search
            .trim()
            .toLowerCase();

        if (searchValue) {
            result = result.filter((order) => {
                const orderId = String(
                    order.id || ""
                ).toLowerCase();

                const customerName = String(
                    order.customer_name || ""
                ).toLowerCase();

                const mobile = String(
                    order.customer_mobile || ""
                ).toLowerCase();

                return (
                    orderId.includes(searchValue) ||
                    customerName.includes(searchValue) ||
                    mobile.includes(searchValue)
                );
            });
        }

        if (statusFilter !== "All") {
            result = result.filter(
                (order) =>
                    order.status === statusFilter
            );
        }

        return result;
    }, [orders, search, statusFilter]);

    // =========================================================
    // HELPERS
    // =========================================================

    const getItems = (order) => {
        if (!Array.isArray(order.items)) {
            return [];
        }

        return order.items;
    };

    const getTotal = (order) => {
        if (
            order.total_amount !== undefined &&
            order.total_amount !== null
        ) {
            return Number(order.total_amount);
        }

        return getItems(order).reduce(
            (sum, item) =>
                sum + Number(item.amount || 0),
            0
        );
    };

    const getAdvance = (order) => {
        if (
            order.advance_received !== undefined &&
            order.advance_received !== null
        ) {
            return Number(order.advance_received);
        }

        if (!Array.isArray(order.payments)) {
            return 0;
        }

        return order.payments
            .filter(
                (payment) =>
                    payment.payment_type ===
                    "Advance"
            )
            .reduce(
                (sum, payment) =>
                    sum + Number(payment.amount || 0),
                0
            );
    };

    const getReceived = (order) => {
        if (
            order.total_received !== undefined &&
            order.total_received !== null
        ) {
            return Number(order.total_received);
        }

        if (!Array.isArray(order.payments)) {
            return 0;
        }

        return order.payments.reduce(
            (sum, payment) =>
                sum + Number(payment.amount || 0),
            0
        );
    };

    const getBalance = (order) => {
        if (
            order.balance_due !== undefined &&
            order.balance_due !== null
        ) {
            return Number(order.balance_due);
        }

        return Math.max(
            getTotal(order) - getReceived(order),
            0
        );
    };

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) {
            return date;
        }

        return parsed.toLocaleDateString(
            "en-GB"
        );
    };

    const formatMoney = (amount) => {
        return Number(amount || 0).toFixed(2);
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "Pending":
                return "status-pending";

            case "Cutting":
                return "status-cutting";

            case "Stitching":
                return "status-stitching";

            case "Ready":
                return "status-ready";

            case "Delivery":
                return "status-delivery";

            case "Delivered":
                return "status-delivered";

            default:
                return "status-default";
        }
    };

    // =========================================================
    // CLEAR FILTERS
    // =========================================================

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("All");
    };

    // =========================================================
    // DELETE
    // =========================================================

    const handleDelete = async (order) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete Order #${order.id}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");

            await api.delete(
                `orders/${order.id}/`
            );

            setOrders((current) =>
                current.filter(
                    (item) =>
                        item.id !== order.id
                )
            );
        } catch (err) {
            console.error(
                "Unable to delete order:",
                err
            );

            setError(
                err.response?.data?.detail ||
                err.response?.data?.error ||
                "Unable to delete order."
            );
        }
    };

    // =========================================================
    // STATUS UPDATE
    // =========================================================

    const handleStatusChange = async (
        orderId,
        newStatus
    ) => {
        try {
            setError("");

            await api.patch(
                `orders/${orderId}/`,
                {
                    status: newStatus,
                }
            );

            setOrders((current) =>
                current.map((order) =>
                    order.id === orderId
                        ? {
                              ...order,
                              status: newStatus,
                          }
                        : order
                )
            );
        } catch (err) {
            console.error(
                "Unable to update order status:",
                err
            );

            setError(
                err.response?.data?.detail ||
                err.response?.data?.error ||
                "Unable to update order status."
            );
        }
    };

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="orders-loading">
                <div className="spinner-border"></div>

                <p>
                    Loading orders...
                </p>
            </div>
        );
    }

    return (
        <div className="orders-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="orders-header">

                <div>

                    <div className="page-breadcrumb">

                        <span>
                            Orders
                        </span>

                    </div>

                    <h1>
                        Order Management
                    </h1>

                    <p>
                        View, manage, update and
                        track customer orders.
                    </p>

                </div>

                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() =>
                        navigate(
                            "/orders/create"
                        )
                    }
                >
                    <i className="bi bi-plus-lg me-2"></i>

                    Create Order
                </button>

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="alert alert-danger">

                    <i className="bi bi-exclamation-triangle me-2"></i>

                    {error}

                </div>
            )}

            {/* =================================================
                FILTER CARD
            ================================================= */}

            <div className="orders-filter-card">

                <div className="orders-search">

                    <i className="bi bi-search"></i>

                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search order, customer name or mobile..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                    />

                </div>

                <div className="orders-status-filter">

                    <label>
                        Status
                    </label>

                    <select
                        className="form-select"
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value
                            )
                        }
                    >

                        <option value="All">
                            All Orders
                        </option>

                        {statusChoices.map(
                            (status) => (
                                <option
                                    key={status}
                                    value={status}
                                >
                                    {status}
                                </option>
                            )
                        )}

                    </select>

                </div>

                {(search ||
                    statusFilter !== "All") && (
                    <button
                        type="button"
                        className="btn btn-light orders-clear-btn"
                        onClick={
                            clearFilters
                        }
                    >
                        <i className="bi bi-x-lg me-2"></i>
                        Clear
                    </button>
                )}

            </div>

            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className="orders-summary">

                <div className="orders-summary-item">

                    <span>
                        Total Orders
                    </span>

                    <strong>
                        {filteredOrders.length}
                    </strong>

                </div>

                <div className="orders-summary-item">

                    <span>
                        Total Amount
                    </span>

                    <strong>
                        SAR{" "}
                        {formatMoney(
                            filteredOrders.reduce(
                                (sum, order) =>
                                    sum +
                                    getTotal(
                                        order
                                    ),
                                0
                            )
                        )}
                    </strong>

                </div>

                <div className="orders-summary-item">

                    <span>
                        Received
                    </span>

                    <strong>
                        SAR{" "}
                        {formatMoney(
                            filteredOrders.reduce(
                                (sum, order) =>
                                    sum +
                                    getReceived(
                                        order
                                    ),
                                0
                            )
                        )}
                    </strong>

                </div>

                <div className="orders-summary-item">

                    <span>
                        Outstanding
                    </span>

                    <strong>
                        SAR{" "}
                        {formatMoney(
                            filteredOrders.reduce(
                                (sum, order) =>
                                    sum +
                                    getBalance(
                                        order
                                    ),
                                0
                            )
                        )}
                    </strong>

                </div>

            </div>

            {/* =================================================
                TABLE
            ================================================= */}

            <div className="orders-table-card">

                <div className="orders-table-header">

                    <div>

                        <h3>
                            Order Directory
                        </h3>

                        <p>
                            {filteredOrders.length}{" "}
                            order
                            {filteredOrders.length !==
                            1
                                ? "s"
                                : ""}
                            found
                        </p>

                    </div>

                </div>

                <div className="table-responsive">

                    <table className="orders-table">

                        <thead>

                            <tr>

                                <th>
                                    Order
                                </th>

                                <th>
                                    Customer
                                </th>

                                <th>
                                    Items
                                </th>

                                <th>
                                    Order Date
                                </th>

                                <th>
                                    Delivery
                                </th>

                                <th>
                                    Amount
                                </th>

                                <th>
                                    Advance
                                </th>

                                <th>
                                    Balance
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Actions
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {filteredOrders.length ===
                            0 ? (
                                <tr>

                                    <td
                                        colSpan="10"
                                        className="orders-empty"
                                    >

                                        <div className="orders-empty-icon">

                                            <i className="bi bi-receipt"></i>

                                        </div>

                                        <h4>
                                            No orders found
                                        </h4>

                                        <p>
                                            {search ||
                                            statusFilter !==
                                                "All"
                                                ? "Try changing your search or filters."
                                                : "Create your first order to get started."}
                                        </p>

                                        {!search &&
                                            statusFilter ===
                                                "All" && (
                                                <button
                                                    type="button"
                                                    className="btn btn-primary"
                                                    onClick={() =>
                                                        navigate(
                                                            "/orders/create"
                                                        )
                                                    }
                                                >
                                                    <i className="bi bi-plus-lg me-2"></i>
                                                    Create Order
                                                </button>
                                            )}

                                    </td>

                                </tr>
                            ) : (
                                filteredOrders.map(
                                    (order) => {

                                        const items =
                                            getItems(
                                                order
                                            );

                                        const total =
                                            getTotal(
                                                order
                                            );

                                        const advance =
                                            getAdvance(
                                                order
                                            );

                                        const balance =
                                            getBalance(
                                                order
                                            );

                                        return (
                                            <tr
                                                key={
                                                    order.id
                                                }
                                            >

                                                {/* ORDER */}

                                                <td>

                                                    <button
                                                        type="button"
                                                        className="order-number-btn"
                                                        onClick={() =>
                                                            navigate(
                                                                `/orders/${order.id}`
                                                            )
                                                        }
                                                    >
                                                        #
                                                        {
                                                            order.id
                                                        }
                                                    </button>

                                                </td>

                                                {/* CUSTOMER */}

                                                <td>

                                                    <div className="order-customer">

                                                        <div className="order-customer-icon">

                                                            <i className="bi bi-person-fill"></i>

                                                        </div>

                                                        <div>

                                                            <strong>
                                                                {
                                                                    order.customer_name ||
                                                                    "Unknown Customer"
                                                                }
                                                            </strong>

                                                            {order.customer_mobile && (
                                                                <small>
                                                                    {
                                                                        order.customer_mobile
                                                                    }
                                                                </small>
                                                            )}

                                                        </div>

                                                    </div>

                                                </td>

                                                {/* ITEMS */}

                                                <td>

                                                    <span className="items-badge">

                                                        {
                                                            items.length
                                                        }

                                                        {" "}

                                                        {items.length ===
                                                        1
                                                            ? "Item"
                                                            : "Items"}

                                                    </span>

                                                </td>

                                                {/* ORDER DATE */}

                                                <td>

                                                    {
                                                        formatDate(
                                                            order.order_date
                                                        )
                                                    }

                                                </td>

                                                {/* DELIVERY */}

                                                <td>

                                                    {
                                                        formatDate(
                                                            order.delivery_date
                                                        )
                                                    }

                                                </td>

                                                {/* TOTAL */}

                                                <td>

                                                    <strong>
                                                        SAR{" "}
                                                        {formatMoney(
                                                            total
                                                        )}
                                                    </strong>

                                                </td>

                                                {/* ADVANCE */}

                                                <td>

                                                    <span className="money-positive">
                                                        SAR{" "}
                                                        {formatMoney(
                                                            advance
                                                        )}
                                                    </span>

                                                </td>

                                                {/* BALANCE */}

                                                <td>

                                                    <span
                                                        className={
                                                            balance >
                                                            0
                                                                ? "money-due"
                                                                : "money-paid"
                                                        }
                                                    >
                                                        SAR{" "}
                                                        {formatMoney(
                                                            balance
                                                        )}
                                                    </span>

                                                </td>

                                                {/* STATUS */}

                                                <td>

                                                    <select
                                                        className={`status-select ${getStatusClass(
                                                            order.status
                                                        )}`}
                                                        value={
                                                            order.status ||
                                                            "Pending"
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            handleStatusChange(
                                                                order.id,
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    >

                                                        {statusChoices.map(
                                                            (
                                                                status
                                                            ) => (
                                                                <option
                                                                    key={
                                                                        status
                                                                    }
                                                                    value={
                                                                        status
                                                                    }
                                                                >
                                                                    {
                                                                        status
                                                                    }
                                                                </option>
                                                            )
                                                        )}

                                                    </select>

                                                </td>

                                                {/* ACTIONS */}

                                                <td>

                                                    <div className="order-actions">

                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-light"
                                                            title="View"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/orders/${order.id}`
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-eye"></i>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-light"
                                                            title="Edit"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/orders/${order.id}/edit`
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-pencil"></i>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            title="Delete"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    order
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>
                                        );
                                    }
                                )
                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}

export default Orders;