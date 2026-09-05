import { useEffect, useState } from "react";
import api from "../../services/api";

export default function BranchStock() {
    const [stock, setStock] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    const loadStock = async () => {
        try {
            setLoading(true);

            const response = await api.get("branch-products/");

            const data = Array.isArray(response.data)
                ? response.data
                : response.data.results || [];

            setStock(data);
        } catch (error) {
            console.error("Failed to load branch stock:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStock();
    }, []);

    const filteredStock = stock.filter((item) => {
        const searchText = search.toLowerCase();

        return (
            item.product_name?.toLowerCase().includes(searchText) ||
            item.barcode?.toLowerCase().includes(searchText) ||
            item.category_name?.toLowerCase().includes(searchText)
        );
    });

    return (
        <div>

            {/* Header */}
            <div className="card shadow border-0 rounded-4 mb-4">
                <div className="card-body">

                    <h2 className="fw-bold mb-1">
                        <i className="bi bi-boxes me-2"></i>
                        Branch Stock Inventory
                    </h2>

                    <p className="text-muted mb-0">
                        View branch-wise product stock and selling prices.
                    </p>

                </div>
            </div>

            {/* Search */}
            <div className="card shadow border-0 rounded-4 mb-4">
                <div className="card-body">

                    <div className="input-group">
                        <span className="input-group-text bg-white">
                            <i className="bi bi-search"></i>
                        </span>

                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search product name or barcode..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />
                    </div>

                </div>
            </div>

            {/* Stock Table */}
            <div className="card shadow border-0 rounded-4">

                <div className="card-body">

                    <div className="table-responsive">

                        <table className="table align-middle">

                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th>Barcode</th>
                                    <th>Current Stock</th>
                                    <th>Selling Price</th>
                                </tr>
                            </thead>

                            <tbody>

                                {loading ? (

                                    <tr>
                                        <td
                                            colSpan="4"
                                            className="text-center py-5"
                                        >
                                            Loading stock...
                                        </td>
                                    </tr>

                                ) : filteredStock.length === 0 ? (

                                    <tr>
                                        <td
                                            colSpan="4"
                                            className="text-center py-5 text-muted"
                                        >
                                            No stock found.
                                        </td>
                                    </tr>

                                ) : (

                                    filteredStock.map((item) => (

                                        <tr key={item.id}>

                                            <td>
                                                <strong>
                                                    {item.product_name || "—"}
                                                </strong>
                                            </td>

                                            <td>
                                                {item.barcode || "—"}
                                            </td>

                                            <td>
                                                <span
                                                    className={
                                                        item.stock <= 5
                                                            ? "badge bg-danger"
                                                            : item.stock <= 20
                                                            ? "badge bg-warning text-dark"
                                                            : "badge bg-success"
                                                    }
                                                >
                                                    {item.stock ?? 0}
                                                </span>
                                            </td>

                                            <td>
                                                ₹{" "}
                                                {Number(
                                                    item.selling_price || 0
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