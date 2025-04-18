import '../App.css';
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logohide from "../components/hide.png";
import logoshow from "../components/show.png";

const Login = ({ setIsAuthenticated }) => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const loginclick = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const response = await fetch("http://localhost:5000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Login failed");
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("role", data.role);  // ✅ บันทึก role
            setIsAuthenticated(true);  // ✅ อัปเดต isAuthenticated
            navigate(data.role === "Dev" || data.role === "Admin" ? "/homeAdmin" : "/home", { replace: true });

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="login-container">
            <div className="welcome-section">
                <h1>WELCOME TO</h1>
                <h1 style={{ marginTop: '410px' }}>ICE CREAM</h1>
                <h1>FREEZER</h1>
            </div>
            <div className="login-section">
                <h2>LOGIN</h2>
                {error && <p className="error-text" style={{ color: 'red' }}>{error}</p>}
                <form className="login-form" onSubmit={loginclick}>
                    <label htmlFor="username">Username</label>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    <label htmlFor="password">Password</label>
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <img src={showPassword ? logoshow : logohide}
                        style={{ width: '15px', marginTop: '-30px', marginLeft: '360px', cursor: 'pointer' }}
                        alt={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword(!showPassword)}
                    />
                    <button type="submit" style={{ fontWeight: 'lighter'}}>
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
