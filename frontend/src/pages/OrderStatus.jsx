import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./OrderStatus.css";

function OrderStatus() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        loadOrder();
    }, [id]);

    const loadOrder = async () => {
        try {
            setLoading(true);

            const response = await api.get(
                `orders/${id}/`
            );

            setOrder(response.data);
            setStatus(
                response.data.status || "Pending"
            );

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!status) {
            setError("Please select a status.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            await api.patch(
                `orders/${id}/`,
                {
                    status,
                }
            );

            navigate(`/orders/${id}`);

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.detail ||
                err.response?.data?.error ||
                "Unable to update order status."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="order-status-loading">
                <div
                    className="spinner-border"
                    role="status"
                ></div>

                <p>Loading order...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="order-status-page">
                <div className="order-status-card">
                    <h3>Order not found</h3>

                    <button
                        className="btn btn-primary"
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

    return (
        <div className="order-status-page">

            {/* HEADER */}

            <div className="order-status-header">

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

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    `/orders/${id}`
                                )
                            }
                        >
                            Order #{id}
                        </button>

                        <i className="bi bi-chevron-right"></i>

                        <span>
                            Status
                        </span>

                    </div>

                    <h1>
                        Update Order Status
                    </h1>

                    <p>
                        Change the current production
                        status of this order.
                    </p>

                </div>

                <button
                    type="button"
                    className="btn btn-light"
                    onClick={() =>
                        navigate(
                            `/orders/${id}`
                        )
                    }
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to Order
                </button>

            </div>

            {/* ERROR */}

            {error && (
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </div>
            )}

            {/* ORDER INFO */}

            <div className="order-status-card">

                <div className="order-status-info">

                    <div>
                        <span>Order</span>
                        <strong>
                            #{order.id}
                        </strong>
                    </div>

                    <div>
                        <span>Customer</span>
                        <strong>
                            {order.customer_name || "-"}
                        </strong>
                    </div>

                    <div>
                        <span>Total</span>
                        <strong>
                            SAR{" "}
                            {Number(
                                order.total_amount || 0
                            ).toFixed(2)}
                        </strong>
                    </div>

                    <div>
                        <span>Balance</span>
                        <strong className="balance">
                            SAR{" "}
                            {Number(
                                order.balance_due || 0
                            ).toFixed(2)}
                        </strong>
                    </div>

                </div>

                <hr />

                <form onSubmit={handleSubmit}>

                    <label className="form-label">
                        Order Status
                    </label>

                    <select
                        className="form-select status-select"
                        value={status}
                        onChange={(e) =>
                            setStatus(
                                e.target.value
                            )
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

                    <div className="status-help">
                        <i className="bi bi-info-circle"></i>

                        <span>
                            Use <strong>Ready</strong> when
                            stitching is complete and
                            <strong> Delivery</strong> when
                            the order is prepared for
                            customer delivery.
                        </span>
                    </div>

                    <div className="order-status-actions">

                        <button
                            type="button"
                            className="btn btn-light"
                            onClick={() =>
                                navigate(
                                    `/orders/${id}`
                                )
                            }
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check-lg me-2"></i>
                                    Update Status
                                </>
                            )}
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}

export default OrderStatus;