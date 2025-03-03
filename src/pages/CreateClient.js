import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addClient, getCurrentUser } from "../utils/api";
import "../styles/CreateClient.css";

function CreateClient() {
    const navigate = useNavigate();

    // משתני טופס
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [eventType, setEventType] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [code, setCode] = useState("");
    const [photographerId, setPhotographerId] = useState(null); // מזהה הצלם המחובר

    useEffect(() => {
        // קבלת המשתמש המחובר והגדרת photographer_id
        const fetchUser = async () => {
            try {
                const user = await getCurrentUser();
                setPhotographerId(user.id); // שמירת ה-ID של המשתמש המחובר
            } catch (error) {
                console.error("❌ שגיאה בקבלת פרטי המשתמש:", error);
            }
        };
        fetchUser();
    }, []);

    const handleCreateClient = async () => {
        if (!name || !phone || !email || !eventType || !eventDate || !code || !photographerId) {
            alert("נא למלא את כל השדות");
            return;
        }
        try {
            await addClient({ name, phone, email, event_type: eventType, event_date: eventDate, code, photographer_id: photographerId });
            alert("✅ לקוח נוסף בהצלחה!");
            navigate("/dashboard");
        } catch (error) {
            console.error("❌ שגיאה ביצירת לקוח:", error);
            alert("❌ אירעה שגיאה. נסה שוב.");
        }
    };

    return (
        <div className="create-client-container">
            <h1>➕ יצירת לקוח חדש</h1>
            <div className="create-client-form">
                <input type="text" placeholder="שם הלקוח" value={name} onChange={(e) => setName(e.target.value)} />
                <input type="text" placeholder="טלפון" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <input type="email" placeholder="אימייל" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input type="text" placeholder="סוג אירוע" value={eventType} onChange={(e) => setEventType(e.target.value)} />
                
                <div className="date-input-container">
                    <label>📅 תאריך האירוע</label>
                    <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                </div>

                <input type="text" placeholder="קוד לקוח" value={code} onChange={(e) => setCode(e.target.value)} />
                <button className="create-client-btn" onClick={handleCreateClient}>➕ צור לקוח</button>
                <button className="cancel-btn" onClick={() => navigate("/dashboard")}>❌ ביטול</button>
            </div>
        </div>
    );
}

export default CreateClient;
