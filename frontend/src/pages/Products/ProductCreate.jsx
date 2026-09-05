import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const SIZE_CHOICES = [
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "XXXL",
    "XXXXL",
    "XXXXXL",
];

export default function ProductCreate() {
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);

    const [form, setForm] = useState({
        category: "",
        name: "",
        barcode: "",
        color: "",
        purchase_price: "",
        active: true,
    });

    const [sizes, setSizes] = useState([]);
    const [otherSize, setOtherSize] = useState("");

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const response = await api.get("product-categories/");

            setCategories(
                Array.isArray(response.data)
                    ? response.data
                    : response.data.results || []
            );
        } catch (error) {
            console.error("Failed to load categories:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const toggleSize = (size) => {
        setSizes((previous) =>
            previous.includes(size)
                ? previous.filter((item) => item !== size)
                : [...previous, size]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.category) {
            alert("Please select a category.");
            return;
        }

        if (!form.name.trim()) {
            alert("Product name is required.");
            return;
        }

        if (sizes.includes("OTHER") && !otherSize.trim()) {
            alert("Please enter the custom size.");
            return;
        }

        let finalSizes = [...sizes];

        if (otherSize.trim()) {
            finalSizes = finalSizes.filter(
                (size) => size !== "OTHER"
            );

            finalSizes.push(otherSize.trim());
        }

        try {
            setSaving(true);

            await api.post("products/", {
                ...form,
                name: form.name.trim(),
                barcode: form.barcode.trim() || null,
                available_sizes: finalSizes.join(","),
                purchase_price: form.purchase_price || 0,
            });

            navigate("/products");
        } catch (error) {
            console.error("Product creation failed:", error);

            alert(
                error.response?.data?.detail ||
                error.response?.data?.error ||
                JSON.stringify(error.response?.data) ||
                "Unable to create product."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>

            {/* Header */}
            <div className="card shadow border-0 rounded-4 mb-4">
                <div className="card-body">

                    <h2 className="fw-bold mb-1">
                        <i className="bi bi-box-seam me-2"></i>
                        Add Product
                    </h2>

                    <p className="text-muted mb-0">
                        Create a new product.
                    </p>

                </div>
            </div>

            <form onSubmit={handleSubmit}>

                <div className="card shadow border-0 rounded-4">
                    <div className="card-body">

                        <div className="row g-4">

                            {/* Category */}
                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Category
                                </label>

                                <select
                                    name="category"
                                    className="form-select"
                                    value={form.category}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">
                                        Select Category
                                    </option>

                                    {categories.map((category) => (
                                        <option
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {category.name}
                                        </option>
                                    ))}
                                </select>

                            </div>

                            {/* Product Name */}
                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Product Name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    className="form-control"
                                    placeholder="Product Name"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            {/* Barcode */}
                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Barcode
                                </label>

                                <input
                                    type="text"
                                    name="barcode"
                                    className="form-control"
                                    placeholder="Barcode (Optional)"
                                    value={form.barcode}
                                    onChange={handleChange}
                                />

                            </div>

                            {/* Color */}
                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Color
                                </label>

                                <input
                                    type="text"
                                    name="color"
                                    className="form-control"
                                    placeholder="Color (Optional)"
                                    value={form.color}
                                    onChange={handleChange}
                                />

                            </div>

                            {/* Sizes */}
                            <div className="col-12">

                                <label className="form-label fw-semibold">
                                    Available Sizes
                                </label>

                                <div className="d-flex flex-wrap gap-3">

                                    {SIZE_CHOICES.map((size) => (
                                        <div
                                            className="form-check"
                                            key={size}
                                        >
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={sizes.includes(size)}
                                                onChange={() =>
                                                    toggleSize(size)
                                                }
                                            />

                                            <label className="form-check-label">
                                                {size}
                                            </label>
                                        </div>
                                    ))}

                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={sizes.includes("OTHER")}
                                            onChange={() =>
                                                toggleSize("OTHER")
                                            }
                                        />

                                        <label className="form-check-label">
                                            Other
                                        </label>
                                    </div>

                                </div>

                            </div>

                            {/* Other Size */}
                            {sizes.includes("OTHER") && (
                                <div className="col-md-6">

                                    <label className="form-label fw-semibold">
                                        Custom Size
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter custom size"
                                        value={otherSize}
                                        onChange={(e) =>
                                            setOtherSize(e.target.value)
                                        }
                                    />

                                </div>
                            )}

                            {/* Purchase Price */}
                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Purchase Price
                                </label>

                                <input
                                    type="number"
                                    name="purchase_price"
                                    className="form-control"
                                    step="0.01"
                                    min="0"
                                    value={form.purchase_price}
                                    onChange={handleChange}
                                />

                            </div>

                            {/* Active */}
                            <div className="col-12">

                                <div className="form-check">

                                    <input
                                        type="checkbox"
                                        name="active"
                                        className="form-check-input"
                                        checked={form.active}
                                        onChange={handleChange}
                                    />

                                    <label className="form-check-label fw-semibold">
                                        Active
                                    </label>

                                </div>

                            </div>

                        </div>

                        <hr className="my-4" />

                        <div className="d-flex justify-content-end gap-2">

                            <button
                                type="button"
                                className="btn btn-light"
                                onClick={() => navigate("/products")}
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
                                        <i className="bi bi-check-lg me-2"></i>
                                        Save Product
                                    </>
                                )}
                            </button>

                        </div>

                    </div>
                </div>

            </form>

        </div>
    );
}