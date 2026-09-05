import "./ModulePage.css";

function ModulePage({
    title,
    subtitle,
    icon = "bi-grid",
    buttonText = "Add New",
    columns = [],
    rows = [],
}) {
    return (
        <div className="module-page">

            <div className="module-header">
                <div>
                    <h2>
                        <i className={`bi ${icon}`}></i>
                        {title}
                    </h2>
                    <p>{subtitle}</p>
                </div>

                <button
                    className="module-add-btn"
                    onClick={() => alert(`${buttonText} feature will be connected next.`)}
                >
                    <i className="bi bi-plus-lg"></i>
                    {buttonText}
                </button>
            </div>

            <div className="module-stats">

                <div className="module-stat">
                    <i className="bi bi-list-check"></i>
                    <div>
                        <span>Total Records</span>
                        <strong>{rows.length}</strong>
                    </div>
                </div>

                <div className="module-stat">
                    <i className="bi bi-check-circle"></i>
                    <div>
                        <span>Active</span>
                        <strong>{rows.length}</strong>
                    </div>
                </div>

                <div className="module-stat">
                    <i className="bi bi-clock-history"></i>
                    <div>
                        <span>Pending</span>
                        <strong>0</strong>
                    </div>
                </div>

            </div>

            <div className="module-card">

                <div className="module-card-header">
                    <div>
                        <h5>{title} List</h5>
                        <span>Manage your {title.toLowerCase()} here</span>
                    </div>

                    <button
                        className="module-refresh"
                        onClick={() => window.location.reload()}
                    >
                        <i className="bi bi-arrow-clockwise"></i>
                        Refresh
                    </button>
                </div>

                {rows.length === 0 ? (
                    <div className="module-empty">
                        <i className={`bi ${icon}`}></i>
                        <h5>No Records Found</h5>
                        <p>
                            No {title.toLowerCase()} records are available yet.
                        </p>
                    </div>
                ) : (
                    <div className="module-table-wrapper">

                        <table className="module-table">

                            <thead>
                                <tr>
                                    <th>#</th>

                                    {columns.map((column) => (
                                        <th key={column}>
                                            {column}
                                        </th>
                                    ))}

                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>

                                {rows.map((row, index) => (
                                    <tr key={index}>

                                        <td>{index + 1}</td>

                                        {columns.map((column) => (
                                            <td key={column}>
                                                {row[column] || "-"}
                                            </td>
                                        ))}

                                        <td>
                                            <button
                                                className="module-view-btn"
                                                onClick={() =>
                                                    alert("Details coming soon.")
                                                }
                                            >
                                                <i className="bi bi-eye-fill"></i>
                                            </button>
                                        </td>

                                    </tr>
                                ))}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

        </div>
    );
}

export default ModulePage;