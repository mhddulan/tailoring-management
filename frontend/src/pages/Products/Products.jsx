import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function parseSizes(value) {
    if (!value) return [];

    if (Array.isArray(value)) {
        return value;
    }

    const text = String(value).trim();

    // Handles: ['S', 'M', 'L']
    if (text.startsWith("[") && text.endsWith("]")) {
        try {
            return JSON.parse(text.replace(/'/g, '"'));
        } catch {
            return text
                .slice(1, -1)
                .split(",")
                .map((x) => x.replace(/['"]/g, "").trim())
                .filter(Boolean);
        }
    }

    // Handles: S,M,L
    return text
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
}

export default function Products() {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    const loadProducts = async () => {
        try {
            setLoading(true);

            const response = await api.get("products/");

            setProducts(
                Array.isArray(response.data)
                    ? response.data
                    : response.data.results || []
            );
        } catch (error) {
            console.error("Failed to load products:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const filteredProducts = products.filter((product) => {
        const value = search.toLowerCase();

        return (
            product.name?.toLowerCase().includes(value) ||
            product.barcode?.toLowerCase().includes(value) ||
            product.category_name?.toLowerCase().includes(value)
        );
    });

    const deleteProduct = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this product?"
        );

        if (!confirmed) return;

        try {
            await api.delete(`products/${id}/`);
            loadProducts();
        } catch (error) {
            console.error("Delete failed:", error);
            alert(
                error.response?.data?.detail ||
                error.response?.data?.error ||
                "Unable to delete product."
            );
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="card shadow border-0 rounded-4 mb-4">
                <div className="card-body d-flex justify-content-between align-items-center">

                    <div>
                        <h2 className="fw-bold mb-1">
                            <i className="bi bi-box-seam me-2"></i>
                            Product Management
                        </h2>

                        <p className="text-muted mb-0">
                            Manage products, sizes, pricing and availability.
                        </p>
                    </div>

                    <button
                        className="btn btn-primary rounded-3"
                        onClick={() => navigate("/products/create")}
                    >
                        <i className="bi bi-plus-lg me-2"></i>
                        Add Product
                    </button>

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
                            placeholder="Search product name, barcode or category..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                </div>
            </div>

            {/* Product table */}
            <div className="card shadow border-0 rounded-4">
                <div className="card-body">

                    <div className="table-responsive">
                        <table className="table align-middle">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Barcode</th>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Sizes</th>
                                    <th>Color</th>
                                    <th>Purchase Price</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {loading ? (
                                    <tr>
                                        <td colSpan="9" className="text-center py-5">
                                            Loading products...
                                        </td>
                                    </tr>
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="text-center py-5 text-muted">
                                            No products found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product) => {

                                        const sizes = parseSizes(
                                            product.available_sizes
                                        );

                                        return (
                                            <tr key={product.id}>

                                                <td>{product.id}</td>

                                                <td>
                                                    {product.barcode || "—"}
                                                </td>

                                                <td>
                                                    <strong>
                                                        {product.name}
                                                    </strong>
                                                </td>

                                                <td>
                                                    {product.category_name || "—"}
                                                </td>

                                                <td>
                                                    {sizes.length > 0
                                                        ? sizes.join(", ")
                                                        : "—"}
                                                </td>

                                                <td>
                                                    {product.color || "—"}
                                                </td>

                                                <td>
                                                    ₹{" "}
                                                    {Number(
                                                        product.purchase_price || 0
                                                    ).toFixed(2)}
                                                </td>

                                                <td>
                                                    {product.active ? (
                                                        <span className="badge bg-success">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-secondary">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="text-end">

                                                    <button
                                                        className="btn btn-sm btn-outline-primary me-2"
                                                        onClick={() =>
                                                            navigate(
                                                                `/products/${product.id}/edit`
                                                            )
                                                        }
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>

                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() =>
                                                            deleteProduct(
                                                                product.id
                                                            )
                                                        }
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>

                                                </td>

                                            </tr>
                                        );
                                    })
                                )}

                            </tbody>

                        </table>
                    </div>

                </div>
            </div>
        </div>
    );
}