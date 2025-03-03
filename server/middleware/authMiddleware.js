const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "temporary_secret_12345"; // מפתח סודי לברירת מחדל

// 📌 Middleware לאימות משתמשים על בסיס JWT
const authenticateUser = (req, res, next) => {
    const authHeader = req.header("Authorization"); // קבלת ה-Authorization Header

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "גישה נדחתה, אין טוקן תקף" });
    }

    const token = authHeader.split(" ")[1]; // הוצאת הטוקן מתוך ה-Header

    try {
        // בדיקת הטוקן
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = { userId: decoded.userId }; // שמירת ה-userId בלבד בבקשה
        next(); // המשך לבקשה הבאה
    } catch (error) {
        console.error("❌ שגיאה באימות JWT:", error.message);
        return res.status(403).json({ error: "טוקן לא תקף או פג תוקף" });
    }
};

module.exports = { authenticateUser }; // ✅ ייצוא נכון
