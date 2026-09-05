import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Alterations() {
    const navigate = useNavigate();

    const [alterations, setAlterations] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [month, setMonth] = useState("");

    // --------------------------------------------------------
    // LOAD ALTERATIONS
    // --------------------------------------------------------

    useEffect(() => {
        loadAlterations();
    }, []);

    const loadAlterations = async () => {
        setLoading(true);

        try {
            const params = {};

            if (search.trim()) {
                params.search = search.trim();
            }

            if (month) {
                params.month = month;
            }

            const response = await api.get(
                "alterations/",
                { params }
            );

            const data =
                response.data.results ||
                response.data;

            setAlterations(data);

        } catch (error) {

            console.error(
                "Failed to load alterations:",
                error
            );

            setAlterations([]);

        } finally {

            setLoading(false);
        }
    };

    // --------------------------------------------------------
    // SEARCH
    // --------------------------------------------------------

    const handleSearch = (e) => {
        e.preventDefault();
        loadAlterations();
    };

    // --------------------------------------------------------
    // CLEAR FILTERS
    // --------------------------------------------------------

    const handleClear = () => {

        setSearch("");
        setMonth("");

        // Load all alterations
        setTimeout(() => {
            loadAlterations();
        }, 0);
    };

    // --------------------------------------------------------
    // DELETE
    // --------------------------------------------------------

    const handleDelete = async (id) => {

        if (
            !window.confirm(
                "Are you sure you want to delete this alteration?"
            )
        ) {
            return;
        }

        try {

            await api.delete(
                `alterations/${id}/`
            );

            // Remove from current list immediately
            setAlterations((previous) =>
                previous.filter(
                    (alteration) =>
                        alteration.id !== id
                )
            );

        } catch (error) {

            console.error(
                "Failed to delete alteration:",
                error
            );

            alert(
                "Unable to delete alteration."
            );
        }
    };

    // --------------------------------------------------------
    // FORMAT MONEY
    // --------------------------------------------------------

    const formatAmount = (amount) => {

        return Number(
            amount || 0
        ).toFixed(2);
    };

    // --------------------------------------------------------
    // UI
    // --------------------------------------------------------

    return (
        <div className="container-fluid py-4">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>

                    <h2 className="fw-bold mb-1">

                        <i className="bi bi-rulers me-2"></i>

                        Alteration Management

                    </h2>

                    <p className="text-muted mb-0">

                        Manage customer alteration requests,
                        measurements, and alteration history.

                    </p>

                </div>

                <button
                    className="btn btn-primary"
                    onClick={() =>
                        navigate(
                            "/alterations/create"
                        )
                    }
                >

                    <i className="bi bi-plus-lg me-2"></i>

                    New Alteration

                </button>

            </div>


            {/* ==================================================
                SEARCH / FILTER
            ================================================== */}

            <div className="card border-0 shadow-sm rounded-4 mb-4">

                <div className="card-body">

                    <form onSubmit={handleSearch}>

                        <div className="row g-3 align-items-end">

                            {/* SEARCH */}

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
                                        setSearch(
                                            e.target.value
                                        )
                                    }
                                />

                            </div>


                            {/* MONTH */}

                            <div className="col-md-3">

                                <label className="form-label fw-semibold">

                                    Month

                                </label>

                                <input
                                    type="month"
                                    className="form-control"
                                    value={month}
                                    onChange={(e) =>
                                        setMonth(
                                            e.target.value
                                        )
                                    }
                                />

                            </div>


                            {/* BUTTONS */}

                            <div className="col-md-4 d-flex gap-2">

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >

                                    <i className="bi bi-search me-1"></i>

                                    Search

                                </button>

                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={handleClear}
                                >

                                    Clear

                                </button>

                            </div>

                        </div>

                    </form>

                </div>

            </div>


            {/* ==================================================
                TABLE
            ================================================== */}

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

                                    <th>
                                        Assigned Employee
                                    </th>

                                    <th>Advance</th>

                                    <th>Actions</th>

                                </tr>

                            </thead>


                            <tbody>

                                {/* LOADING */}

                                {loading ? (

                                    <tr>

                                        <td
                                            colSpan="8"
                                            className="text-center py-5"
                                        >

                                            <div
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                            ></div>

                                            Loading alterations...

                                        </td>

                                    </tr>

                                ) : alterations.length === 0 ? (

                                    /* EMPTY */

                                    <tr>

                                        <td
                                            colSpan="8"
                                            className="text-center py-5"
                                        >

                                            <i className="bi bi-rulers fs-1 text-muted"></i>

                                            <h5 className="mt-3">

                                                No alterations found

                                            </h5>

                                            <p className="text-muted">

                                                Add a new alteration
                                                request to get started.

                                            </p>

                                        </td>

                                    </tr>

                                ) : (

                                    /* DATA */

                                    alterations.map(
                                        (alteration, index) => (

                                            <tr
                                                key={
                                                    alteration.id
                                                }
                                            >

                                                {/* NUMBER */}

                                                <td>

                                                    {index + 1}

                                                </td>


                                                {/* CUSTOMER */}

                                                <td>

                                                    <strong>

                                                        {
                                                            alteration.customer_name
                                                        }

                                                    </strong>

                                                </td>


                                                {/* PHONE */}

                                                <td>

                                                    {
                                                        alteration.phone ||
                                                        "-"
                                                    }

                                                </td>


                                                {/* DATE */}

                                                <td>

                                                    {
                                                        alteration.alteration_date ||
                                                        "-"
                                                    }

                                                </td>


                                                {/* ITEM */}

                                                <td>

                                                    {
                                                        alteration.product_name ||
                                                        alteration.item_name ||
                                                        "-"
                                                    }

                                                </td>


                                                {/* EMPLOYEE */}

                                                <td>

                                                    {
                                                        alteration.assigned_employee_name
                                                    ? (

                                                        <span className="badge bg-info-subtle text-dark">

                                                            <i className="bi bi-person me-1"></i>

                                                            {
                                                                alteration.assigned_employee_name
                                                            }

                                                        </span>

                                                    ) : (

                                                        <span className="text-muted">

                                                            <i className="bi bi-person-x me-1"></i>

                                                            Unassigned

                                                        </span>

                                                    )}

                                                </td>


                                                {/* ADVANCE */}

                                                <td>

                                                    ₹
                                                    {formatAmount(
                                                        alteration.advance_amount
                                                    )}

                                                </td>


                                                {/* ACTIONS */}

                                                <td>

                                                    <div className="d-flex gap-2">

                                                        {/* EDIT */}

                                                        <button
                                                            type="button"
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


                                                        {/* DELETE */}

                                                        <button
                                                            type="button"
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

        </div>
    );
}

export default Alterations;