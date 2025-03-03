import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/Header.css";
import cameraImg from "../styles/camera.png"; // ייבוא התמונה

function Header() {
    const navigate = useNavigate();
    const location = useLocation(); // ✅ מאזין לשינוי כתובת ה-URL
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));

    // ✅ מעדכן את המשתמש המחובר בכל שינוי במסלול (URL)
    useEffect(() => {
        setIsAuthenticated(!!localStorage.getItem("token"));
    }, [location]); // ✅ כפתור "התנתק" יתעדכן אוטומטית בכל מעבר דף

    const handleLogout = () => {
        localStorage.removeItem("token"); // מחיקת הטוקן
        setIsAuthenticated(false); // עדכון מיידי של המצב
        navigate("/"); // מעבר לדף ההתחברות
    };

    return (
        <div className="header">
            {/* ✅ כפתור "התנתק" יוצג רק אם המשתמש מחובר */}
            {isAuthenticated && (
                
                
                <p className="logout-link" onClick={handleLogout}>
                    התנתק
                </p>
            )}

            <div className="header-content">
                <img src={cameraImg} alt="Camera" className="header-image" />
                <Link to="/" className="main-title">
                    PiChoose - בחירה מושלמת
                </Link>
            </div>
        </div>
    );
}

export default Header;
