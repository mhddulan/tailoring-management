import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function Login() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await api.post("login/", {
                username: username.trim(),
                password: password,
            });

            console.log("Login response:", response.data);

            if (response.data.success && response.data.token) {

                // Save authentication token
                localStorage.setItem(
                    "token",
                    response.data.token
                );

                // Save user information
                localStorage.setItem(
                    "user",
                    JSON.stringify(response.data.user)
                );

                // Redirect based on dashboard
                if (
                    response.data.user.dashboard === "branch"
                ) {
                    navigate("/branch-dashboard");
                } else {
                    navigate("/dashboard");
                }

            } else {

                setError(
                    response.data.message ||
                    "Invalid username or password."
                );
            }

        } catch (error) {

            console.error("Login error:", error);

            if (error.response) {

                setError(
                    error.response.data?.message ||
                    error.response.data?.error ||
                    "Invalid username or password."
                );

            } else {

                setError(
                    "Unable to connect to the server. Please try again."
                );
            }

        } finally {

            setLoading(false);
        }
    };

    return (
        <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">

            <div
                className="card shadow-lg border-0 rounded-4"
                style={{
                    width: "100%",
                    maxWidth: "430px",
                }}
            >

                <div className="card-body p-4 p-md-5">

                    {/* Header */}

                    <div className="text-center mb-4">

                        <div
                            className="bg-dark text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                            style={{
                                width: "70px",
                                height: "70px",
                                fontSize: "28px",
                            }}
                        >
                            <i className="bi bi-scissors"></i>
                        </div>

                        <h2 className="fw-bold mb-1">
                            Tailoring Management
                        </h2>

                        <p className="text-muted mb-0">
                            Sign in to your account
                        </p>

                    </div>


                    {/* Error */}

                    {error && (
                        <div
                            className="alert alert-danger"
                            role="alert"
                        >
                            <i className="bi bi-exclamation-circle me-2"></i>
                            {error}
                        </div>
                    )}


                    {/* Login Form */}

                    <form onSubmit={handleSubmit}>

                        {/* Username */}

                        <div className="mb-3">

                            <label
                                htmlFor="username"
                                className="form-label fw-semibold"
                            >
                                Username
                            </label>

                            <div className="input-group">

                                <span className="input-group-text">
                                    <i className="bi bi-person"></i>
                                </span>

                                <input
                                    id="username"
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter username"
                                    value={username}
                                    onChange={(e) =>
                                        setUsername(e.target.value)
                                    }
                                    required
                                    autoComplete="username"
                                />

                            </div>

                        </div>


                        {/* Password */}

                        <div className="mb-3">

                            <label
                                htmlFor="password"
                                className="form-label fw-semibold"
                            >
                                Password
                            </label>

                            <div className="input-group">

                                <span className="input-group-text">
                                    <i className="bi bi-lock"></i>
                                </span>

                                <input
                                    id="password"
                                    type="password"
                                    className="form-control"
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                    autoComplete="current-password"
                                />

                            </div>

                        </div>


                        {/* Forgot Password */}

                        <div className="text-end mb-4">

                            <Link
                                to="/forgot-password"
                                className="text-decoration-none"
                            >
                                Forgot Password?
                            </Link>

                        </div>


                        {/* Login Button */}

                        <button
                            type="submit"
                            className="btn btn-dark w-100 py-2 fw-semibold"
                            disabled={loading}
                        >

                            {loading ? (
                                <>
                                    <span
                                        className="spinner-border spinner-border-sm me-2"
                                        role="status"
                                        aria-hidden="true"
                                    ></span>

                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-box-arrow-in-right me-2"></i>
                                    Login
                                </>
                            )}

                        </button>

                    </form>


                    {/* Footer */}

                    <div className="text-center mt-4">

                        <small className="text-muted">
                            Tailoring Management System
                        </small>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Login;