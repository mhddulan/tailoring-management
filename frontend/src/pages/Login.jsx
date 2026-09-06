import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await api.post("login/", {
                username,
                password,
            });

            if (response.data.token) {
                localStorage.setItem("token", response.data.token);

                if (response.data.user) {
                    localStorage.setItem(
                        "user",
                        JSON.stringify(response.data.user)
                    );
                }

                navigate("/dashboard", { replace: true });
            } else {
                setError("Login token was not returned.");
            }

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.error ||
                err.response?.data?.detail ||
                "Invalid username or password."
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0F172A"
        }}>

            <div style={{
                width: "100%",
                maxWidth: "440px",
                background: "white",
                padding: "40px",
                borderRadius: "16px"
            }}>

                <h2 style={{
                    textAlign: "center",
                    marginBottom: "10px"
                }}>
                    ✂ Stitching Pro
                </h2>

                <p style={{
                    textAlign: "center",
                    color: "#64748B",
                    marginBottom: "30px"
                }}>
                    Tailoring Management ERP
                </p>

                {error && (
                    <div style={{
                        background: "#fee2e2",
                        color: "#991b1b",
                        padding: "12px",
                        borderRadius: "8px",
                        marginBottom: "20px"
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div style={{ marginBottom: "20px" }}>
                        <label>Username</label>

                        <input
                            type="text"
                            value={username}
                            onChange={(e) =>
                                setUsername(e.target.value)
                            }
                            placeholder="Enter username"
                            required
                            autoFocus
                            style={{
                                width: "100%",
                                padding: "12px",
                                marginTop: "6px",
                                border: "1px solid #ddd",
                                borderRadius: "8px"
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                        <label>Password</label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            placeholder="Enter password"
                            required
                            style={{
                                width: "100%",
                                padding: "12px",
                                marginTop: "6px",
                                border: "1px solid #ddd",
                                borderRadius: "8px"
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "13px",
                            border: "none",
                            borderRadius: "8px",
                            background: "#2563EB",
                            color: "white",
                            fontWeight: "600",
                            cursor: "pointer"
                        }}
                    >
                        {loading ? "Signing In..." : "Sign In →"}
                    </button>

                </form>

                <p style={{
                    textAlign: "center",
                    marginTop: "25px",
                    color: "#94A3B8",
                    fontSize: "13px"
                }}>
                    © 2026 Stitching Pro • Tailoring Management ERP
                </p>

            </div>

        </div>
    );
}

export default Login;