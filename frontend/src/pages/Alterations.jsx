import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Alterations() {
    const navigate = useNavigate();

    const [alterations, setAlterations] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [month, setMonth] = useState("");

    const [showDelivery, setShowDelivery] = useState(false);
    const [selectedAlteration, setSelectedAlteration] = useState(null);

    const [deliveryForm, setDeliveryForm] = useState({
        delivered_amount: "",
        delivery_payment_mode: "Cash",
        delivery_date: "",
        delivery_time: "",
    });

    useEffect(() => {
        loadAlterations();
    }, []);

    const loadAlterations = async () => {
        try {
            setLoading(true);

            const response = await api.get("alterations/");

            const data = response.data.results || response.data;

            setAlterations(data);
        } catch (error) {
            console.error("Failed to load alterations:", error);
            alert("Unable to load alterations.");
        } finally {
            setLoading(false);
        }
    };

    // ============================
    // SEARCH
    // ============================

    const handleSearch = async () => {
        try {
            setLoading(true);

            const params = {};

            if (search.trim()) {
                params.search = search.trim();
            }

            if (month) {
                params.month = month;
            }

            const response = await api.get("alterations/", {
                params,
            });

            const data = response.data.results || response.data;

            setAlterations(data);
        } catch (error) {
            console.error("Search failed:", error);
            alert("Unable to search alterations.");
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setSearch("");
        setMonth("");
        loadAlterations();
    };

    // ============================
    // DELIVERY MODAL
    // ============================

    const openDelivery = (alteration) => {
        setSelectedAlteration(alteration);

        setDeliveryForm({
            delivered_amount: Number(
                alteration.balance_amount || 0
            ).toFixed(2),

            delivery_payment_mode: "Cash",

            delivery_date: new Date()
                .toISOString()
                .split("T")[0],

            delivery_time: new Date()
                .toTimeString()
                .slice(0, 5),
        });

        setShowDelivery(true);
    };

    const closeDelivery = () => {
        setShowDelivery(false);
        setSelectedAlteration(null);
    };

    // ============================
    // DELIVERY SUBMIT
    // ============================

    const handleDelivery = async (e) => {
        e.preventDefault();

        if (!selectedAlteration) {
            return;
        }

        try {
            await api.post(
                `alterations/${selectedAlteration.id}/deliver/`,
                {
                    delivered_amount:
                        deliveryForm.delivered_amount,

                    delivery_payment_mode:
                        deliveryForm.delivery_payment_mode,

                    delivery_date:
                        deliveryForm.delivery_date,

                    delivery_time:
                        deliveryForm.delivery_time,
                }
            );

            alert("Alteration delivered successfully.");

            closeDelivery();

            loadAlterations();

        } catch (error) {
            console.error(
                "Failed to deliver alteration:",
                error
            );

            const message =
                error.response?.data?.detail ||
                "Unable to deliver alteration.";

            alert(message);
        }
    };

    // ============================
    // DELETE
    // ============================

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this alteration?")) {
            return;
        }

        try {
            await api.delete(`alterations/${id}/`);

            loadAlterations();

        } catch (error) {
            console.error(
                "Failed to delete alteration:",
                error
            );

            alert("Unable to delete alteration.");
        }
    };

    return (
        <div className="container-fluid py-4">

            {/* ============================
                HEADER
            ============================ */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>
                    <h2 className="fw-bold mb-1">

                        <i className="bi bi-rulers me-2"></i>

                        Alteration Management

                    </h2>

                    <p className="text-muted mb-0">
                        Manage customer alteration requests,
                        measurements, payments, and delivery.
                    </p>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={() =>
                        navigate("/alterations/create")
                    }
                >
                    <i className="bi bi-plus-lg me-2"></i>

                    New Alteration

                </button>

            </div>


            {/* ============================
                SEARCH / FILTER
            ============================ */}

            <div className="card border-0 shadow-sm rounded-4 mb-4">

                <div className="card-body">

                    <div className="row g-3 align-items-end">

                        <div className="col-md-5">

                            <label className="form-label fw-semibold">
                                Search
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                placeholder="Customer, phone or item..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleSearch();
                                    }
                                }}
                            />

                        </div>


                        <div className="col-md-3">

                            <label className="form-label fw-semibold">
                                Month
                            </label>

                            <input
                                type="month"
                                className="form-control"
                                value={month}
                                onChange={(e) =>
                                    setMonth(e.target.value)
                                }
                            />

                        </div>


                        <div className="col-md-4 d-flex gap-2">

                            <button
                                className="btn btn-primary"
                                onClick={handleSearch}
                            >
                                <i className="bi bi-search me-1"></i>

                                Search
                            </button>

                            <button
                                className="btn btn-outline-secondary"
                                onClick={clearFilters}
                            >
                                Clear
                            </button>

                        </div>

                    </div>

                </div>

            </div>


            {/* ============================
                TABLE
            ============================ */}

            <div className="card border-0 shadow-sm rounded-4">

                <div className="card-body p-0">

                    <div className="table-responsive">

                        <table className="table table-hover align-middle mb-0">

                            <thead className="table-light">

                                <tr>

                                    <th>#</th>

                                    <th>Customer</th>

                                    <th>Phone</th>

                                    <th>Date</th>

                                    <th>Item</th>

                                    <th>Total</th>

                                    <th>Advance</th>

                                    <th>Balance</th>

                                    <th>Status</th>

                                    <th>Delivery</th>

                                    <th>Actions</th>

                                </tr>

                            </thead>


                            <tbody>

                                {loading ? (

                                    <tr>

                                        <td
                                            colSpan="11"
                                            className="text-center py-5"
                                        >
                                            Loading alterations...
                                        </td>

                                    </tr>

                                ) : alterations.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="11"
                                            className="text-center py-5"
                                        >

                                            <i className="bi bi-rulers fs-1 text-muted"></i>

                                            <h5 className="mt-3">
                                                No alterations found
                                            </h5>

                                            <p className="text-muted">
                                                Add a new alteration request
                                                to get started.
                                            </p>

                                        </td>

                                    </tr>

                                ) : (

                                    alterations.map(
                                        (alteration, index) => (

                                            <tr
                                                key={alteration.id}
                                            >

                                                <td>
                                                    {index + 1}
                                                </td>


                                                <td>

                                                    <strong>
                                                        {
                                                            alteration.customer_name
                                                        }
                                                    </strong>

                                                </td>


                                                <td>
                                                    {
                                                        alteration.phone ||
                                                        "-"
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        alteration.alteration_date ||
                                                        "-"
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        alteration.product_name ||
                                                        alteration.item_name ||
                                                        "-"
                                                    }
                                                </td>


                                                {/* TOTAL */}

                                                <td>

                                                    ₹
                                                    {Number(
                                                        alteration.total_amount ||
                                                        0
                                                    ).toFixed(2)}

                                                </td>


                                                {/* ADVANCE */}

                                                <td>

                                                    ₹
                                                    {Number(
                                                        alteration.advance_amount ||
                                                        0
                                                    ).toFixed(2)}

                                                </td>


                                                {/* BALANCE */}

                                                <td>

                                                    <strong>

                                                        ₹
                                                        {Number(
                                                            alteration.balance_amount ||
                                                            0
                                                        ).toFixed(2)}

                                                    </strong>

                                                </td>


                                                {/* STATUS */}

                                                <td>

                                                    {alteration.status ===
                                                    "Delivered" ? (

                                                        <span className="badge bg-success">

                                                            Delivered

                                                        </span>

                                                    ) : alteration.status ===
                                                      "Ready" ? (

                                                        <span className="badge bg-info text-dark">

                                                            Ready

                                                        </span>

                                                    ) : alteration.status ===
                                                      "Processing" ? (

                                                        <span className="badge bg-warning text-dark">

                                                            Processing

                                                        </span>

                                                    ) : (

                                                        <span className="badge bg-secondary">

                                                            {
                                                                alteration.status ||
                                                                "Pending"
                                                            }

                                                        </span>

                                                    )}

                                                </td>


                                                {/* DELIVERY */}

                                                <td>

                                                    {alteration.delivery_date ? (

                                                        <div>

                                                            <div>
                                                                {
                                                                    alteration.delivery_date
                                                                }
                                                            </div>

                                                            {alteration.delivery_time && (

                                                                <small className="text-muted">

                                                                    {
                                                                        alteration.delivery_time
                                                                    }

                                                                </small>

                                                            )}

                                                        </div>

                                                    ) : (

                                                        <span className="text-muted">
                                                            Not delivered
                                                        </span>

                                                    )}

                                                </td>


                                                {/* ACTIONS */}

                                                <td>

                                                    <div className="d-flex gap-2">

                                                        {/* EDIT */}

                                                        {alteration.status !==
                                                            "Delivered" && (

                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                title="Edit"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/alterations/${alteration.id}/edit`
                                                                    )
                                                                }
                                                            >

                                                                <i className="bi bi-pencil"></i>

                                                            </button>

                                                        )}


                                                        {/* DELIVERY */}

                                                        {alteration.status !==
                                                            "Delivered" && (

                                                            <button
                                                                className="btn btn-sm btn-outline-success"
                                                                title="Deliver"
                                                                onClick={() =>
                                                                    openDelivery(
                                                                        alteration
                                                                    )
                                                                }
                                                            >

                                                                <i className="bi bi-box-seam"></i>

                                                            </button>

                                                        )}


                                                        {/* DELETE */}

                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            title="Delete"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    alteration.id
                                                                )
                                                            }
                                                        >

                                                            <i className="bi bi-trash"></i>

                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>

                                        )
                                    )

                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>


            {/* ==================================================
                DELIVERY MODAL
            ================================================== */}

            {showDelivery &&
                selectedAlteration && (

                    <div
                        className="modal fade show d-block"
                        style={{
                            backgroundColor:
                                "rgba(0,0,0,0.5)",
                        }}
                    >

                        <div className="modal-dialog modal-dialog-centered">

                            <div className="modal-content rounded-4">

                                <div className="modal-header">

                                    <h5 className="modal-title fw-bold">

                                        <i className="bi bi-box-seam me-2"></i>

                                        Deliver Alteration

                                    </h5>

                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={closeDelivery}
                                    ></button>

                                </div>


                                <form
                                    onSubmit={handleDelivery}
                                >

                                    <div className="modal-body">

                                        {/* CUSTOMER */}

                                        <div className="mb-3">

                                            <label className="form-label fw-semibold">
                                                Customer
                                            </label>

                                            <input
                                                type="text"
                                                className="form-control"
                                                value={
                                                    selectedAlteration.customer_name
                                                }
                                                disabled
                                            />

                                        </div>


                                        {/* AMOUNTS */}

                                        <div className="row g-3 mb-3">

                                            <div className="col-md-4">

                                                <label className="form-label">
                                                    Total
                                                </label>

                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={`₹${Number(
                                                        selectedAlteration.total_amount ||
                                                        0
                                                    ).toFixed(2)}`}
                                                    disabled
                                                />

                                            </div>


                                            <div className="col-md-4">

                                                <label className="form-label">
                                                    Advance
                                                </label>

                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={`₹${Number(
                                                        selectedAlteration.advance_amount ||
                                                        0
                                                    ).toFixed(2)}`}
                                                    disabled
                                                />

                                            </div>


                                            <div className="col-md-4">

                                                <label className="form-label fw-semibold">
                                                    Balance
                                                </label>

                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={`₹${Number(
                                                        selectedAlteration.balance_amount ||
                                                        0
                                                    ).toFixed(2)}`}
                                                    disabled
                                                />

                                            </div>

                                        </div>


                                        {/* PAYMENT */}

                                        <div className="mb-3">

                                            <label className="form-label fw-semibold">
                                                Balance Amount Received
                                            </label>

                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="form-control"
                                                value={
                                                    deliveryForm.delivered_amount
                                                }
                                                onChange={(e) =>
                                                    setDeliveryForm({
                                                        ...deliveryForm,
                                                        delivered_amount:
                                                            e.target.value,
                                                    })
                                                }
                                                required
                                            />

                                        </div>


                                        {/* PAYMENT MODE */}

                                        <div className="mb-3">

                                            <label className="form-label fw-semibold">
                                                Payment Mode
                                            </label>

                                            <select
                                                className="form-select"
                                                value={
                                                    deliveryForm.delivery_payment_mode
                                                }
                                                onChange={(e) =>
                                                    setDeliveryForm({
                                                        ...deliveryForm,
                                                        delivery_payment_mode:
                                                            e.target.value,
                                                    })
                                                }
                                            >

                                                <option value="Cash">
                                                    Cash
                                                </option>

                                                <option value="Bank">
                                                    Bank
                                                </option>

                                                <option value="Online">
                                                    Online
                                                </option>

                                                <option value="Cheque">
                                                    Cheque
                                                </option>

                                                <option value="POS">
                                                    POS
                                                </option>

                                            </select>

                                        </div>


                                        {/* DATE + TIME */}

                                        <div className="row g-3">

                                            <div className="col-md-6">

                                                <label className="form-label fw-semibold">
                                                    Delivery Date
                                                </label>

                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    value={
                                                        deliveryForm.delivery_date
                                                    }
                                                    onChange={(e) =>
                                                        setDeliveryForm({
                                                            ...deliveryForm,
                                                            delivery_date:
                                                                e.target.value,
                                                        })
                                                    }
                                                    required
                                                />

                                            </div>


                                            <div className="col-md-6">

                                                <label className="form-label fw-semibold">
                                                    Delivery Time
                                                </label>

                                                <input
                                                    type="time"
                                                    className="form-control"
                                                    value={
                                                        deliveryForm.delivery_time
                                                    }
                                                    onChange={(e) =>
                                                        setDeliveryForm({
                                                            ...deliveryForm,
                                                            delivery_time:
                                                                e.target.value,
                                                        })
                                                    }
                                                    required
                                                />

                                            </div>

                                        </div>

                                    </div>


                                    <div className="modal-footer">

                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={closeDelivery}
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            className="btn btn-success"
                                        >

                                            <i className="bi bi-check-lg me-1"></i>

                                            Confirm Delivery

                                        </button>

                                    </div>

                                </form>

                            </div>

                        </div>

                    </div>

                )}

        </div>
    );
}

export default Alterations;