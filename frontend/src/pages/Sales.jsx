import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Sales.css";

function Sales() {
    const navigate = useNavigate();

    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =========================================================
    // LOAD SALES
    // =========================================================

    useEffect(() => {
        loadSales();
    }, []);

    const loadSales = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("sales/");
            const data = response.data;

            setSales(
                Array.isArray(data)
                    ? data
                    : data.results || []
            );

        } catch (err) {
            console.error("Sales loading error:", err);

            setError(
                err.response?.data?.detail ||
                "Unable to load sales."
            );
        } finally {
            setLoading(false);
        }
    };


    return (
        <div>

            {/* =====================================================
                PAGE HEADER
            ====================================================== */}

            <div className="page-header-block">

                <div>
                    <h2 className="page-header-title">
                        Ready-Made Product Sales
                    </h2>

                    <p className="page-header-sub">
                        View POS sales transactions for ready-made
                        apparel across branches.
                    </p>
                </div>

                <div>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => navigate("/sales/create")}
                    >
                        <i className="bi bi-cart-plus-fill me-1"></i>
                        New Sale Transaction
                    </button>
                </div>

            </div>


            {/* ERROR */}

            {error && (
                <div className="alert alert-danger mb-3">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </div>
            )}


            {/* =====================================================
                TABLE CARD
            ====================================================== */}

            <div className="table-card">

                <div className="table-card-header">
                    <h5 className="fw-bold mb-0 text-dark">
                        <i className="bi bi-receipt-cutoff text-primary me-2"></i>
                        Sales History
                    </h5>
                </div>

                <div className="table-responsive">

                    <table className="table app-table">

                        <thead>
                            <tr>
                                <th width="80">Sale ID</th>
                                <th>Date</th>
                                <th>Branch</th>
                                <th>Customer</th>
                                <th>Payment Mode</th>
                                <th>Total Amount</th>
                                <th>Items Purchased</th>
                            </tr>
                        </thead>

                        <tbody>

                            {/* LOADING */}

                            {loading && (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="text-center py-4"
                                    >
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Loading sales...
                                    </td>
                                </tr>
                            )}

                            {/* ROWS */}

                            {!loading && sales.map((sale) => (
                                <tr key={sale.id}>

                                    {/* SALE ID */}
                                    <td className="fw-bold text-primary">
                                        #{sale.id}
                                    </td>

                                    {/* DATE */}
                                    <td>
                                        <i className="bi bi-calendar-event me-1 text-muted"></i>
                                        {sale.sale_date}
                                    </td>

                                    {/* BRANCH */}
                                    <td>
                                        <span className="badge bg-light text-dark border">
                                            <i className="bi bi-building me-1"></i>
                                            {sale.branch_name}
                                        </span>
                                    </td>

                                    {/* CUSTOMER */}
                                    <td>
                                        {sale.customer_name ? (
                                            <strong className="text-dark">
                                                <i className="bi bi-person me-1"></i>
                                                {sale.customer_name}
                                            </strong>
                                        ) : (
                                            <span className="text-muted">
                                                <i className="bi bi-person-fill-gear me-1"></i>
                                                Walk-in Customer
                                            </span>
                                        )}
                                    </td>

                                    {/* PAYMENT MODE */}
                                    <td>
                                        <span className="badge bg-light text-dark border">
                                            <i className="bi bi-wallet2 me-1"></i>
                                            {sale.payment_mode}
                                        </span>
                                    </td>

                                    {/* TOTAL */}
                                    <td className="fw-bold text-success fs-6">
                                        SAR {Number(sale.total).toFixed(2)}
                                    </td>

                                    {/* ITEMS */}
                                    <td>
                                        {sale.items && sale.items.length > 0 ? (
                                            sale.items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="fs-7 text-dark fw-semibold"
                                                >
                                                    &bull; {item.product_name}{" "}
                                                    <span className="badge bg-primary-subtle text-primary">
                                                        &times; {item.quantity}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-muted fs-7">
                                                No items
                                            </span>
                                        )}
                                    </td>

                                </tr>
                            ))}

                            {/* EMPTY STATE */}

                            {!loading && sales.length === 0 && !error && (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="text-center py-4 text-muted"
                                    >
                                        No ready-made sales found. Click{" "}
                                        <strong>New Sale Transaction</strong>{" "}
                                        to record a sale.
                                    </td>
                                </tr>
                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}

export default Sales;