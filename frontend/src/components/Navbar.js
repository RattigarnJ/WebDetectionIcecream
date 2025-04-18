import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role"); // ✅ ลบ role ออกจาก localStorage
    setIsAuthenticated(false); // ✅ อัปเดต state
    navigate("/", { replace: true });
  };

  const homePath = role === "Dev" || role === "Admin" ? "/homeAdmin" : "/home";

  return (
    <nav className="navbar">
      <div className="navbar-left">
      <Link to={homePath}>
          <p style={{ fontWeight: "bold", fontSize: "16px", cursor: 'pointer', color: '#252525' }}>
            ICE CREAM FREEZER
          </p>
      </Link>
      </div>
      <div className="navbar-right">
        <ul className="nav-links">
          {role === "Dev" && ( // ✅ ซ่อน "PULL" สำหรับ User
            <li>
              <Link to="/member">MEMBER</Link>
            </li>
          )}
          {role !== "User" && ( // ✅ ซ่อน "PULL" สำหรับ User
            <li>
              <Link to="/pull">IMPORT IMAGES</Link>
            </li>
          )}
          <li>
            <Link to="/show">SHOW REPORT</Link>
          </li>
          {role === "Dev" && ( // ✅ ซ่อน "PULL" สำหรับ User
          <li>
            <Link to="/register">SIGN UP</Link>
          </li>
          )}
          {/* <li style={{backgroundColor: 'white', borderRadius: '50px', padding: '7px 6px', marginLeft: '8px', display: 'inline-block'}}> */}
            <li>
            <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", color: "red", fontSize: '16px', fontWeight: 'bold' }}>
              LOGOUT
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
