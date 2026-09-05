import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

function parseSizes(value) {
    if (!value) return [];

    if (Array.isArray(value)) return value;

    const text = String(value).trim();

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

    return text
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
}

export default function ProductEdit() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);

            const [productResponse, categoryResponse] =
                await Promise.all([
                    api.get(`products/${id}/`),
                    api.get("product-categories/"),
                ]);

            const product = productResponse.data;

            setCategories(
                Array.isArray(categoryResponse.data)
                    ? categoryResponse.data
                    : categoryResponse.data.results || []
            );

            const productSizes = parseSizes(
                product.available_sizes
            );

            const normalSizes = productSizes.filter(
                (size) => SIZE_CHOICES.includes(size)
            );

            const customSizes = productSizes.filter(
                (size) => !SIZE_CHOICES.includes(size)
            );

            setSizes(
                customSizes.length > 0
                    ? [...normalSizes, "OTHER"]
                    : normalSizes
            );

            setOtherSize(
                customSizes.length > 0
                    ? customSizes.join(", ")
                    : ""
            );

            setForm({
                category: product.category || "",
                name: product.name || "",
                barcode: product.barcode || "",
                color: product.color || "",
                purchase_price: product.purchase_price ?? "",
                active: product.active ?? true,
            });

        } catch (error) {
            console.error("Failed to load product:", error);
            alert("Unable to load product.");
        } finally {
            setLoading(false);
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

        finalSizes = finalSizes.filter(
            (size) => size !== "OTHER"
        );

        if (sizes.includes("OTHER") && otherSize.trim()) {
            finalSizes.push(otherSize.trim());
        }

        try {
            setSaving(true);

            await api.put(`products/${id}/`, {
                ...form,
                name: form.name.trim(),
                barcode: form.barcode.trim() || null,
                available_sizes: finalSizes.join(","),
                purchase_price: form.purchase_price || 0,
            });

            navigate("/products");
        } catch (error) {
            console.error("Product update failed:", error);

            alert(
                error.response?.data?.detail ||
                error.response?.data?.error ||
                JSON.stringify(error.response?.data) ||
                "Unable to update product."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="card shadow border-0 rounded-4">
                <div className="card-body text-center py-5">
                    Loading product...
                </div>
            </div>
        );
    }

    return (
        <div>

            <div className="card shadow border-0 rounded-4 mb-4">
                <div className="card-body">

                    <h2 className="fw-bold mb-1">
                        <i className="bi bi-pencil-square me-2"></i>
                        Edit Product
                    </h2>

                    <p className="text-muted mb-0">
                        Update product information.
                    </p>

                </div>
            </div>

            <form onSubmit={handleSubmit}>

                <div className="card shadow border-0 rounded-4">
                    <div className="card-body">

                        <div className="row g-4">

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

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Product Name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    className="form-control"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Barcode
                                </label>

                                <input
                                    type="text"
                                    name="barcode"
                                    className="form-control"
                                    value={form.barcode}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="col-md-6">

                                <label className="form-label fw-semibold">
                                    Color
                                </label>

                                <input
                                    type="text"
                                    name="color"
                                    className="form-control"
                                    value={form.color}
                                    onChange={handleChange}
                                />

                            </div>

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

                            {sizes.includes("OTHER") && (
                                <div className="col-md-6">

                                    <label className="form-label fw-semibold">
                                        Custom Size
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        value={otherSize}
                                        onChange={(e) =>
                                            setOtherSize(e.target.value)
                                        }
                                    />

                                </div>
                            )}

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
                                {saving ? "Updating..." : "Update Product"}
                            </button>

                        </div>

                    </div>
                </div>

            </form>

        </div>
    );
}