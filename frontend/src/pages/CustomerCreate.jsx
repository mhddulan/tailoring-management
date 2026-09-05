import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./CustomerCreate.css";

function CustomerCreate() {
    const navigate = useNavigate();

    // =========================================================
    // USER ROLE
    // =========================================================

    const userStr = localStorage.getItem("user");
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const isAdmin = currentUser?.role === "Admin";

    const [branches, setBranches] = useState([]);
    const [loadingBranches, setLoadingBranches] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        name: "",
        mobile: "",
        address: "",
        branch: "",

        // Shirt / Top
        top_length: "",
        shoulder: "",
        sleeve: "",
        sleeve_down: "",
        body: "",
        collar: "",

        // Pant
        pant_length: "",
        band: "",
        hip: "",
        bell: "",
        loose: "",
        mutt: "",
        play: "",

        // Notes
        notes: "",
    });

    // =========================================================
    // OTHER ITEM MEASUREMENTS (UI-only, appended to notes)
    // =========================================================

    const [otherItem, setOtherItem] = useState({
        other_item_name: "",
        other_length: "",
        other_shoulder: "",
        other_body: "",
        other_sleeve: "",
        other_collar: "",
        other_waist: "",
        other_hip: "",
        other_bottom: "",
        other_measurements: "",
    });

    // =========================================================
    // LOAD BRANCHES
    // =========================================================

    useEffect(() => {
        loadBranches();
    }, []);

    const loadBranches = async () => {
        try {
            setLoadingBranches(true);
            setError("");

            const response = await api.get("branches/");
            const data = response.data;

            if (Array.isArray(data)) {
                setBranches(data);
            } else if (Array.isArray(data.results)) {
                setBranches(data.results);
            } else {
                setBranches([]);
            }

        } catch (err) {
            console.error("Branch loading error:", err);

            setError(
                err.response?.data?.detail ||
                "Unable to load branches."
            );
        } finally {
            setLoadingBranches(false);
        }
    };


    // =========================================================
    // INPUT CHANGE
    // =========================================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleOtherChange = (e) => {
        const { name, value } = e.target;

        setOtherItem((prev) => ({
            ...prev,
            [name]: value,
        }));
    };


    // =========================================================
    // BUILD NOTES WITH OTHER ITEM MEASUREMENTS
    // =========================================================

    const buildNotes = () => {

        let notes = form.notes.trim();

        if (!otherItem.other_item_name.trim()) {
            return notes;
        }

        const lines = [`\n\n--- Other Item: ${otherItem.other_item_name.trim()} ---`];

        if (otherItem.other_length) lines.push(`Length: ${otherItem.other_length}`);
        if (otherItem.other_shoulder) lines.push(`Shoulder: ${otherItem.other_shoulder}`);
        if (otherItem.other_body) lines.push(`Body/Chest: ${otherItem.other_body}`);
        if (otherItem.other_sleeve) lines.push(`Sleeve: ${otherItem.other_sleeve}`);
        if (otherItem.other_collar) lines.push(`Collar: ${otherItem.other_collar}`);
        if (otherItem.other_waist) lines.push(`Waist: ${otherItem.other_waist}`);
        if (otherItem.other_hip) lines.push(`Hip: ${otherItem.other_hip}`);
        if (otherItem.other_bottom) lines.push(`Bottom: ${otherItem.other_bottom}`);
        if (otherItem.other_measurements.trim()) {
            lines.push(`Additional: ${otherItem.other_measurements.trim()}`);
        }

        notes += lines.join("\n");

        return notes;
    };


    // =========================================================
    // SAVE CUSTOMER
    // =========================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (!form.name.trim()) {
            setError("Customer name is required.");
            return;
        }

        if (isAdmin && !form.branch) {
            setError("Please select a branch.");
            return;
        }

        try {
            setSaving(true);

            // -------------------------------------------------
            // CUSTOMER
            // -------------------------------------------------

            const customerPayload = {
                name: form.name.trim(),
                mobile: form.mobile.trim(),
                address: form.address.trim(),
            };

            if (isAdmin) {
                customerPayload.branch = Number(form.branch);
            }

            const customerResponse = await api.post(
                "customers/",
                customerPayload
            );

            const customer = customerResponse.data;

            // -------------------------------------------------
            // MEASUREMENTS
            // -------------------------------------------------

            const combinedNotes = buildNotes();

            const measurementData = {
                customer: customer.id,

                top_length: form.top_length || null,
                shoulder: form.shoulder || null,
                sleeve: form.sleeve || null,
                sleeve_down: form.sleeve_down || null,
                body: form.body || null,
                collar: form.collar || null,

                pant_length: form.pant_length || null,
                band: form.band || null,
                hip: form.hip || null,
                bell: form.bell || null,
                loose: form.loose || null,
                mutt: form.mutt || null,
                play: form.play || null,

                notes: combinedNotes,
            };

            const hasMeasurement =
                Object.entries(measurementData).some(
                    ([key, value]) =>
                        key !== "customer" &&
                        value !== null &&
                        value !== ""
                );

            if (hasMeasurement) {
                await api.post(
                    "measurements/",
                    measurementData
                );
            }

            // -------------------------------------------------
            // SUCCESS
            // -------------------------------------------------

            navigate(`/customers/${customer.id}`);

        } catch (err) {
            console.error("Customer save error:", err);

            const responseData = err.response?.data;

            if (typeof responseData === "object") {
                const messages = Object.entries(responseData)
                    .map(([field, value]) => {
                        const message = Array.isArray(value)
                            ? value.join(", ")
                            : String(value);

                        return `${field}: ${message}`;
                    })
                    .join(" | ");

                setError(
                    messages ||
                    "Unable to save customer."
                );
            } else {
                setError("Unable to save customer.");
            }

        } finally {
            setSaving(false);
        }
    };


    // =========================================================
    // MEASUREMENT INPUT
    // =========================================================

    const MeasurementInput = ({
        label,
        name,
    }) => (
        <div className="col-12 col-sm-6 col-md-4">

            <label className="customer-form-label">
                {label}
            </label>

            <input
                type="number"
                step="0.01"
                name={name}
                value={form[name]}
                onChange={handleChange}
                className="form-control"
                placeholder={`Enter ${label.toLowerCase()}`}
            />

        </div>
    );


    return (
        <div className="customer-create-page">

            {/* =====================================================
                HEADER
            ====================================================== */}

            <div className="page-header-block">

                <div>

                    <h2 className="page-header-title">
                        Customer Registration &amp; Measurements
                    </h2>

                    <p className="page-header-sub">
                        Enter customer details along with tailoring
                        measurement profiles.
                    </p>

                </div>

                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate("/customers")}
                >
                    <i className="bi bi-arrow-left me-1"></i>
                    Back to Customers
                </button>

            </div>


            {/* ERROR */}

            {error && (
                <div className="alert alert-danger alert-custom mb-3">
                    <i className="bi bi-exclamation-triangle-fill text-danger fs-5 me-2"></i>
                    {error}
                </div>
            )}


            <form onSubmit={handleSubmit}>

                {/* =====================================================
                    CUSTOMER INFORMATION
                ====================================================== */}

                <div className="customer-form-card">

                    <div className="customer-form-card-header">
                        <i className="bi bi-person-badge-fill"></i>
                        Customer Information
                    </div>

                    <div className="customer-form-card-body">

                        <div className="row g-3">

                            {/* NAME */}

                            <div className="col-12 col-md-6">

                                <label className="customer-form-label">
                                    Customer Name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="Enter customer name"
                                    required
                                />

                            </div>


                            {/* MOBILE */}

                            <div className="col-12 col-md-6">

                                <label className="customer-form-label">
                                    Mobile Number
                                </label>

                                <input
                                    type="text"
                                    name="mobile"
                                    value={form.mobile}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="Enter mobile number"
                                />

                            </div>


                            {/* ADDRESS — full width like original */}

                            <div className="col-12">

                                <label className="customer-form-label">
                                    Address
                                </label>

                                <textarea
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    className="form-control"
                                    rows="3"
                                    placeholder="Enter customer address"
                                />

                            </div>


                            {/* BRANCH — Admin only */}

                            {isAdmin && (
                                <div className="col-12 col-md-6">

                                    <label className="customer-form-label">
                                        Branch
                                    </label>

                                    <select
                                        name="branch"
                                        value={form.branch}
                                        onChange={handleChange}
                                        className="form-select"
                                        required
                                        disabled={loadingBranches}
                                    >

                                        <option value="">
                                            {loadingBranches
                                                ? "Loading branches..."
                                                : "Select Branch"}
                                        </option>

                                        {branches.map((branch) => (
                                            <option
                                                key={branch.id}
                                                value={branch.id}
                                            >
                                                {branch.name}
                                            </option>
                                        ))}

                                    </select>

                                    {!loadingBranches &&
                                        branches.length === 0 && (
                                            <div className="form-text text-danger">
                                                No branches available.
                                            </div>
                                        )}

                                </div>
                            )}

                        </div>

                    </div>

                </div>


                {/* =====================================================
                    SHIRT / TOP
                ====================================================== */}

                <div className="customer-form-card">

                    <div className="customer-form-card-header">
                        <i className="bi bi-scissors text-info me-1"></i>
                        Shirt / Top Measurements
                    </div>

                    <div className="customer-form-card-body">

                        <div className="row g-3">

                            <MeasurementInput
                                label="Length"
                                name="top_length"
                            />

                            <MeasurementInput
                                label="Shoulder"
                                name="shoulder"
                            />

                            <MeasurementInput
                                label="Sleeve"
                                name="sleeve"
                            />

                            <MeasurementInput
                                label="Sleeve Down"
                                name="sleeve_down"
                            />

                            <MeasurementInput
                                label="Body"
                                name="body"
                            />

                            <MeasurementInput
                                label="Collar"
                                name="collar"
                            />

                        </div>

                    </div>

                </div>


                {/* =====================================================
                    PANT
                ====================================================== */}

                <div className="customer-form-card">

                    <div className="customer-form-card-header">
                        <i className="bi bi-rulers text-warning me-1"></i>
                        Pant Measurements
                    </div>

                    <div className="customer-form-card-body">

                        <div className="row g-3">

                            <MeasurementInput
                                label="Length"
                                name="pant_length"
                            />

                            <MeasurementInput
                                label="Band"
                                name="band"
                            />

                            <MeasurementInput
                                label="Hip"
                                name="hip"
                            />

                            <MeasurementInput
                                label="Bell"
                                name="bell"
                            />

                            <MeasurementInput
                                label="Loose"
                                name="loose"
                            />

                            <MeasurementInput
                                label="Mutt"
                                name="mutt"
                            />

                            <MeasurementInput
                                label="Play"
                                name="play"
                            />

                        </div>

                    </div>

                </div>


                {/* =====================================================
                    OTHER ITEM MEASUREMENTS
                ====================================================== */}

                <div className="customer-form-card">

                    <div className="customer-form-card-header">
                        <i className="bi bi-rulers text-success me-1"></i>
                        Other Item Measurements
                    </div>

                    <div className="customer-form-card-body">

                        <p className="text-muted small mb-4">
                            Add measurements for another clothing item.
                            Only the item name is required.
                        </p>

                        <div className="row g-3">

                            {/* ITEM NAME */}

                            <div className="col-12 col-md-6">

                                <label className="customer-form-label">
                                    Item Name
                                    <span className="text-danger"> *</span>
                                </label>

                                <input
                                    type="text"
                                    name="other_item_name"
                                    value={otherItem.other_item_name}
                                    onChange={handleOtherChange}
                                    className="form-control"
                                    placeholder="Example: Thobe, Jubba, Safari..."
                                />

                                <div className="form-text">
                                    Enter the clothing item name.
                                </div>

                            </div>

                            {/* LENGTH */}

                            <div className="col-12 col-sm-6 col-md-3">

                                <label className="customer-form-label">
                                    Length
                                </label>

                                <input
                                    type="text"
                                    name="other_length"
                                    value={otherItem.other_length}
                                    onChange={handleOtherChange}
                                    className="form-control"
                                    placeholder="Length"
                                />

                            </div>

                            {/* SHOULDER */}

                            <div className="col-12 col-sm-6 col-md-3">

                                <label className="customer-form-label">
                                    Shoulder
                                </label>

                                <input
                                    type="text"
                                    name="other_shoulder"
                                    value={otherItem.other_shoulder}
                                    onChange={handleOtherChange}
                                    className="form-control"
                                    placeholder="Shoulder"
                                />

                            </div>

                            {/* BODY */}

                            <div className="col-12 col-sm-6 col-md-3">

                                <label className="customer-form-label">
                                    Body / Chest
                                </label>

                                <input
                                    type="text"
                                    name="other_body"
                                    value={otherItem.other_body}
                                    onChange={handleOtherChange}
                                    className="form-control"
                                    placeholder="Body / Chest"
                                />

                            </div>

                            {/* SLEEVE */}

                            <div className="col-12 col-sm-6 col-md-3">

                                <label className="customer-form-label">
                                    Sleeve
                                </label>

                                <input
                                    type="text"
                                    name="other_sleeve"
                                    value={otherItem.other_sleeve}
                                    onChange={handleOtherChange}
                                    className="form-control"
                                    placeholder="Sleeve"
                                />

                            </div>

                            {/* COLLAR */}

                            <div className="col-12 col-sm-6 col-md-3">

                                <label className="customer-form-label">
                                    Collar
                                </label>

                                <input
                                    type="text"
                                    name="other_collar"
                                    value={otherItem.other_collar}
                                    onChange={handleOtherChange}
                                    className="form-control"
                                    placeholder="Collar"
                                />

                            </div>

                            {/* WAIST */}

                            <div className="col-12 col-sm-6 col-md-3">

                                <label className="customer-form-label">
                                    Waist
                                </label>

                                <input
                                    type="text"
                                    name="other_waist"
                                    value={otherItem.other_waist}
                                    onChange={handleOtherChange}
                                    className="form-control"
                                    placeholder="Waist"
                                />

                            </div>

                            {/* HIP */}

                            <div className="col-12 col-sm-6 col-md-3">

                                <label className="customer-form-label">
                                    Hip
                                </label>

                                <input
                                    type="text"
                                    name="other_hip"
                                    value={otherItem.other_hip}
                                    onChange={handleOtherChange}
                                    className="form-control"
                                    placeholder="Hip"
                                />

                            </div>

                            {/* BOTTOM */}

                            <div className="col-12 col-sm-6 col-md-3">

                                <label className="customer-form-label">
                                    Bottom
                                </label>

                                <input
                                    type="text"
                                    name="other_bottom"
                                    value={otherItem.other_bottom}
                                    onChange={handleOtherChange}
                                    className="form-control"
                                    placeholder="Bottom"
                                />

                            </div>

                            {/* ADDITIONAL */}

                            <div className="col-12">

                                <label className="customer-form-label">
                                    Additional Measurements
                                </label>

                                <textarea
                                    name="other_measurements"
                                    value={otherItem.other_measurements}
                                    onChange={handleOtherChange}
                                    className="form-control"
                                    rows="4"
                                    placeholder={`Example:\nCuff: 9\nPocket: 7\nFront: 30\nBack: 32\nSpecial cut: 2`}
                                />

                                <div className="form-text">
                                    Add any measurements that are not listed above.
                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                {/* =====================================================
                    TAILORING NOTES
                ====================================================== */}

                <div className="customer-form-card">

                    <div className="customer-form-card-header">
                        <i className="bi bi-journal-text text-secondary me-1"></i>
                        Tailoring Notes
                    </div>

                    <div className="customer-form-card-body">

                        <label className="customer-form-label">
                            Additional Instructions / Style Notes
                        </label>

                        <textarea
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            className="form-control"
                            rows="4"
                            placeholder="Special instructions or tailoring notes..."
                        />

                    </div>

                </div>


                {/* =====================================================
                    ACTIONS
                ====================================================== */}

                <div className="customer-form-actions">

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate("/customers")}
                        disabled={saving}
                    >
                        <i className="bi bi-x-circle me-1"></i>
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
                                    role="status"
                                ></span>

                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check-circle-fill me-1"></i>
                                Save Customer
                            </>
                        )}

                    </button>

                </div>

            </form>

        </div>
    );
}

export default CustomerCreate;