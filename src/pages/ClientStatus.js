import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getClientStatus, sendComment } from "../utils/api";

function ClientStatus() {
    const { id } = useParams(); // מזהה הלקוח
    const [status, setStatus] = useState("");
    const [comment, setComment] = useState("");

    useEffect(() => {
        async function fetchClientStatus() {
            try {
                const data = await getClientStatus(id);
                setStatus(data.status);
            } catch (error) {
                console.error("שגיאה בטעינת סטטוס לקוח:", error);
            }
        }
        fetchClientStatus();
    }, [id]);

    const handleSendComment = async () => {
        try {
            await sendComment(id, comment);
            alert("✅ ההערה נשלחה בהצלחה!");
            setComment("");
        } catch (error) {
            alert("❌ שגיאה בשליחת ההערה");
            console.error(error);
        }
    };

    return (
        <div className="main-container">
            <h1>🧑‍💼 מעקב סטטוס לקוח</h1>
            <p>סטטוס הלקוח: <strong>{status}</strong></p>

            <h3>✍️ שליחת הערה</h3>
            <textarea
                placeholder="כתוב כאן את ההערה שלך..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
            />
            <button onClick={handleSendComment} disabled={!comment.trim()}>
                📩 שלח הערה
            </button>
        </div>
    );
}

export default ClientStatus;
