import ModulePage from "../components/ModulePage";

function Reports() {
    return (
        <ModulePage
            title="Reports"
            subtitle="Business reports, sales and performance analysis."
            icon="bi-bar-chart-fill"
            buttonText="Generate Report"
            columns={[
                "Report",
                "Period",
                "Records",
                "Generated",
                "Status",
            ]}
            rows={[]}
        />
    );
}

export default Reports;