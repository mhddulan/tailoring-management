import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function Sales() {
    const navigate = useNavigate();

    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSales();
    }, []);

    const loadSales = async () => {
        try {
            setLoading(true);

            const response = await api.get("sales/");

            const data = Array.isArray(response.data)
                ? response.data
                : response.data.results || [];

            setSales(data);
        } catch (error) {
            console.error("Failed to load sales:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>

            {/* Header */}
            <div className="card shadow border-0 rounded-4 mb-4">
                <div className="card-body d-flex justify-content-between align-items-center">

                    <div>
                        <h2 className="fw-bold mb-1">
                            <i className="bi bi-cart-check me-2"></i>
                            Sales Management
                        </h2>

                        <p className="text-muted mb-0">
                            Manage ready-made product sales.
                        </p>
                    </div>

                    <button
                        className="btn btn-primary rounded-3"
                        onClick={() => navigate("/sales/create")}
                    >
                        <i className="bi bi-plus-lg me-2"></i>
                        New Sale
                    </button>

                </div>
            </div>

            {/* Sales table */}
            <div className="card shadow border-0 rounded-4">

                <div className="card-body">

                    <div className="table-responsive">

                        <table className="table align-middle">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Date</th>
                                    <th>Branch</th>
                                    <th>Customer</th>
                                    <th>Payment Mode</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                </tr>
                            </thead>

                            <tbody>

                                {loading ? (

                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="text-center py-5"
                                        >
                                            Loading sales...
                                        </td>
                                    </tr>

                                ) : sales.length === 0 ? (

                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="text-center py-5 text-muted"
                                        >
                                            No sales found.
                                        </td>
                                    </tr>

                                ) : (

                                    sales.map((sale) => (

                                        <tr key={sale.id}>

                                            <td>
                                                #{sale.id}
                                            </td>

                                            <td>
                                                {sale.sale_date}
                                            </td>

                                            <td>
                                                {sale.branch_name || "—"}
                                            </td>

                                            <td>
                                                {sale.customer_name || "Walk-in Customer"}
                                            </td>

                                            <td>
                                                <span className="badge bg-light text-dark">
                                                    {sale.payment_mode}
                                                </span>
                                            </td>

                                            <td>
                                                {sale.items?.length || 0}
                                            </td>

                                            <td className="fw-bold">
                                                ₹{" "}
                                                {Number(
                                                    sale.total || 0
                                                ).toFixed(2)}
                                            </td>

                                        </tr>

                                    ))

                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        </div>
    );
}