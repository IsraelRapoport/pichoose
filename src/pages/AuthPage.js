import { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ ייבוא הפונקציה לניווט
import "../styles/AuthPage.css";

const AuthPage = () => {
    const navigate = useNavigate(); // ✅ יצירת פונקציית ניווט
    const [isRegistering, setIsRegistering] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone_number: "",
        business_name: ""
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        const endpoint = isRegistering 
            ? "http://localhost:5000/api/auth/register" 
            : "http://localhost:5000/api/auth/login";

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    isRegistering 
                        ? formData 
                        : { email: formData.email, password: formData.password }
                )
            });

            const data = await response.json();
            console.log("📡 תגובת השרת:", data);

            if (!response.ok) {
                if (data.errors) {
                    setError(data.errors.map(err => err.msg).join(", "));
                } else {
                    setError(data.error || "שגיאה לא ידועה");
                }
                return;
            }

            // ✅ שמירת הטוקן ב-LocalStorage כדי לשמור התחברות
            if (data.token) {
                localStorage.setItem("token", data.token);
            }

            setMessage(isRegistering ? "✅ ההרשמה בוצעה בהצלחה!" : "✅ התחברת בהצלחה!");

            // ✅ ניווט לעמוד ה-Dashboard אחרי התחברות מוצלחת
            setTimeout(() => {
                navigate("/dashboard"); // ✅ ניווט אחרי 1.5 שניות
            }, 1000);

        } catch (error) {
            console.error("❌ שגיאה בשליחת בקשה:", error);
            setError("⚠ שגיאת שרת, נסה שוב מאוחר יותר.");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>{isRegistering ? "הרשמה" : "התחברות"}</h2>
                {message && <p style={{ color: "green" }}>{message}</p>}
                {error && <p style={{ color: "red" }}>{error}</p>}
                <form onSubmit={handleSubmit} className="auth-input-container">
                    {isRegistering && (
                        <input type="text" name="name" placeholder="שם מלא" value={formData.name} onChange={handleChange} required />
                    )}
                    <input type="email" name="email" placeholder="אימייל" value={formData.email} onChange={handleChange} required />
                    
                    <input 
                        type="password" 
                        name="password" 
                        placeholder={isRegistering ? "סיסמה (לפחות 4 תווים)" : "סיסמה"} 
                        value={formData.password} 
                        onChange={handleChange} 
                        required 
                    />

                    {isRegistering && (
                        <>
                            <input type="text" name="phone_number" placeholder="טלפון" value={formData.phone_number} onChange={handleChange} required />
                            <input type="text" name="business_name" placeholder="שם העסק" value={formData.business_name} onChange={handleChange} required />
                        </>
                    )}
                    <button type="submit">{isRegistering ? "הירשם" : "התחבר"}</button>
                </form>
                <p onClick={() => setIsRegistering(!isRegistering)} style={{ cursor: "pointer", color: "blue" }}>
                    {isRegistering ? "כבר רשום? התחבר כאן" : "אין לך חשבון? הירשם כאן"}
                </p>
            </div>
        </div>
    );
};

export default AuthPage;
