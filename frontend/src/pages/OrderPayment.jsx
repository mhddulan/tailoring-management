import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./OrderPayment.css";

function OrderPayment() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [amount, setAmount] = useState("");
    const [paymentMode, setPaymentMode] = useState("Cash");
    const [paymentType, setPaymentType] = useState("Balance");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        loadOrder();
    }, [id]);

    const loadOrder = async () => {
        try {
            setLoading(true);

            const response = await api.get(`orders/${id}/`);
            setOrder(response.data);

            const balance =
                Number(response.data.balance_due ?? 0);

            setAmount(balance > 0 ? balance.toFixed(2) : "");
        } catch (err) {
            console.error(err);
            setError("Unable to load order.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const paymentAmount = Number(amount);
        const balance = Number(order?.balance_due ?? 0);

        if (!paymentAmount || paymentAmount <= 0) {
            setError("Enter a valid payment amount.");
            return;
        }

        if (paymentAmount > balance) {
            setError("Payment cannot exceed the remaining balance.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            await api.post("payments/", {
                order: Number(id),
                amount: paymentAmount,
                payment_mode: paymentMode,
                payment_type: paymentType,
            });

            navigate(`/orders/${id}`);
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.amount?.[0] ||
                err.response?.data?.detail ||
                "Unable to save payment."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="payment-page">
                <div className="payment-card">
                    Loading order...
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="payment-page">
                <div className="payment-card">
                    <h3>Order not found</h3>
                    <button
                        className="btn btn-secondary"
                        onClick={() => navigate("/orders")}
                    >
                        Back to Orders
                    </button>
                </div>
            </div>
        );
    }

    const total = Number(order.total_amount ?? 0);
    const received = Number(order.total_received ?? 0);
    const balance = Number(order.balance_due ?? 0);

    return (
        <div className="payment-page">

            <div className="payment-header">
                <div>
                    <h2>
                        <i className="bi bi-credit-card-fill"></i>{" "}
                        Add Payment
                    </h2>

                    <p>
                        Record a payment for Order #{order.id}
                    </p>
                </div>

                <button
                    className="btn btn-outline-secondary"
                    onClick={() => navigate(`/orders/${id}`)}
                >
                    <i className="bi bi-arrow-left"></i>
                    Back to Order
                </button>
            </div>

            <div className="payment-summary">

                <div className="summary-box">
                    <span>Customer</span>
                    <strong>
                        {order.customer_name || "-"}
                    </strong>
                </div>

                <div className="summary-box">
                    <span>Total Bill</span>
                    <strong>
                        SAR {total.toFixed(2)}
                    </strong>
                </div>

                <div className="summary-box">
                    <span>Received</span>
                    <strong>
                        SAR {received.toFixed(2)}
                    </strong>
                </div>

                <div className="summary-box">
                    <span>Balance Due</span>
                    <strong className="balance">
                        SAR {balance.toFixed(2)}
                    </strong>
                </div>

            </div>

            <div className="payment-card">

                <h4>
                    <i className="bi bi-wallet2"></i>
                    Payment Details
                </h4>

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                {balance <= 0 ? (
                    <div className="payment-complete">
                        <i className="bi bi-check-circle-fill"></i>

                        <h4>Payment Complete</h4>

                        <p>
                            This order has no outstanding balance.
                        </p>

                        <button
                            className="btn btn-primary"
                            onClick={() =>
                                navigate(`/orders/${id}`)
                            }
                        >
                            Back to Order
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>

                        <div className="row g-3">

                            <div className="col-md-6">
                                <label className="form-label">
                                    Payment Amount
                                </label>

                                <div className="input-group">
                                    <span className="input-group-text">
                                        SAR
                                    </span>

                                    <input
                                        type="number"
                                        className="form-control"
                                        min="0.01"
                                        max={balance}
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) =>
                                            setAmount(e.target.value)
                                        }
                                        required
                                    />
                                </div>

                                <small className="text-muted">
                                    Maximum: SAR{" "}
                                    {balance.toFixed(2)}
                                </small>
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">
                                    Payment Mode
                                </label>

                                <select
                                    className="form-select"
                                    value={paymentMode}
                                    onChange={(e) =>
                                        setPaymentMode(e.target.value)
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
                                </select>
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">
                                    Payment Type
                                </label>

                                <select
                                    className="form-select"
                                    value={paymentType}
                                    onChange={(e) =>
                                        setPaymentType(e.target.value)
                                    }
                                >
                                    <option value="Balance">
                                        Balance
                                    </option>

                                    <option value="Advance">
                                        Advance
                                    </option>
                                </select>
                            </div>

                        </div>

                        <div className="payment-actions">

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() =>
                                    navigate(`/orders/${id}`)
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}
                            >
                                {saving ? (
                                    "Saving..."
                                ) : (
                                    <>
                                        <i className="bi bi-check-lg"></i>
                                        Save Payment
                                    </>
                                )}
                            </button>

                        </div>

                    </form>
                )}

            </div>

        </div>
    );
}

export default OrderPayment;