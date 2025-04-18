import './App.css';
import Navbar from './components/Navbar';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Pull from './pages/pull'
import Home from './pages/home'
import Show from './pages/show'
import Login from './pages/login'
import ShowST from './pages/showst'
import ShowLD from './pages/showld'
import PullST from './pages/pullst'
import PullLD from './pages/pullld'
import ShowReport from './pages/showreport'
import PullSuc from './pages/pullsuccess'
import HomeAdmin from './pages/homeadmin'
import Signin from './pages/register'
import Member from './pages/member'
import Pullwait from './pages/pullwaiting'

function PrivateRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {

  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    const checkAuth = () => setIsAuthenticated(!!localStorage.getItem("token"));
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  function LayoutWithNavbar({ children }) {
    const location = useLocation();
    const showNavbar = isAuthenticated && location.pathname !== "/";
    return (
      <>
        {showNavbar && <Navbar setIsAuthenticated={setIsAuthenticated} />}
        {children}
      </>
    );
  }

  return (
    <div className="Containner">
      <Router>
        <LayoutWithNavbar>
          <Routes>
            {/* หน้า Login เป็นหน้าเริ่มต้น */}
            <Route 
              path="/" 
              element={<Login setIsAuthenticated={setIsAuthenticated} />} 
            />
            {/* Redirect ไปหน้าหลักหลัง login */}
            <Route 
              path="/dashboard" 
              element={
                isAuthenticated 
                  ? <Navigate to={localStorage.getItem("role") === "Dev" || localStorage.getItem("role") === "Admin" ? "/homeAdmin" : "/home"} replace /> 
                  : <Navigate to="/" replace />
              } 
            />
            <Route path="/register" element={<PrivateRoute allowedRoles={["Dev"]}><Signin /></PrivateRoute>} />
            <Route path="/member" element={<PrivateRoute allowedRoles={["Dev"]}><Member /></PrivateRoute>} />
            <Route path="/home" element={<PrivateRoute allowedRoles={["Dev", "User"]}><Home /></PrivateRoute>} />
            <Route path="/homeAdmin" element={<PrivateRoute allowedRoles={["Dev", "Admin"]}><HomeAdmin /></PrivateRoute>} />
            <Route path="/pull" element={<PrivateRoute allowedRoles={["Dev", "Admin", "User"]}><Pull /></PrivateRoute>} />
            <Route path="/show" element={<PrivateRoute allowedRoles={["Dev", "Admin", "User"]}><Show /></PrivateRoute>} />
            <Route path="/showst" element={<PrivateRoute allowedRoles={["Dev", "Admin", "User"]}><ShowST /></PrivateRoute>} />
            <Route path="/showld" element={<PrivateRoute allowedRoles={["Dev", "Admin", "User"]}><ShowLD /></PrivateRoute>} />
            <Route path="/pullst" element={<PrivateRoute allowedRoles={["Dev", "Admin", "User"]}><PullST /></PrivateRoute>} />
            <Route path="/pullld" element={<PrivateRoute allowedRoles={["Dev", "Admin", "User"]}><PullLD /></PrivateRoute>} />
            <Route path="/showreport" element={<PrivateRoute allowedRoles={["Dev", "Admin", "User"]}><ShowReport /></PrivateRoute>} />
            <Route path="/pullsuccess" element={<PrivateRoute allowedRoles={["Dev", "Admin", "User"]}><PullSuc /></PrivateRoute>} />
            <Route path="/pullwaiting" element={<PrivateRoute allowedRoles={["Dev", "Admin"]}><Pullwait /></PrivateRoute>}/>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LayoutWithNavbar>
      </Router>
    </div>
  );
}

export default App;
