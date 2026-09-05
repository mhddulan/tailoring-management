import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            console.log("Sending login request...");

            const response = await api.post("login/", {
                username: username.trim(),
                password: password,
            });

            console.log("LOGIN STATUS:", response.status);
            console.log("LOGIN DATA:", response.data);

            const data = response.data;

            if (!data.success || !data.token) {
                setError("Login response is invalid.");
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            console.log("TOKEN SAVED");
            console.log("USER SAVED");

            if (data.user.dashboard === "admin") {
                navigate("/dashboard");
            } else if (data.user.dashboard === "branch") {
                navigate("/branch-dashboard");
            } else {
                setError("Unknown dashboard role.");
            }

        } catch (err) {
            console.error("LOGIN ERROR:", err);

            console.error(
                "STATUS:",
                err.response?.status
            );

            console.error(
                "DATA:",
                err.response?.data
            );

            setError(
                err.response?.data?.message ||
                "Unable to login. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">

            <h1>Tailoring Management</h1>

            <form onSubmit={handleSubmit}>

                <div>
                    <label>Username</label>

                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        required
                    />
                </div>

                <div>
                    <label>Password</label>

                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                    />
                </div>

                {error && (
                    <p>{error}</p>
                )}

                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>

            </form>

        </div>
    );
}

export default Login;