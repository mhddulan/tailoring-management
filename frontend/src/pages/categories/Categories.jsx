import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function Categories() {
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadCategories = async () => {
        try {
            const response = await api.get("product-categories/");
            setCategories(response.data);
        } catch (error) {
            console.error("Failed to load categories:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const handleDelete = async (id, name) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete category "${name}"?`
        );

        if (!confirmed) return;

        try {
            await api.delete(`product-categories/${id}/`);
            loadCategories();
        } catch (error) {
            console.error("Failed to delete category:", error);

            alert(
                error.response?.data?.detail ||
                "Unable to delete category."
            );
        }
    };

    return (
        <>
            <div className="page-header-block">
                <div>
                    <h2 className="page-header-title">
                        Product Categories
                    </h2>

                    <p className="page-header-sub">
                        Manage product category classifications for
                        ready-made items.
                    </p>
                </div>

                <div>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate("/categories/create")}
                    >
                        <i className="bi bi-plus-lg me-1"></i>
                        Add Category
                    </button>
                </div>
            </div>

            <div className="table-card">
                <div className="table-card-header">
                    <h5 className="fw-bold mb-0 text-dark">
                        <i className="bi bi-tags-fill text-primary me-2"></i>
                        Categories Catalog
                    </h5>
                </div>

                <div className="table-responsive">
                    <table className="table app-table">
                        <thead>
                            <tr>
                                <th width="100">ID</th>
                                <th>Category Name</th>
                                <th>Associated Products</th>
                                <th width="150" className="text-end">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="4"
                                        className="text-center py-4 text-muted"
                                    >
                                        Loading categories...
                                    </td>
                                </tr>
                            ) : categories.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="4"
                                        className="text-center py-4 text-muted"
                                    >
                                        No categories found. Create your
                                        first product category.
                                    </td>
                                </tr>
                            ) : (
                                categories.map((category) => (
                                    <tr key={category.id}>
                                        <td className="fw-semibold text-muted">
                                            #{category.id}
                                        </td>

                                        <td className="fw-bold text-dark">
                                            <i className="bi bi-tag me-2 text-primary"></i>
                                            {category.name}
                                        </td>

                                        <td>
                                            <span className="badge bg-info-subtle text-info border border-info-subtle fw-bold">
                                                —
                                            </span>
                                        </td>

                                        <td className="text-end">
                                            <button
                                                className="btn btn-sm btn-secondary btn-icon-only me-1"
                                                title="Edit Category"
                                                onClick={() =>
                                                    navigate(
                                                        `/categories/${category.id}/edit`
                                                    )
                                                }
                                            >
                                                <i className="bi bi-pencil"></i>
                                            </button>

                                            <button
                                                className="btn btn-sm btn-outline-danger btn-icon-only"
                                                title="Delete Category"
                                                onClick={() =>
                                                    handleDelete(
                                                        category.id,
                                                        category.name
                                                    )
                                                }
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}