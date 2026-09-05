import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Branches.css";

function Branches() {
    const navigate = useNavigate();

    // Temporary data only.
    // Axios/API will be connected later.
    const [search, setSearch] = useState("");

    const [branchData] = useState([
        {
            id: 1,
            name: "a1",
            address: "",
            phone: "",
            manager: "",
            username: "",
        },
        {
            id: 2,
            name: "a1",
            address: "",
            phone: "",
            manager: "",
            username: "",
        },
    ]);

    const filteredBranches = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) {
            return branchData;
        }

        return branchData.filter((item) =>
            [
                item.name,
                item.phone,
                item.manager,
                item.username,
            ]
                .filter(Boolean)
                .some((field) =>
                    String(field).toLowerCase().includes(value)
                )
        );
    }, [search, branchData]);

    return (
        <div className="container-fluid branches-page">

            {/* =====================================================
                PAGE HEADER
            ====================================================== */}

            <div className="page-header-block">

                <div>
                    <h2 className="page-header-title">
                        <i className="bi bi-buildings me-2"></i>
                        Branch Management
                    </h2>

                    <p className="page-header-sub">
                        Manage tailoring shop branches, locations,
                        managers, and branch performance.
                    </p>
                </div>

                <div>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => navigate("/branches/create")}
                    >
                        <i className="bi bi-plus-lg me-1"></i>
                        Add New Branch
                    </button>
                </div>

            </div>


            {/* =====================================================
                BRANCH TABLE CARD
            ====================================================== */}

            <div className="table-card">

                {/* =================================================
                    SEARCH HEADER
                ================================================== */}

                <div className="table-card-header">

                    <form
                        className="row g-2 align-items-center w-100"
                        onSubmit={(e) => e.preventDefault()}
                    >

                        {/* SEARCH */}

                        <div className="col-12 col-md-9 col-lg-10">

                            <div
                                className="header-search w-100"
                                style={{ maxWidth: "100%" }}
                            >

                                <i className="bi bi-search"></i>

                                <input
                                    type="text"
                                    name="search"
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
                                    className="form-control"
                                    placeholder="Search branch name, phone, or manager..."
                                />

                            </div>

                        </div>


                        {/* SEARCH BUTTON */}

                        <div className="col-12 col-md-3 col-lg-2">

                            <button
                                type="submit"
                                className="btn btn-secondary w-100"
                            >
                                <i className="bi bi-search me-1"></i>
                                Search
                            </button>

                        </div>

                    </form>

                </div>


                {/* =================================================
                    TABLE
                ================================================== */}

                <div className="table-responsive">

                    <table className="table app-table align-middle">

                        <thead>

                            <tr>

                                <th width="70">
                                    #
                                </th>

                                <th>
                                    Branch
                                </th>

                                <th>
                                    Phone
                                </th>

                                <th>
                                    Manager
                                </th>

                                <th>
                                    Username
                                </th>

                                <th
                                    width="180"
                                    className="text-end"
                                >
                                    Action
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {filteredBranches.length > 0 ? (

                                filteredBranches.map((item, index) => (

                                    <tr
                                        className="branch-row"
                                        key={item.id}
                                    >

                                        {/* NUMBER */}

                                        <td className="fw-semibold text-muted">
                                            {index + 1}
                                        </td>


                                        {/* BRANCH */}

                                        <td>

                                            <button
                                                type="button"
                                                className="branch-name-link"
                                                title="View branch performance"
                                                onClick={() =>
                                                    navigate(
                                                        `/branches/${item.id}/performance`
                                                    )
                                                }
                                            >

                                                <span className="branch-icon-small">

                                                    <i className="bi bi-building"></i>

                                                </span>


                                                <span>

                                                    <span className="branch-name">
                                                        {item.name}
                                                    </span>


                                                    {item.address && (
                                                        <small className="d-block text-muted">
                                                            {item.address}
                                                        </small>
                                                    )}

                                                </span>

                                            </button>

                                        </td>


                                        {/* PHONE */}

                                        <td>

                                            {item.phone ? (

                                                <span>

                                                    <i className="bi bi-telephone text-muted me-1"></i>

                                                    {item.phone}

                                                </span>

                                            ) : (

                                                <span className="text-muted">
                                                    —
                                                </span>

                                            )}

                                        </td>


                                        {/* MANAGER */}

                                        <td>

                                            {item.manager ? (

                                                <span className="badge bg-light text-dark border">

                                                    <i className="bi bi-person me-1"></i>

                                                    {item.manager}

                                                </span>

                                            ) : (

                                                <span className="text-muted">
                                                    —
                                                </span>

                                            )}

                                        </td>


                                        {/* USERNAME */}

                                        <td>

                                            {item.username ? (

                                                <span className="badge bg-primary-subtle text-primary">

                                                    <i className="bi bi-person-badge me-1"></i>

                                                    {item.username}

                                                </span>

                                            ) : (

                                                <span className="text-muted">
                                                    —
                                                </span>

                                            )}

                                        </td>


                                        {/* ACTION */}

                                        <td className="text-end">

                                            <button
                                                type="button"
                                                className="btn btn-sm btn-primary"
                                                title="View branch performance"
                                                onClick={() =>
                                                    navigate(
                                                        `/branches/${item.id}/performance`
                                                    )
                                                }
                                            >

                                                <i className="bi bi-bar-chart-line me-1"></i>

                                                Performance

                                            </button>

                                        </td>

                                    </tr>

                                ))

                            ) : (

                                /* =================================================
                                   EMPTY
                                ================================================== */

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="text-center py-5"
                                    >

                                        <div className="empty-state">

                                            <div className="empty-icon">

                                                <i className="bi bi-building"></i>

                                            </div>

                                            <h5 className="fw-bold mb-1">
                                                No Branches Found
                                            </h5>

                                            <p className="text-muted mb-3">
                                                No branches match your search.
                                            </p>

                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={() =>
                                                    navigate("/branches/create")
                                                }
                                            >

                                                <i className="bi bi-plus-lg me-1"></i>

                                                Add New Branch

                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>


                {/* =================================================
                    FOOTER
                ================================================== */}

                {filteredBranches.length > 0 && (

                    <div className="branch-table-footer">

                        <div className="text-muted small">

                            <i className="bi bi-info-circle me-1"></i>

                            Showing {filteredBranches.length} branch
                            {filteredBranches.length !== 1 ? "es" : ""}

                        </div>


                        <div className="text-muted small">

                            Click a branch name or{" "}

                            <strong>Performance</strong>{" "}

                            to view detailed branch statistics.

                        </div>

                    </div>

                )}

            </div>

        </div>
    );
}

export default Branches;