import '../App.css';
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("User"); // Default role เป็น User
    const [error, setError] = useState("");

    const registerClick = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const response = await fetch("http://localhost:5000/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, role }) // ส่ง username, password และ role ไปยัง backend
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Registration failed");
            }

            alert("✅ Registration successful");
            navigate("/", { replace: true });
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
                <h2>SIGN UP</h2>
                {error && <p className="error-text" style={{ color: 'red' }}>{error}</p>}
                <form className="login-form" onSubmit={registerClick}>
                    <label htmlFor="username">Username</label>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        required 
                    />
                    
                    <label htmlFor="password">Password</label>
                    <input 
                        type="text" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />  
                    <label htmlFor="role" style={{marginTop: '30px'}}>Role</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} style={{height: '30px'}}>
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                        <option value="Dev">Dev</option>
                    </select>
                    
                    <button type="submit" style={{ fontWeight: 'lighter' }}>
                        Sign Up
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Register;
