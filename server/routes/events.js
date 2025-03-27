const express = require("express");
const router = express.Router();
const db = require("../db");

// 📌 חיפוש אירועים לפי שם לקוח או שם צלם
router.get("/search", async (req, res) => {
    try {
        const searchQuery = req.query.query;
        
        if (!searchQuery || searchQuery.trim() === "") {
            return res.status(400).json({ error: "נא להזין טקסט לחיפוש" });
        }
        
        console.log(`מבצע חיפוש עבור: "${searchQuery}"`);
        
        // חיפוש בשם הלקוח או בשם הצלם (מטבלת users)
        const query = `
            SELECT 
                c.id, 
                c.name, 
                c.phone AS phone,
                c.email, 
                c.event_type, 
                c.event_date, 
                c.code,
                c.status,
                c.photographer_id,
                u.name AS photographer_name  
            FROM 
                clients c
            JOIN 
                users u ON c.photographer_id = u.id
            WHERE 
                c.name LIKE ? OR u.name LIKE ?
            ORDER BY 
                c.event_date DESC
        `;
        
        const searchPattern = `%${searchQuery}%`;
        const [results] = await db.query(query, [searchPattern, searchPattern]);
        
        console.log(`נמצאו ${results.length} תוצאות`);
        
        if (results.length === 0) {
            return res.status(204).end(); // אין תוכן
        }
        
        // הסרת סיסמאות ומידע רגיש מהתוצאות
        const cleanedResults = results.map(result => ({
            ...result,
            password: undefined // למקרה שיש שדה סיסמה בתוצאות
        }));
        
        res.json(cleanedResults);
    } catch (error) {
        console.error("❌ שגיאה בחיפוש אירועים:", error);
        res.status(500).json({ error: "שגיאה בשרת, נסה שוב מאוחר יותר." });
    }
});

// 📌 אימות קוד גישה לאירוע
router.post("/:eventId/validate", async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const { password } = req.body;
        
        console.log(`בודק קוד גישה לאירוע ${eventId}: ${password}`);
        
        if (!password) {
            return res.status(400).json({ error: "נא להזין קוד גישה", valid: false });
        }
        
        // בדיקה אם קוד הגישה תואם לאירוע
        const [event] = await db.query(
            "SELECT * FROM clients WHERE id = ? AND code = ?",
            [eventId, password]
        );
        
        const isValid = event.length > 0;
        console.log(`תוצאת אימות: ${isValid ? 'תקין' : 'לא תקין'}`);
        
        res.json({ valid: isValid });
    } catch (error) {
        console.error("❌ שגיאה באימות קוד גישה:", error);
        res.status(500).json({ error: "שגיאה בשרת, נסה שוב מאוחר יותר.", valid: false });
    }
});

module.exports = router;