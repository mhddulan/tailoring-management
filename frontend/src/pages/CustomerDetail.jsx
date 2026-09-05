import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./CustomerDetail.css";

function CustomerDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [customer, setCustomer] = useState(null);
    const [measurements, setMeasurements] = useState(null);
    const [orders, setOrders] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =========================================================
    // LOAD CUSTOMER
    // =========================================================

    useEffect(() => {
        loadCustomer();
    }, [id]);

    const loadCustomer = async () => {
        try {
            setLoading(true);
            setError("");

            // Customer
            const customerResponse = await api.get(
                `customers/${id}/`
            );

            setCustomer(customerResponse.data);

            // Measurements
            try {
                const measurementResponse = await api.get(
                    `measurements/?customer=${id}`
                );

                const measurementData =
                    measurementResponse.data;

                if (Array.isArray(measurementData)) {
                    setMeasurements(
                        measurementData[0] || null
                    );
                } else if (
                    Array.isArray(measurementData.results)
                ) {
                    setMeasurements(
                        measurementData.results[0] || null
                    );
                }
            } catch (measurementError) {
                console.log(
                    "Measurement loading error:",
                    measurementError
                );
            }

            // Orders
            try {
                const orderResponse = await api.get(
                    `orders/?customer=${id}`
                );

                const orderData = orderResponse.data;

                if (Array.isArray(orderData)) {
                    setOrders(orderData);
                } else if (Array.isArray(orderData.results)) {
                    setOrders(orderData.results);
                }
            } catch (orderError) {
                console.log(
                    "Order loading error:",
                    orderError
                );
            }

        } catch (err) {
            console.error(
                "Customer detail error:",
                err
            );

            setError(
                err.response?.data?.detail ||
                "Unable to load customer details."
            );
        } finally {
            setLoading(false);
        }
    };


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="customer-detail-page">

                <div className="customer-detail-loading">

                    <div
                        className="spinner-border text-primary"
                        role="status"
                    ></div>

                    <p>
                        Loading customer details...
                    </p>

                </div>

            </div>
        );
    }


    // =========================================================
    // ERROR
    // =========================================================

    if (error) {
        return (
            <div className="customer-detail-page">

                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </div>

                <button
                    className="btn btn-secondary"
                    onClick={() => navigate("/customers")}
                >
                    <i className="bi bi-arrow-left me-1"></i>
                    Back to Customers
                </button>

            </div>
        );
    }


    if (!customer) {
        return null;
    }


    // =========================================================
    // CALCULATIONS
    // =========================================================

    const totalOrders = orders.length;

    const totalAmount = orders.reduce(
        (sum, order) =>
            sum + Number(order.total_amount || 0),
        0
    );

    const totalPaid = orders.reduce(
        (sum, order) =>
            sum +
            Number(
                order.total_received ??
                order.paid_amount ??
                order.paid ??
                0
            ),
        0
    );

    const outstanding = Math.max(
        totalAmount - totalPaid,
        0
    );

    const deliveredOrders = orders.filter(
        (order) =>
            String(order.status || "").toLowerCase() ===
            "delivered"
    );

    const pendingOrders = orders.filter(
        (order) =>
            String(order.status || "").toLowerCase() !==
            "delivered"
    );


    const advanceReceived = orders.reduce(
        (sum, order) =>
            sum +
            Number(
                order.advance ??
                order.advance_amount ??
                0
            ),
        0
    );


    const balanceDue = orders.reduce(
        (sum, order) =>
            sum +
            Number(
                order.balance ??
                order.balance_amount ??
                0
            ),
        0
    );


    const money = (value) =>
        `SAR ${Number(value || 0).toFixed(2)}`;


    // =========================================================
    // STATUS CLASS
    // =========================================================

    const statusClass = (status) => {
        switch (
            String(status || "").toLowerCase()
        ) {
            case "pending":
                return "customer-status-pending";

            case "cutting":
                return "customer-status-cutting";

            case "stitching":
                return "customer-status-stitching";

            case "ready":
                return "customer-status-ready";

            case "delivery":
                return "customer-status-delivery";

            case "delivered":
                return "customer-status-delivered";

            default:
                return "customer-status-default";
        }
    };


    return (
        <div className="customer-detail-page">

            {/* =====================================================
                HEADER
            ====================================================== */}

            <div className="page-header-block">

                <div>

                    <h2 className="page-header-title">
                        {customer.name}
                    </h2>

                    <p className="page-header-sub">
                        Customer ID #{customer.id}
                        {" • "}
                        Branch:{" "}
                        {customer.branch_name ||
                            customer.branch ||
                            "-"}
                    </p>

                </div>


                <div className="customer-detail-header-actions">

                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() =>
                            navigate(
                                `/orders/create?customer=${customer.id}`
                            )
                        }
                    >
                        <i className="bi bi-plus-circle me-1"></i>
                        Create Order
                    </button>

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() =>
                            navigate(
                                `/customers/${customer.id}/ledger`
                            )
                        }
                    >
                        <i className="bi bi-journal-text me-1"></i>
                        Customer Ledger
                    </button>

                    <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() =>
                            navigate(
                                `/customers/${customer.id}/edit`
                            )
                        }
                    >
                        <i className="bi bi-pencil me-1"></i>
                        Edit Customer
                    </button>

                </div>

            </div>


            {/* =====================================================
                STAT CARDS
            ====================================================== */}

            <div className="row g-3 mb-4">

                <StatCard
                    className="customer-stat-blue"
                    icon="bi-bag-check-fill"
                    label="Total Orders"
                    value={totalOrders}
                />

                <StatCard
                    className="customer-stat-orange"
                    icon="bi-currency-dollar"
                    label="Total Amount"
                    value={money(totalAmount)}
                />

                <StatCard
                    className="customer-stat-green"
                    icon="bi-cash-stack"
                    label="Total Paid"
                    value={money(totalPaid)}
                />

                <StatCard
                    className="customer-stat-red"
                    icon="bi-exclamation-circle-fill"
                    label="Outstanding"
                    value={money(outstanding)}
                />

            </div>


            {/* =====================================================
                INFORMATION + STATUS
            ====================================================== */}

            <div className="row g-4 mb-4">

                {/* CUSTOMER INFORMATION */}

                <div className="col-lg-6">

                    <div className="customer-detail-card">

                        <div className="customer-detail-card-header">

                            <span>
                                <i className="bi bi-person-vcard-fill"></i>
                                Customer Information
                            </span>

                        </div>


                        <div className="customer-detail-card-body">

                            <InfoRow
                                label="Name"
                                value={customer.name}
                            />

                            <InfoRow
                                label="Mobile"
                                value={
                                    customer.mobile || "-"
                                }
                                icon="bi-telephone"
                            />

                            <InfoRow
                                label="Address"
                                value={
                                    customer.address ||
                                    "No address specified"
                                }
                            />

                            <div className="customer-info-row">

                                <span className="customer-info-label">
                                    Branch
                                </span>

                                <span className="badge bg-light text-dark border">

                                    <i className="bi bi-building me-1"></i>

                                    {customer.branch_name ||
                                        customer.branch ||
                                        "-"}

                                </span>

                            </div>

                        </div>

                    </div>

                </div>


                {/* ORDER STATUS */}

                <div className="col-lg-6">

                    <div className="customer-detail-card">

                        <div className="customer-detail-card-header">

                            <span>
                                <i className="bi bi-bar-chart-fill"></i>
                                Order Status
                            </span>

                        </div>


                        <div className="customer-detail-card-body">

                            <div className="order-status-grid">

                                <StatusItem
                                    icon="bi-clock-fill"
                                    type="pending"
                                    label="Pending"
                                    value={pendingOrders.length}
                                />

                                <StatusItem
                                    icon="bi-check-circle-fill"
                                    type="delivered"
                                    label="Delivered"
                                    value={deliveredOrders.length}
                                />

                                <StatusItem
                                    icon="bi-cash-stack"
                                    type="advance"
                                    label="Advance Received"
                                    value={money(
                                        advanceReceived
                                    )}
                                />

                                <StatusItem
                                    icon="bi-wallet2"
                                    type="balance"
                                    label="Balance Due"
                                    value={money(
                                        balanceDue ||
                                        outstanding
                                    )}
                                />

                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* =====================================================
                MEASUREMENTS
            ====================================================== */}

            <div className="customer-detail-card mb-4">

                <div className="customer-detail-card-header">

                    <span>
                        <i className="bi bi-rulers"></i>
                        Saved Measurements
                    </span>

                    <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() =>
                            navigate(
                                `/customers/${customer.id}/measurements`
                            )
                        }
                    >
                        <i className="bi bi-pencil me-1"></i>
                        Edit Measurements
                    </button>

                </div>


                <div className="table-responsive">

                    <table className="table app-table mb-0">

                        <thead>

                            <tr>
                                <th>Top Length</th>
                                <th>Shoulder</th>
                                <th>Sleeve</th>
                                <th>Sleeve Down</th>
                                <th>Body</th>
                                <th>Collar</th>
                                <th>Pant Length</th>
                            </tr>

                        </thead>

                        <tbody>

                            {measurements ? (

                                <tr>
                                    <td>{measurements.top_length || "-"}</td>
                                    <td>{measurements.shoulder || "-"}</td>
                                    <td>{measurements.sleeve || "-"}</td>
                                    <td>{measurements.sleeve_down || "-"}</td>
                                    <td>{measurements.body || "-"}</td>
                                    <td>{measurements.collar || "-"}</td>
                                    <td>{measurements.pant_length || "-"}</td>
                                </tr>

                            ) : (

                                <tr>
                                    <td
                                        colSpan="7"
                                        className="text-center py-4 text-muted"
                                    >
                                        No measurements saved yet.
                                    </td>
                                </tr>

                            )}

                        </tbody>


                        {measurements && (
                            <>
                                <thead>

                                    <tr>
                                        <th>Band</th>
                                        <th>Hip</th>
                                        <th>Bell</th>
                                        <th>Loose</th>
                                        <th>Mutt</th>
                                        <th>Play</th>
                                        <th>Notes</th>
                                    </tr>

                                </thead>

                                <tbody>

                                    <tr>
                                        <td>{measurements.band || "-"}</td>
                                        <td>{measurements.hip || "-"}</td>
                                        <td>{measurements.bell || "-"}</td>
                                        <td>{measurements.loose || "-"}</td>
                                        <td>{measurements.mutt || "-"}</td>
                                        <td>{measurements.play || "-"}</td>
                                        <td>{measurements.notes || "-"}</td>
                                    </tr>

                                </tbody>
                            </>
                        )}

                    </table>

                </div>

            </div>


            {/* =====================================================
                ORDER HISTORY
            ====================================================== */}

            <div className="customer-detail-card mb-4">

                <div className="customer-detail-card-header">

                    <span>
                        <i className="bi bi-clock-history"></i>
                        Customer Order History
                    </span>

                    <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() =>
                            navigate(
                                `/orders/create?customer=${customer.id}`
                            )
                        }
                    >
                        <i className="bi bi-plus-circle me-1"></i>
                        New Order
                    </button>

                </div>


                <div className="table-responsive">

                    <table className="table app-table mb-0">

                        <thead>

                            <tr>
                                <th>Order</th>
                                <th>Items</th>
                                <th>Order Date</th>
                                <th>Delivery</th>
                                <th>Status</th>
                                <th className="text-end">
                                    Total
                                </th>
                                <th className="text-end">
                                    Paid
                                </th>
                                <th className="text-end">
                                    Balance
                                </th>
                            </tr>

                        </thead>


                        <tbody>

                            {orders.length > 0 ? (

                                orders.map((order) => {

                                    const paid =
                                        Number(
                                            order.total_received ??
                                            order.paid_amount ??
                                            order.paid ??
                                            0
                                        );

                                    const total =
                                        Number(
                                            order.total_amount || 0
                                        );

                                    const balance =
                                        Number(
                                            order.balance ??
                                            total - paid
                                        );

                                    return (
                                        <tr key={order.id}>

                                            <td className="fw-semibold">
                                                #{order.id}
                                            </td>

                                            <td>
                                                {order.items_count ??
                                                    order.items?.length ??
                                                    0}
                                            </td>

                                            <td>
                                                {order.order_date ||
                                                    "-"}
                                            </td>

                                            <td>
                                                {order.delivery_date ||
                                                    "-"}
                                            </td>

                                            <td>

                                                <span
                                                    className={`customer-status-badge ${statusClass(
                                                        order.status
                                                    )}`}
                                                >
                                                    {order.status ||
                                                        "-"}
                                                </span>

                                            </td>

                                            <td className="text-end fw-semibold">
                                                {money(total)}
                                            </td>

                                            <td className="text-end text-success">
                                                {money(paid)}
                                            </td>

                                            <td className="text-end text-danger">
                                                {money(balance)}
                                            </td>

                                        </tr>
                                    );
                                })

                            ) : (

                                <tr>

                                    <td
                                        colSpan="8"
                                        className="text-center py-5 text-muted"
                                    >

                                        <i className="bi bi-bag-x fs-1 d-block mb-2"></i>

                                        <strong>
                                            No orders found.
                                        </strong>

                                        <div className="small mt-1">
                                            Create a new order for
                                            this customer.
                                        </div>

                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            {/* =====================================================
                FOOTER
            ====================================================== */}

            <div className="customer-detail-footer">

                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                        navigate("/customers")
                    }
                >
                    <i className="bi bi-arrow-left me-1"></i>
                    Back to Customers
                </button>


                <div className="customer-detail-footer-right">

                    <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() =>
                            navigate(
                                `/customers/${customer.id}/ledger`
                            )
                        }
                    >
                        <i className="bi bi-journal-text me-1"></i>
                        View Customer Ledger
                    </button>


                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() =>
                            navigate(
                                `/orders/create?customer=${customer.id}`
                            )
                        }
                    >
                        <i className="bi bi-plus-circle me-1"></i>
                        Create New Order
                    </button>

                </div>

            </div>

        </div>
    );
}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
    className,
    icon,
    label,
    value,
}) {
    return (
        <div className="col-xl-3 col-md-6">

            <div
                className={`customer-stat-card ${className}`}
            >

                <div className="customer-stat-icon">
                    <i className={`bi ${icon}`}></i>
                </div>

                <div className="customer-stat-content">

                    <span className="customer-stat-label">
                        {label}
                    </span>

                    <strong className="customer-stat-value">
                        {value}
                    </strong>

                </div>

            </div>

        </div>
    );
}


/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
    label,
    value,
    icon,
}) {
    return (
        <div className="customer-info-row">

            <span className="customer-info-label">
                {label}
            </span>

            <span>

                {icon && (
                    <i
                        className={`bi ${icon} me-1`}
                    ></i>
                )}

                {value}

            </span>

        </div>
    );
}


/* =========================================================
   STATUS ITEM
========================================================= */

function StatusItem({
    icon,
    type,
    label,
    value,
}) {
    return (
        <div className="order-status-item">

            <span
                className={`order-status-icon ${type}`}
            >
                <i className={`bi ${icon}`}></i>
            </span>

            <div>

                <small>{label}</small>

                <strong>{value}</strong>

            </div>

        </div>
    );
}

export default CustomerDetail;