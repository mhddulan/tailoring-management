import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function CategoryCreate() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            setError("Category name is required.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            await api.post("product-categories/", {
                name: name.trim(),
            });

            navigate("/categories");
        } catch (error) {
            console.error(error);

            setError(
                error.response?.data?.name?.[0] ||
                error.response?.data?.detail ||
                "Unable to create category."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="page-header-block">
                <div>
                    <h2 className="page-header-title">
                        Add Category
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
                                    placeholder="Category Name"
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
                                        ? "Saving..."
                                        : "Save Category"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}