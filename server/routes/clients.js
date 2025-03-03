const express = require("express");
const db = require("../db");
const { authenticateUser } = require("../middleware/authMiddleware"); // ✅ ייבוא middleware לאימות משתמשים

const router = express.Router();

// 📌 קבלת רשימת כל הלקוחות (דורש טוקן)
router.get("/", authenticateUser, async (req, res) => {
    try {
        const [clients] = await db.query("SELECT * FROM clients WHERE photographer_id = ?", [req.user.userId]);
        res.json(clients);
    } catch (error) {
        console.error("❌ שגיאה בקבלת רשימת לקוחות:", error);
        res.status(500).json({ error: "שגיאה בשרת, נסה שוב מאוחר יותר." });
    }
});

// 📌 יצירת לקוח חדש (דורש טוקן)
router.post("/", authenticateUser, async (req, res) => {
    const { name, phone, email, event_type, event_date, code } = req.body;
    const photographer_id = req.user.userId; // מזהה הצלם מהטוקן

    if (!name || !phone || !email || !event_type || !event_date || !code || !photographer_id) {
        return res.status(400).json({ error: "נא למלא את כל השדות" });
    }

    try {
        const [result] = await db.query(
            "INSERT INTO clients (name, phone, email, photographer_id, event_type, event_date, code) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [name, phone, email, photographer_id, event_type, event_date, code]
        );

        res.status(201).json({ message: "✅ לקוח נוסף בהצלחה!", clientId: result.insertId });
    } catch (error) {
        console.error("❌ שגיאה בהוספת לקוח:", error);
        res.status(500).json({ error: "שגיאה בשרת, נסה שוב מאוחר יותר." });
    }
});

// 📌 קבלת סטטוס לקוח לפי ID (דורש טוקן)
router.get("/:id/status", authenticateUser, async (req, res) => {
    const clientId = req.params.id;

    try {
        const [client] = await db.query("SELECT status FROM clients WHERE id = ?", [clientId]);

        if (client.length === 0) {
            return res.status(404).json({ error: "לקוח לא נמצא" });
        }

        res.json({ status: client[0].status });
    } catch (error) {
        console.error("❌ שגיאה בקבלת סטטוס לקוח:", error);
        res.status(500).json({ error: "שגיאה בשרת, נסה שוב מאוחר יותר." });
    }
});

// 📌 עדכון לקוח (דורש טוקן)
router.put("/:id", authenticateUser, async (req, res) => {
    const clientId = req.params.id;
    const { name, phone, email, event_type, event_date, code, status } = req.body;
    
    // בדיקה שהלקוח שייך לצלם המחובר
    try {
        const [clientCheck] = await db.query(
            "SELECT * FROM clients WHERE id = ? AND photographer_id = ?",
            [clientId, req.user.userId]
        );
        
        if (clientCheck.length === 0) {
            return res.status(404).json({ error: "לקוח לא נמצא או שאין לך הרשאות לעדכן אותו" });
        }
        
        // בניית מחרוזת עדכון דינמית - תעדכן רק את השדות שנשלחו
        let updateFields = [];
        let queryParams = [];
        
        if (name) {
            updateFields.push("name = ?");
            queryParams.push(name);
        }
        
        if (phone) {
            updateFields.push("phone = ?");
            queryParams.push(phone);
        }
        
        if (email) {
            updateFields.push("email = ?");
            queryParams.push(email);
        }
        
        if (event_type) {
            updateFields.push("event_type = ?");
            queryParams.push(event_type);
        }
        
        if (event_date) {
            updateFields.push("event_date = ?");
            queryParams.push(event_date);
        }
        
        if (code) {
            updateFields.push("code = ?");
            queryParams.push(code);
        }
        
        if (status) {
            updateFields.push("status = ?");
            queryParams.push(status);
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({ error: "לא נשלחו נתונים לעדכון" });
        }
        
        // הוספת clientId לסוף מערך הפרמטרים
        queryParams.push(clientId);
        
        const [result] = await db.query(
            `UPDATE clients SET ${updateFields.join(", ")} WHERE id = ?`,
            queryParams
        );
        
        res.json({ 
            message: "✅ לקוח עודכן בהצלחה!",
            affectedRows: result.affectedRows 
        });
    } catch (error) {
        console.error("❌ שגיאה בעדכון לקוח:", error);
        res.status(500).json({ error: "שגיאה בשרת, נסה שוב מאוחר יותר." });
    }
});

// 📌 מחיקת לקוח (דורש טוקן)
router.delete("/:id", authenticateUser, async (req, res) => {
    const clientId = req.params.id;
    
    try {
        // בדיקה שהלקוח שייך לצלם המחובר
        const [clientCheck] = await db.query(
            "SELECT * FROM clients WHERE id = ? AND photographer_id = ?",
            [clientId, req.user.userId]
        );
        
        if (clientCheck.length === 0) {
            return res.status(404).json({ error: "לקוח לא נמצא או שאין לך הרשאות למחוק אותו" });
        }
        
        // מחיקת התמונות הקשורות ללקוח (אם יש טבלה כזו)
        await db.query("DELETE FROM images WHERE client_id = ?", [clientId]);
        
        // מחיקת הלקוח
        const [result] = await db.query("DELETE FROM clients WHERE id = ?", [clientId]);
        
        res.json({ 
            message: "✅ לקוח נמחק בהצלחה!",
            affectedRows: result.affectedRows 
        });
    } catch (error) {
        console.error("❌ שגיאה במחיקת לקוח:", error);
        res.status(500).json({ error: "שגיאה בשרת, נסה שוב מאוחר יותר." });
    }
});

// 📌 עדכון סטטוס לקוח
router.put("/:id/status", authenticateUser, async (req, res) => {
    const clientId = req.params.id;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: "חובה לשלוח סטטוס חדש" });
    }

    try {
        const [result] = await db.query(
            "UPDATE clients SET status = ? WHERE id = ?",
            [status, clientId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "לקוח לא נמצא" });
        }

        res.json({ message: "✅ סטטוס עודכן בהצלחה!" });
    } catch (error) {
        console.error("❌ שגיאה בעדכון סטטוס לקוח:", error);
        res.status(500).json({ error: "שגיאה בשרת, נסה שוב מאוחר יותר." });
    }
});

module.exports = router;