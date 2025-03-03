const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const db = require("../db");
// const authenticateUser = require("../middleware/authMiddleware"); // ✅ ייבוא ה-Middleware
const { authenticateUser } = require("../middleware/authMiddleware");



const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "temporary_secret_12345"; // מפתח ברירת מחדל אם לא הוגדר

// 📌 רישום משתמש חדש
router.post(
    "/register",
    [
        body("name").notEmpty().withMessage("שם הוא שדה חובה"),
        body("email").isEmail().withMessage("אימייל לא תקין"),
        body("password").isLength({ min: 4 }).withMessage("הסיסמה חייבת להיות לפחות 4 תווים"), 
        body("phone_number").notEmpty().withMessage("מספר טלפון הוא חובה"),
        body("business_name").notEmpty().withMessage("שם העסק הוא חובה"),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.error("❌ שגיאות בבקשת ההרשמה:", errors.array());
            return res.status(400).json({ errors: errors.array() }); 
        }

        const { name, email, password, phone_number, business_name } = req.body;

        try {
            const [existingUsers] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
            if (existingUsers.length > 0) {
                console.error("❌ אימייל כבר קיים:", email);
                return res.status(400).json({ error: "האימייל כבר קיים במערכת" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            await db.query(
                "INSERT INTO users (name, email, password, phone_number, business_name) VALUES (?, ?, ?, ?, ?)",
                [name, email, hashedPassword, phone_number, business_name]
            );

            console.log("✅ משתמש נרשם בהצלחה:", email);
            res.status(201).json({ message: "משתמש נוצר בהצלחה" });
        } catch (error) {
            console.error("❌ שגיאה בהרשמה:", error);
            res.status(500).json({ error: "שגיאה בשרת, נסה שוב מאוחר יותר." });
        }
    }
);

// 📌 התחברות משתמש
router.post(
    "/login",
    [
        body("email").isEmail().withMessage("אימייל לא תקין"),
        body("password").notEmpty().withMessage("סיסמה היא חובה"),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.error("❌ שגיאות בבקשת ההתחברות:", errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
            if (users.length === 0) {
                console.error("❌ ניסיון התחברות כושל - משתמש לא נמצא:", email);
                return res.status(400).json({ error: "אימייל או סיסמה שגויים" });
            }

            const user = users[0];

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                console.error("❌ ניסיון התחברות כושל - סיסמה שגויה:", email);
                return res.status(400).json({ error: "אימייל או סיסמה שגויים" });
            }

            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });

            console.log("✅ התחברות מוצלחת:", email);
            res.json({ message: "התחברות מוצלחת", token, user });
        } catch (error) {
            console.error("❌ שגיאה בהתחברות:", error);
            res.status(500).json({ error: "שגיאה בשרת, נסה שוב מאוחר יותר." });
        }
    }
);

// 📌 נתיב מאובטח לקבלת פרטי המשתמש המחובר (דורש JWT)
router.get("/me", authenticateUser, async (req, res) => {
    try {
        const [users] = await db.query(
            "SELECT id, name, email, phone_number, business_name FROM users WHERE id = ?", 
            [req.user.userId]
        );
        if (users.length === 0) {
            return res.status(404).json({ error: "המשתמש לא נמצא" });
        }
        res.json(users[0]);
    } catch (error) {
        console.error("❌ שגיאה בקבלת פרטי המשתמש:", error);
        res.status(500).json({ error: "שגיאה בשרת" });
    }
});

module.exports = router;
