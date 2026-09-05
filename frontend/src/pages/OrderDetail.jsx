import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./OrderDetail.css";

function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadOrder();
    }, [id]);

    const loadOrder = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(`orders/${id}/`);

            setOrder(response.data);
        } catch (err) {
            console.error("Unable to load order:", err);

            setError(
                err.response?.data?.detail ||
                err.response?.data?.error ||
                "Unable to load order."
            );
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return "-";

        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) {
            return date;
        }

        return parsed.toLocaleDateString("en-GB");
    };

    const formatMoney = (value) => {
        return Number(value || 0).toFixed(2);
    };

    const items = Array.isArray(order?.items)
        ? order.items
        : [];

    const payments = Array.isArray(order?.payments)
        ? order.payments
        : [];

    const totalAmount = Number(
        order?.total_amount || 0
    );

    const totalReceived = Number(
        order?.total_received || 0
    );

    const advanceReceived = Number(
        order?.advance_received || 0
    );

    const balanceDue = Number(
        order?.balance_due ??
        totalAmount - totalReceived
    );

    const canDeliver =
        order?.status === "Ready" ||
        order?.status === "Delivery";

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

    const handleDelete = async () => {
        const confirmed = window.confirm(
            `Are you sure you want to delete Order #${id}?`
        );

        if (!confirmed) return;

        try {
            await api.delete(`orders/${id}/`);

            navigate("/orders");
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

    const handleStatusChange = async (e) => {
        const newStatus = e.target.value;

        try {
            setError("");

            await api.patch(
                `orders/${id}/`,
                {
                    status: newStatus,
                }
            );

            // Reload complete order data.
            // This also updates delivered_date,
            // payments, totals, etc.
            await loadOrder();

        } catch (err) {
            console.error(
                "Unable to update status:",
                err
            );

            setError(
                err.response?.data?.detail ||
                err.response?.data?.error ||
                "Unable to update order status."
            );
        }
    };

    if (loading) {
        return (
            <div className="order-detail-loading">
                <div className="spinner-border"></div>
                <p>Loading order...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="order-detail-page">

                <div className="alert alert-danger">
                    {error || "Order not found."}
                </div>

                <button
                    className="btn btn-primary"
                    onClick={() =>
                        navigate("/orders")
                    }
                >
                    Back to Orders
                </button>

            </div>
        );
    }

    return (
        <div className="order-detail-page">

            {/* HEADER */}

            <div className="order-detail-header">

                <div>

                    <div className="page-breadcrumb">

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/orders")
                            }
                        >
                            Orders
                        </button>

                        <i className="bi bi-chevron-right"></i>

                        <span>
                            Order #{order.id}
                        </span>

                    </div>

                    <h1>
                        Order #{order.id}
                    </h1>

                    <p>
                        View complete order and
                        payment information.
                    </p>

                </div>

                <div className="order-detail-actions">

                    <button
                        type="button"
                        className="btn btn-light"
                        onClick={() =>
                            window.print()
                        }
                    >
                        <i className="bi bi-printer me-2"></i>
                        Print Invoice
                    </button>

                    {canDeliver && (
                        <button
                            type="button"
                            className="btn btn-success"
                            onClick={() =>
                                navigate(
                                    `/orders/${id}/delivery`
                                )
                            }
                        >
                            <i className="bi bi-truck me-2"></i>
                            Deliver Order
                        </button>
                    )}

                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() =>
                            navigate(
                                `/orders/${id}/edit`
                            )
                        }
                    >
                        <i className="bi bi-pencil me-2"></i>
                        Edit Order
                    </button>

                    <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={handleDelete}
                    >
                        <i className="bi bi-trash me-2"></i>
                        Delete
                    </button>

                </div>

            </div>


            {/* ERROR */}

            {error && (
                <div className="alert alert-danger">

                    <i className="bi bi-exclamation-triangle me-2"></i>

                    {error}

                </div>
            )}


            {/* ORDER + CUSTOMER */}

            <div className="order-detail-grid">

                <div className="order-detail-card">

                    <div className="order-card-header">

                        <div className="order-card-icon">
                            <i className="bi bi-receipt"></i>
                        </div>

                        <div>
                            <h3>
                                Order & Customer
                            </h3>

                            <p>
                                Order information
                            </p>
                        </div>

                    </div>


                    <div className="order-info-grid">

                        <div>
                            <span>
                                Customer
                            </span>

                            <strong>
                                {order.customer_name ||
                                    "-"}
                            </strong>
                        </div>


                        <div>
                            <span>
                                Phone
                            </span>

                            <strong>
                                {order.customer_mobile ||
                                    "-"}
                            </strong>
                        </div>


                        <div>
                            <span>
                                Order Date
                            </span>

                            <strong>
                                {formatDate(
                                    order.order_date
                                )}
                            </strong>
                        </div>


                        <div>
                            <span>
                                Delivery Date
                            </span>

                            <strong>
                                {formatDate(
                                    order.delivery_date
                                )}
                            </strong>
                        </div>


                        {order.delivered_date && (
                            <div>

                                <span>
                                    Delivered Date
                                </span>

                                <strong>
                                    {formatDate(
                                        order.delivered_date
                                    )}
                                </strong>

                            </div>
                        )}


                        {order.delivered_by && (
                            <div>

                                <span>
                                    Delivered By
                                </span>

                                <strong>
                                    {order.delivered_by}
                                </strong>

                            </div>
                        )}


                        <div>

                            <span>
                                Status
                            </span>

                            <select
                                className={`status-select ${getStatusClass(
                                    order.status
                                )}`}
                                value={
                                    order.status ||
                                    "Pending"
                                }
                                onChange={
                                    handleStatusChange
                                }
                            >

                                <option value="Pending">
                                    Pending
                                </option>

                                <option value="Cutting">
                                    Cutting
                                </option>

                                <option value="Stitching">
                                    Stitching
                                </option>

                                <option value="Ready">
                                    Ready
                                </option>

                                <option value="Delivery">
                                    Delivery
                                </option>

                                <option value="Delivered">
                                    Delivered
                                </option>

                            </select>

                        </div>

                    </div>

                </div>


                {/* PAYMENT SUMMARY */}

                <div className="order-detail-card">

                    <div className="order-card-header">

                        <div className="order-card-icon">
                            <i className="bi bi-wallet2"></i>
                        </div>

                        <div>

                            <h3>
                                Payment Summary
                            </h3>

                            <p>
                                Order payment status
                            </p>

                        </div>

                    </div>


                    <div className="payment-summary-grid">

                        <div>

                            <span>
                                Total Amount
                            </span>

                            <strong>
                                SAR{" "}
                                {formatMoney(
                                    totalAmount
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Advance Received
                            </span>

                            <strong className="text-success">
                                SAR{" "}
                                {formatMoney(
                                    advanceReceived
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Total Received
                            </span>

                            <strong className="text-success">
                                SAR{" "}
                                {formatMoney(
                                    totalReceived
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Balance Due
                            </span>

                            <strong
                                className={
                                    balanceDue > 0
                                        ? "text-danger"
                                        : "text-success"
                                }
                            >
                                SAR{" "}
                                {formatMoney(
                                    balanceDue
                                )}
                            </strong>

                        </div>

                    </div>

                </div>

            </div>


            {/* ORDER ITEMS */}

            <div className="order-detail-card">

                <div className="order-card-header">

                    <div className="order-card-icon">
                        <i className="bi bi-box-seam"></i>
                    </div>

                    <div>

                        <h3>
                            Order Items
                        </h3>

                        <p>
                            Products included in this
                            order
                        </p>

                    </div>

                </div>


                <div className="table-responsive">

                    <table className="order-detail-table">

                        <thead>

                            <tr>

                                <th>#</th>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Rate</th>
                                <th>Amount</th>

                            </tr>

                        </thead>


                        <tbody>

                            {items.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="5"
                                        className="text-center py-5"
                                    >
                                        No items found.
                                    </td>

                                </tr>

                            ) : (

                                items.map(
                                    (item, index) => (

                                        <tr
                                            key={
                                                item.id ||
                                                index
                                            }
                                        >

                                            <td>
                                                {index + 1}
                                            </td>

                                            <td>
                                                <strong>
                                                    {
                                                        item.product_name ||
                                                        "Product"
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                {
                                                    item.quantity
                                                }
                                            </td>

                                            <td>
                                                SAR{" "}
                                                {formatMoney(
                                                    item.rate
                                                )}
                                            </td>

                                            <td>
                                                <strong>
                                                    SAR{" "}
                                                    {formatMoney(
                                                        item.amount
                                                    )}
                                                </strong>
                                            </td>

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>


                        <tfoot>

                            <tr>

                                <td
                                    colSpan="4"
                                    className="order-total-label"
                                >
                                    Grand Total
                                </td>

                                <td className="order-total-value">
                                    SAR{" "}
                                    {formatMoney(
                                        totalAmount
                                    )}
                                </td>

                            </tr>

                        </tfoot>

                    </table>

                </div>

            </div>


            {/* PAYMENT HISTORY */}

            <div className="order-detail-card">

                <div className="order-card-header">

                    <div className="order-card-icon">
                        <i className="bi bi-credit-card"></i>
                    </div>

                    <div>

                        <h3>
                            Payment History
                        </h3>

                        <p>
                            Payments received for this
                            order
                        </p>

                    </div>

                </div>


                <div className="table-responsive">

                    <table className="order-detail-table">

                        <thead>

                            <tr>

                                <th>Date</th>
                                <th>Type</th>
                                <th>Payment Mode</th>
                                <th>Amount</th>

                            </tr>

                        </thead>


                        <tbody>

                            {payments.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="4"
                                        className="text-center py-5"
                                    >
                                        No payment history
                                        found.
                                    </td>

                                </tr>

                            ) : (

                                payments.map(
                                    (payment) => (

                                        <tr
                                            key={
                                                payment.id
                                            }
                                        >

                                            <td>
                                                {formatDate(
                                                    payment.payment_date
                                                )}
                                            </td>

                                            <td>

                                                <span className="payment-type-badge">

                                                    {
                                                        payment.payment_type ||
                                                        "-"
                                                    }

                                                </span>

                                            </td>

                                            <td>
                                                {
                                                    payment.payment_mode ||
                                                    "-"
                                                }
                                            </td>

                                            <td>

                                                <strong>
                                                    SAR{" "}
                                                    {formatMoney(
                                                        payment.amount
                                                    )}
                                                </strong>

                                            </td>

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            {/* FOOTER */}

            <div className="order-detail-footer">

                <button
                    type="button"
                    className="btn btn-light"
                    onClick={() =>
                        navigate("/orders")
                    }
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to Orders
                </button>


                <div>

                    {balanceDue > 0 && (
                        <button
                            type="button"
                            className="btn btn-success me-2"
                            onClick={() =>
                                navigate(
                                    `/orders/${id}/payment`
                                )
                            }
                        >
                            <i className="bi bi-plus-lg me-2"></i>
                            Add Payment
                        </button>
                    )}


                    {canDeliver && (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() =>
                                navigate(
                                    `/orders/${id}/delivery`
                                )
                            }
                        >
                            <i className="bi bi-truck me-2"></i>
                            Deliver Order
                        </button>
                    )}

                </div>

            </div>

        </div>
    );
}

export default OrderDetail;