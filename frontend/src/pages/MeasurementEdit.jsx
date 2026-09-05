import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./CustomerCreate.css";

function MeasurementEdit() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [measurement, setMeasurement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const fields = [
        ["top_length", "Top Length"],
        ["shoulder", "Shoulder"],
        ["sleeve", "Sleeve"],
        ["sleeve_down", "Sleeve Down"],
        ["body", "Body"],
        ["collar", "Collar"],
        ["pant_length", "Pant Length"],
        ["band", "Band"],
        ["hip", "Hip"],
        ["bell", "Bell"],
        ["loose", "Loose"],
        ["mutt", "Mutt"],
        ["play", "Play"],
    ];

    useEffect(() => {
        loadMeasurement();
    }, [id]);

    const loadMeasurement = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                `measurements/?customer=${id}`
            );

            const data = response.data;

            const measurements = Array.isArray(data)
                ? data
                : data.results || [];

            if (measurements.length === 0) {
                setError("No measurement record found for this customer.");
                return;
            }

            setMeasurement(measurements[0]);

        } catch (err) {
            console.error("Measurement loading error:", err);

            setError(
                err.response?.data?.detail ||
                "Unable to load measurements."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setMeasurement((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!measurement?.id) {
            setError("Measurement record not found.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            const data = {};

            fields.forEach(([field]) => {
                data[field] =
                    measurement[field] === ""
                        ? null
                        : measurement[field];
            });

            data.notes = measurement.notes || "";

            await api.patch(
                `measurements/${measurement.id}/`,
                data
            );

            navigate(`/customers/${id}`);

        } catch (err) {
            console.error("Measurement update error:", err);

            const responseData = err.response?.data;

            if (
                responseData &&
                typeof responseData === "object"
            ) {
                const messages = Object.entries(responseData)
                    .map(([field, value]) => {
                        const message = Array.isArray(value)
                            ? value.join(", ")
                            : String(value);

                        return `${field}: ${message}`;
                    })
                    .join(" | ");

                setError(
                    messages || "Unable to update measurements."
                );
            } else {
                setError("Unable to update measurements.");
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="customer-edit-loading">
                <div
                    className="spinner-border text-primary"
                    role="status"
                ></div>

                <p>Loading measurements...</p>
            </div>
        );
    }

    return (
        <div className="customer-create-page">

            {/* HEADER */}

            <div className="page-header-block">

                <div>
                    <h2 className="page-header-title">
                        Edit Measurements
                    </h2>

                    <p className="page-header-sub">
                        Update the customer's tailoring measurements.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                        navigate(`/customers/${id}`)
                    }
                >
                    <i className="bi bi-arrow-left me-1"></i>
                    Back to Customer
                </button>

            </div>


            {/* ERROR */}

            {error && (
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </div>
            )}


            {measurement && (
                <form onSubmit={handleSubmit}>

                    {/* SHIRT */}

                    <div className="customer-form-card">

                        <div className="customer-form-card-header">
                            <i className="bi bi-rulers me-2"></i>
                            Shirt / Top Measurements
                        </div>

                        <div className="customer-form-card-body">

                            <div className="row g-3">

                                {fields
                                    .slice(0, 6)
                                    .map(([field, label]) => (
                                        <div
                                            className="col-md-4"
                                            key={field}
                                        >
                                            <label className="customer-form-label">
                                                {label}
                                            </label>

                                            <input
                                                type="number"
                                                step="0.01"
                                                name={field}
                                                value={
                                                    measurement[field] ?? ""
                                                }
                                                onChange={handleChange}
                                                className="form-control"
                                            />
                                        </div>
                                    ))}

                            </div>

                        </div>

                    </div>


                    {/* PANT */}

                    <div className="customer-form-card">

                        <div className="customer-form-card-header">
                            <i className="bi bi-rulers me-2"></i>
                            Pant Measurements
                        </div>

                        <div className="customer-form-card-body">

                            <div className="row g-3">

                                {fields
                                    .slice(6)
                                    .map(([field, label]) => (
                                        <div
                                            className="col-md-4"
                                            key={field}
                                        >
                                            <label className="customer-form-label">
                                                {label}
                                            </label>

                                            <input
                                                type="number"
                                                step="0.01"
                                                name={field}
                                                value={
                                                    measurement[field] ?? ""
                                                }
                                                onChange={handleChange}
                                                className="form-control"
                                            />
                                        </div>
                                    ))}

                            </div>

                        </div>

                    </div>


                    {/* NOTES */}

                    <div className="customer-form-card">

                        <div className="customer-form-card-header">
                            <i className="bi bi-journal-text me-2"></i>
                            Tailoring Notes
                        </div>

                        <div className="customer-form-card-body">

                            <label className="customer-form-label">
                                Notes
                            </label>

                            <textarea
                                name="notes"
                                value={measurement.notes || ""}
                                onChange={handleChange}
                                className="form-control"
                                rows="4"
                                placeholder="Enter tailoring notes..."
                            />

                        </div>

                    </div>


                    {/* ACTIONS */}

                    <div className="customer-form-actions">

                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() =>
                                navigate(`/customers/${id}`)
                            }
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <span
                                        className="spinner-border spinner-border-sm me-2"
                                    ></span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check-circle me-1"></i>
                                    Save Measurements
                                </>
                            )}
                        </button>

                    </div>

                </form>
            )}

        </div>
    );
}

export default MeasurementEdit;