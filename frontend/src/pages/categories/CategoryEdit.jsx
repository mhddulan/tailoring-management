import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

export default function CategoryEdit() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [name, setName] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadCategory = async () => {
            try {
                const response = await api.get(
                    `product-categories/${id}/`
                );

                setName(response.data.name || "");
            } catch (error) {
                console.error(error);
                setError("Unable to load category.");
            } finally {
                setLoading(false);
            }
        };

        loadCategory();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            setError("Category name is required.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            await api.put(`product-categories/${id}/`, {
                name: name.trim(),
            });

            navigate("/categories");
        } catch (error) {
            console.error(error);

            setError(
                error.response?.data?.name?.[0] ||
                error.response?.data?.detail ||
                "Unable to update category."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5 text-muted">
                Loading category...
            </div>
        );
    }

    return (
        <>
            <div className="page-header-block">
                <div>
                    <h2 className="page-header-title">
                        Edit Category
                    </h2>

                    <p className="page-header-sub">
                        Define ready-made product category names.
                    </p>
                </div>

                <div>
                    <button
                        className="btn btn-secondary"
                        onClick={() => navigate("/categories")}
                    >
                        <i className="bi bi-arrow-left"></i>
                        {" "}Back to Categories
                    </button>
                </div>
            </div>

            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="form-card">
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div className="alert alert-danger alert-custom mb-3">
                                    {error}
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="form-label">
                                    Category Name
                                </label>

                                <input
                                    type="text"
                                    className="form-control"
                                    value={name}
                                    onChange={(e) =>
                                        setName(e.target.value)
                                    }
                                />
                            </div>

                            <div className="d-flex justify-content-end gap-2">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() =>
                                        navigate("/categories")
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    <i className="bi bi-check-circle-fill me-1"></i>
                                    {saving
                                        ? "Updating..."
                                        : "Update Category"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}