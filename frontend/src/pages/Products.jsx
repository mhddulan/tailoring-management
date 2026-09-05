import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Products.css";

function Products() {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingProduct, setDeletingProduct] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadProducts = async () => {
        try {
            setLoading(true);
            setError("");

            const fetchProducts = async () => {
                try {
                    const response = await api.get("products/");
                    setProducts(response.data.results || response.data || []);
                } catch (error) {
                    console.log("Products API not available yet.");
                    setProducts([]);
                }
            };
            
            setProducts(response.data.results || response.data);

        } catch (err) {
            console.error("PRODUCT ERROR:", err);

            if (err.response?.status === 401) {
                localStorage.clear();
                navigate("/login");
                return;
            }

            setError("Unable to load products.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const handleDeleteClick = (product) => {
        setDeletingProduct(product);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deletingProduct) return;
        try {
            setIsDeleting(true);
            await api.delete(`products/${deletingProduct.id}/`);
            setShowDeleteModal(false);
            setDeletingProduct(null);
            loadProducts();
        } catch (err) {
            console.error("Delete Error:", err);
            alert("Failed to delete product. It may be linked to existing sales.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="products-page">

            <div className="products-header">
                <div>
                    <h2>
                        <i className="bi bi-box-seam-fill"></i>
                        Products & Inventory
                    </h2>

                    <p>
                        Manage products, pricing and stock.
                    </p>
                </div>

                <button
                    className="products-add-btn"
                    onClick={() =>
                        alert("Product creation will be connected next.")
                    }
                >
                    <i className="bi bi-plus-lg"></i>
                    Add Product
                </button>
            </div>

            {error && (
                <div className="products-error">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    {error}
                </div>
            )}

            <div className="products-stats">

                <div className="product-stat">
                    <i className="bi bi-box"></i>
                    <div>
                        <span>Total Products</span>
                        <strong>{products.length}</strong>
                    </div>
                </div>

                <div className="product-stat">
                    <i className="bi bi-check-circle"></i>
                    <div>
                        <span>Available</span>
                        <strong>
                            {products.filter(
                                p =>
                                    Number(
                                        p.stock ||
                                        p.quantity ||
                                        0
                                    ) > 0
                            ).length}
                        </strong>
                    </div>
                </div>

                <div className="product-stat">
                    <i className="bi bi-exclamation-circle"></i>
                    <div>
                        <span>Low Stock</span>
                        <strong>
                            {products.filter(
                                p =>
                                    Number(
                                        p.stock ||
                                        p.quantity ||
                                        0
                                    ) > 0 &&
                                    Number(
                                        p.stock ||
                                        p.quantity ||
                                        0
                                    ) <= 5
                            ).length}
                        </strong>
                    </div>
                </div>

            </div>

            <div className="products-card">

                <div className="products-card-header">
                    <div>
                        <h5>Product List</h5>
                        <span>
                            {products.length} product
                            {products.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    <button
                        className="products-refresh-btn"
                        onClick={loadProducts}
                    >
                        <i className="bi bi-arrow-clockwise"></i>
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="products-loading">
                        <div className="spinner-border"></div>
                        <p>Loading products...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="products-empty">
                        <i className="bi bi-box-seam"></i>
                        <h5>No Products Found</h5>
                        <p>
                            Products will appear here once added.
                        </p>
                    </div>
                ) : (
                    <div className="products-table-wrapper">

                        <table className="products-table">

                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {products.map((product, index) => {

                                    const stock = Number(
                                        product.stock ||
                                        product.quantity ||
                                        0
                                    );

                                    return (
                                        <tr key={product.id}>

                                            <td>
                                                {index + 1}
                                            </td>

                                            <td>
                                                <div className="product-name">
                                                    <div className="product-icon">
                                                        <i className="bi bi-box"></i>
                                                    </div>

                                                    <strong>
                                                        {product.name ||
                                                            product.product_name ||
                                                            `Product #${product.id}`}
                                                    </strong>
                                                </div>
                                            </td>

                                            <td>
                                                {product.category_name ||
                                                    product.category ||
                                                    "-"}
                                            </td>

                                            <td>
                                                {Number(
                                                    product.price ||
                                                    product.selling_price ||
                                                    0
                                                ).toFixed(2)}
                                            </td>

                                            <td>
                                                {stock}
                                            </td>

                                            <td>
                                                <span
                                                    className={
                                                        stock <= 0
                                                            ? "stock-badge out"
                                                            : stock <= 5
                                                                ? "stock-badge low"
                                                                : "stock-badge available"
                                                    }
                                                >
                                                    {stock <= 0
                                                        ? "Out of Stock"
                                                        : stock <= 5
                                                            ? "Low Stock"
                                                            : "Available"}
                                                </span>
                                            </td>

                                            <td className="text-end">
                                                <button 
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDeleteClick(product)}
                                                    title="Delete Product"
                                                >
                                                    <i className="bi bi-trash-fill"></i>
                                                </button>
                                            </td>

                                        </tr>
                                    );
                                })}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

            {/* DELETE CONFIRMATION MODAL */}
            {showDeleteModal && deletingProduct && (
                <div className="modal-backdrop show" style={{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1040, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="modal-dialog m-0" style={{ minWidth: '400px' }}>
                        <div className="modal-content shadow">
                            <div className="modal-body text-center p-4">
                                <div className="stat-icon-wrapper stat-icon-danger mx-auto mb-3" style={{ width: '64px', height: '64px', fontSize: '2rem' }}>
                                    <i className="bi bi-box-seam-fill"></i>
                                </div>
                                <h4 className="fw-bold text-dark mb-2">Are you sure?</h4>
                                <p className="text-muted mb-4">
                                    You are about to delete product <strong>{deletingProduct.name || deletingProduct.product_name}</strong> (Barcode: <code>{deletingProduct.barcode || "-"}</code>). This action cannot be undone.
                                </p>
                                <div className="d-flex justify-content-center gap-2">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary px-4"
                                        onClick={() => setShowDeleteModal(false)}
                                        disabled={isDeleting}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn btn-danger px-4"
                                        onClick={confirmDelete}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <><span className="spinner-border spinner-border-sm me-2"></span>Deleting...</>
                                        ) : (
                                            <><i className="bi bi-trash-fill me-1"></i> Yes, Delete Product</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Products;