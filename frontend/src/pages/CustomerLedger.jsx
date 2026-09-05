import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./CustomerLedger.css";

function CustomerLedger() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [customer, setCustomer] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadLedger();
    }, [id]);

    const loadLedger = async () => {
        try {
            setLoading(true);
            setError("");

            const customerResponse = await api.get(
                `customers/${id}/`
            );

            setCustomer(customerResponse.data);

            const ordersResponse = await api.get(
                `orders/?customer=${id}`
            );

            const data = ordersResponse.data;

            if (Array.isArray(data)) {
                setOrders(data);
            } else if (Array.isArray(data.results)) {
                setOrders(data.results);
            } else {
                setOrders([]);
            }

        } catch (err) {
            console.error("Ledger loading error:", err);

            setError(
                err.response?.data?.detail ||
                "Unable to load customer ledger."
            );
        } finally {
            setLoading(false);
        }
    };

    const money = (value) =>
        `SAR ${Number(value || 0).toFixed(2)}`;

    const getTotal = (order) =>
        Number(order.total_amount || 0);

    const getReceived = (order) =>
        Number(
            order.total_received ??
            order.paid_amount ??
            order.paid ??
            0
        );

    const getAdvance = (order) =>
        Number(
            order.advance ??
            order.advance_amount ??
            0
        );

    const getBalance = (order) => {
        if (
            order.balance !== undefined &&
            order.balance !== null
        ) {
            return Number(order.balance);
        }

        return Math.max(
            getTotal(order) - getReceived(order),
            0
        );
    };

    const totalOrders = orders.length;

    const totalBill = orders.reduce(
        (sum, order) =>
            sum + getTotal(order),
        0
    );

    const totalReceived = orders.reduce(
        (sum, order) =>
            sum + getReceived(order),
        0
    );

    const outstanding = Math.max(
        totalBill - totalReceived,
        0
    );

    const totalAdvance = orders.reduce(
        (sum, order) =>
            sum + getAdvance(order),
        0
    );

    const statusClass = (status) => {
        switch (
            String(status || "").toLowerCase()
        ) {
            case "pending":
                return "pending";

            case "cutting":
                return "cutting";

            case "stitching":
                return "stitching";

            case "ready":
                return "ready";

            case "delivery":
                return "delivery";

            case "delivered":
                return "delivered";

            default:
                return "";
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="customer-ledger-page">

                <div className="ledger-loading">

                    <div
                        className="spinner-border text-primary"
                        role="status"
                    ></div>

                    <p>
                        Loading customer ledger...
                    </p>

                </div>

            </div>
        );
    }

    if (error) {
        return (
            <div className="customer-ledger-page">

                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </div>

                <button
                    className="btn btn-secondary"
                    onClick={() =>
                        navigate(`/customers/${id}`)
                    }
                >
                    <i className="bi bi-arrow-left me-1"></i>
                    Back to Customer
                </button>

            </div>
        );
    }

    if (!customer) {
        return null;
    }

    return (
        <div className="customer-ledger-page">

            {/* HEADER */}

            <div className="page-header-block ledger-header">

                <div>

                    <h2 className="page-header-title">
                        Customer Ledger
                    </h2>

                    <p className="page-header-sub">
                        {customer.name}
                        {" • "}
                        {customer.mobile || "-"}
                        {" • "}
                        {customer.branch_name ||
                            customer.branch ||
                            "-"}
                    </p>

                </div>

                <div className="ledger-header-actions">

                    <button
                        type="button"
                        className="btn btn-secondary ledger-hide-print"
                        onClick={() =>
                            navigate(
                                `/customers/${id}`
                            )
                        }
                    >
                        <i className="bi bi-person me-1"></i>
                        Customer Profile
                    </button>

                    <button
                        type="button"
                        className="btn btn-outline-primary ledger-hide-print"
                        onClick={handlePrint}
                    >
                        <i className="bi bi-printer me-1"></i>
                        Print
                    </button>

                </div>

            </div>


            {/* STATISTICS */}

            <div className="row g-3 mb-4">

                <LedgerStat
                    className="ledger-stat-blue"
                    icon="bi-receipt-cutoff"
                    label="Total Orders"
                    value={totalOrders}
                />

                <LedgerStat
                    className="ledger-stat-orange"
                    icon="bi-cash-coin"
                    label="Total Bill"
                    value={money(totalBill)}
                />

                <LedgerStat
                    className="ledger-stat-green"
                    icon="bi-wallet-fill"
                    label="Total Received"
                    value={money(totalReceived)}
                />

                <LedgerStat
                    className="ledger-stat-red"
                    icon="bi-exclamation-circle-fill"
                    label="Outstanding Balance"
                    value={money(outstanding)}
                />

            </div>


            {/* CUSTOMER INFORMATION */}

            <div className="ledger-card mb-4">

                <div className="ledger-card-header">

                    <span>
                        <i className="bi bi-person-vcard-fill"></i>
                        Customer Information
                    </span>

                </div>

                <div className="ledger-card-body">

                    <div className="row g-3">

                        <div className="col-md-4">

                            <div className="ledger-info-label">
                                Customer
                            </div>

                            <div className="ledger-info-value">
                                {customer.name}
                            </div>

                        </div>

                        <div className="col-md-4">

                            <div className="ledger-info-label">
                                Mobile
                            </div>

                            <div className="ledger-info-value">

                                <i className="bi bi-telephone me-1"></i>

                                {customer.mobile || "-"}

                            </div>

                        </div>

                        <div className="col-md-4">

                            <div className="ledger-info-label">
                                Branch
                            </div>

                            <div className="ledger-info-value">

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

            </div>


            {/* ORDER LEDGER */}

            <div className="ledger-card mb-4">

                <div className="ledger-card-header">

                    <span>
                        <i className="bi bi-journal-text"></i>
                        Order Ledger
                    </span>

                </div>

                <div className="table-responsive">

                    <table className="table app-table ledger-table">

                        <thead>

                            <tr>
                                <th>Order</th>
                                <th>Date</th>
                                <th>Items</th>
                                <th>Status</th>
                                <th className="text-end">
                                    Bill
                                </th>
                                <th className="text-end">
                                    Advance
                                </th>
                                <th className="text-end">
                                    Received
                                </th>
                                <th className="text-end">
                                    Balance
                                </th>
                            </tr>

                        </thead>

                        <tbody>

                            {orders.length > 0 ? (

                                orders.map((order) => (

                                    <tr key={order.id}>

                                        <td className="fw-bold">
                                            #{order.id}
                                        </td>

                                        <td>
                                            {order.order_date ||
                                                "-"}
                                        </td>

                                        <td>
                                            {order.items_count ??
                                                order.items?.length ??
                                                0}
                                        </td>

                                        <td>

                                            <span
                                                className={`ledger-status ${statusClass(
                                                    order.status
                                                )}`}
                                            >
                                                {order.status ||
                                                    "-"}
                                            </span>

                                        </td>

                                        <td className="text-end fw-semibold">
                                            {money(
                                                getTotal(order)
                                            )}
                                        </td>

                                        <td className="text-end">
                                            {money(
                                                getAdvance(order)
                                            )}
                                        </td>

                                        <td className="text-end text-success fw-semibold">
                                            {money(
                                                getReceived(order)
                                            )}
                                        </td>

                                        <td className="text-end text-danger fw-semibold">
                                            {money(
                                                getBalance(order)
                                            )}
                                        </td>

                                    </tr>

                                ))

                            ) : (

                                <tr>

                                    <td
                                        colSpan="8"
                                        className="text-center py-5 text-muted"
                                    >

                                        <i className="bi bi-journal-x fs-1 d-block mb-2"></i>

                                        <strong>
                                            No ledger entries found.
                                        </strong>

                                        <div className="small mt-1">
                                            Orders and payment
                                            history will appear here.
                                        </div>

                                    </td>

                                </tr>

                            )}

                        </tbody>


                        {orders.length > 0 && (

                            <tfoot>

                                <tr className="ledger-total-row">

                                    <th colSpan="4">
                                        Total
                                    </th>

                                    <th className="text-end">
                                        {money(totalBill)}
                                    </th>

                                    <th className="text-end">
                                        {money(totalAdvance)}
                                    </th>

                                    <th className="text-end text-success">
                                        {money(totalReceived)}
                                    </th>

                                    <th className="text-end text-danger">
                                        {money(outstanding)}
                                    </th>

                                </tr>

                            </tfoot>

                        )}

                    </table>

                </div>

            </div>


            {/* FOOTER */}

            <div className="customer-ledger-footer ledger-hide-print">

                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                        navigate(`/customers/${id}`)
                    }
                >
                    <i className="bi bi-arrow-left me-1"></i>
                    Back to Customer
                </button>

                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() =>
                        navigate(
                            `/orders/create?customer=${id}`
                        )
                    }
                >
                    <i className="bi bi-plus-circle me-1"></i>
                    New Order
                </button>

            </div>

        </div>
    );
}


/* =========================================================
   STAT CARD
========================================================= */

function LedgerStat({
    className,
    icon,
    label,
    value,
}) {
    return (
        <div className="col-xl-3 col-md-6">

            <div
                className={`ledger-stat-card ${className}`}
            >

                <div className="ledger-stat-icon">
                    <i className={`bi ${icon}`}></i>
                </div>

                <div>

                    <span>{label}</span>

                    <strong>{value}</strong>

                </div>

            </div>

        </div>
    );
}

export default CustomerLedger;