import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./OrderDelivery.css";

function OrderDelivery() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [amount, setAmount] = useState("");
    const [paymentMode, setPaymentMode] = useState("Cash");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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

            const balance = Number(
                response.data.balance_due || 0
            );

            setAmount(balance.toFixed(2));

        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.detail ||
                "Unable to load order."
            );
        } finally {
            setLoading(false);
        }
    };

    const total = Number(order?.total_amount || 0);
    const received = Number(order?.total_received || 0);

    const balance = Math.max(
        total - received,
        0
    );

    const paymentAmount = Number(amount || 0);

    const remainingAfterPayment = Math.max(
        balance - paymentAmount,
        0
    );

    const handleDeliver = async (e) => {
        e.preventDefault();

        setError("");

        if (paymentAmount < 0) {
            setError(
                "Payment amount cannot be negative."
            );
            return;
        }

        if (paymentAmount > balance) {
            setError(
                `Payment cannot exceed the balance of SAR ${balance.toFixed(2)}.`
            );
            return;
        }

        try {
            setSaving(true);

            await api.post(
                `orders/${id}/deliver/`,
                {
                    amount: paymentAmount,
                    payment_mode: paymentMode,
                }
            );

            navigate(`/orders/${id}`);

        } catch (err) {
            console.error(err);

            const data = err.response?.data;

            setError(
                data?.error ||
                data?.detail ||
                data?.amount?.[0] ||
                "Unable to deliver order."
            );

        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="order-delivery-page">
                <div className="delivery-card">
                    <div className="delivery-loading">
                        Loading order...
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="order-delivery-page">
                <div className="delivery-card">
                    <div className="delivery-error">
                        {error || "Order not found."}
                    </div>

                    <button
                        className="btn-secondary"
                        onClick={() =>
                            navigate("/orders")
                        }
                    >
                        Back to Orders
                    </button>
                </div>
            </div>
        );
    }

    const allowedStatuses = [
        "Ready",
        "Delivery",
    ];

    const canDeliver =
        allowedStatuses.includes(order.status);

    return (
        <div className="order-delivery-page">

            {/* Header */}
            <div className="delivery-header">

                <div>
                    <h1>
                        <i className="bi bi-truck"></i>
                        Deliver Order
                    </h1>

                    <p>
                        Complete payment and deliver the
                        customer order.
                    </p>
                </div>

                <button
                    className="btn-secondary"
                    onClick={() =>
                        navigate(`/orders/${id}`)
                    }
                >
                    <i className="bi bi-arrow-left"></i>
                    Back to Order
                </button>

            </div>


            {/* Error */}
            {error && (
                <div className="delivery-alert">
                    <i className="bi bi-exclamation-triangle"></i>
                    {error}
                </div>
            )}


            {!canDeliver ? (
                <div className="delivery-card">

                    <div className="status-warning">
                        <i className="bi bi-info-circle"></i>

                        <div>
                            <h3>
                                Order cannot be delivered
                            </h3>

                            <p>
                                Only orders with status
                                <strong> Ready </strong>
                                or
                                <strong> Delivery </strong>
                                can be delivered.
                            </p>

                            <p>
                                Current status:
                                <strong>
                                    {" "}{order.status}
                                </strong>
                            </p>
                        </div>
                    </div>

                    <button
                        className="btn-primary"
                        onClick={() =>
                            navigate(
                                `/orders/${id}/status`
                            )
                        }
                    >
                        Update Order Status
                    </button>

                </div>
            ) : (

                <div className="delivery-grid">

                    {/* Order Information */}
                    <div className="delivery-card">

                        <div className="card-title">
                            <i className="bi bi-receipt"></i>
                            Order Information
                        </div>

                        <div className="info-grid">

                            <div className="info-item">
                                <span>
                                    Order Number
                                </span>

                                <strong>
                                    #{order.id}
                                </strong>
                            </div>

                            <div className="info-item">
                                <span>
                                    Customer
                                </span>

                                <strong>
                                    {order.customer_name ||
                                        "—"}
                                </strong>
                            </div>

                            <div className="info-item">
                                <span>
                                    Order Date
                                </span>

                                <strong>
                                    {order.order_date ||
                                        "—"}
                                </strong>
                            </div>

                            <div className="info-item">
                                <span>
                                    Delivery Date
                                </span>

                                <strong>
                                    {order.delivery_date ||
                                        "—"}
                                </strong>
                            </div>

                            <div className="info-item">
                                <span>
                                    Status
                                </span>

                                <span className="status-badge">
                                    {order.status}
                                </span>
                            </div>

                        </div>

                    </div>


                    {/* Payment */}
                    <div className="delivery-card">

                        <div className="card-title">
                            <i className="bi bi-credit-card"></i>
                            Final Payment
                        </div>

                        <form
                            onSubmit={handleDeliver}
                        >

                            <div className="amount-summary">

                                <div>
                                    <span>
                                        Total Bill
                                    </span>

                                    <strong>
                                        SAR{" "}
                                        {total.toFixed(2)}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Already Received
                                    </span>

                                    <strong>
                                        SAR{" "}
                                        {received.toFixed(2)}
                                    </strong>
                                </div>

                                <div className="balance-row">
                                    <span>
                                        Balance Due
                                    </span>

                                    <strong>
                                        SAR{" "}
                                        {balance.toFixed(2)}
                                    </strong>
                                </div>

                            </div>


                            <div className="form-group">

                                <label>
                                    Payment Amount
                                </label>

                                <div className="amount-input">

                                    <span>
                                        SAR
                                    </span>

                                    <input
                                        type="number"
                                        min="0"
                                        max={balance}
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) =>
                                            setAmount(
                                                e.target.value
                                            )
                                        }
                                    />

                                </div>

                            </div>


                            <div className="form-group">

                                <label>
                                    Payment Mode
                                </label>

                                <select
                                    value={paymentMode}
                                    onChange={(e) =>
                                        setPaymentMode(
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="Cash">
                                        Cash
                                    </option>

                                    <option value="Bank">
                                        Bank
                                    </option>

                                    <option value="Online">
                                        Online
                                    </option>

                                    <option value="Cheque">
                                        Cheque
                                    </option>

                                    <option value="POS">
                                        POS
                                    </option>
                                </select>

                            </div>


                            <div className="remaining-box">

                                <span>
                                    Remaining After Payment
                                </span>

                                <strong>
                                    SAR{" "}
                                    {remainingAfterPayment.toFixed(
                                        2
                                    )}
                                </strong>

                            </div>


                            <div className="delivery-actions">

                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() =>
                                        navigate(
                                            `/orders/${id}`
                                        )
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="btn-deliver"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <span className="spinner"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-truck"></i>
                                            Receive Payment &
                                            Deliver
                                        </>
                                    )}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </div>
    );
}

export default OrderDelivery;