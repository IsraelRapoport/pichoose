// 📌 טעינת המודולים
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

require("../src/utils/logger"); // ✅ מתקן כיוון הדפסות בעברית

console.log("🔍 ENV LOADED:", process.env.PORT, process.env.DB_USER);

const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

// 📌 Middlewares
app.use(cors({
    origin: '*', // אפשר גישה מכל דומיין (לצורכי פיתוח)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: "10mb" })); // תמיכה בקבצי JSON גדולים
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 📌 הגדרת תיקיית תמונות סטטית - שימוש בנתיב מוחלט
const uploadsDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads");
console.log("📁 נתיב תיקיית האחסון בשרת:", uploadsDir);

// וידוא שתיקיית האחסון קיימת
if (!fs.existsSync(uploadsDir)) {
    try {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log("✅ תיקיית uploads נוצרה בהצלחה:", uploadsDir);
    } catch (error) {
        console.error("❌ שגיאה ביצירת תיקיית uploads:", error);
    }
}

// הגדרת נתיב לגישה לתמונות דרך ה-URL
const imagesPath = process.env.IMAGE_PATH || "/images";
app.use(imagesPath, express.static(uploadsDir));
console.log(`🔗 נתיב לגישה לתמונות: ${imagesPath} -> ${uploadsDir}`);

// טיפול בשגיאות עבור קבצים לא קיימים
app.use(imagesPath, (req, res, next) => {
    res.status(404).send('התמונה לא נמצאה');
});

// 📌 בדיקת חיבור למסד הנתונים
db.getConnection()
    .then(() => console.log("✅ Connected to database"))
    .catch((err) => {
        console.error("❌ Database connection failed:", err);
        process.exit(1); // אם אין חיבור למסד הנתונים, עוצרים את השרת
    });

// 📌 חיבור הנתיבים לשרת
app.use("/api/auth", require("./routes/auth")); // ניהול התחברות והרשמה
app.use("/api/clients", require("./routes/clients")); // ✅ ניהול לקוחות
app.use("/api/images", require("./routes/images")); // ✅ ניהול תמונות
app.use("/api/events", require("./routes/events"));

// 📌 בדיקת חיבור לשרת
app.get("/", (req, res) => {
    res.send("📡 Backend is running...");
});

// 📌 טיפול בשגיאות כלליות
app.use((err, req, res, next) => {
    console.error("❌ שגיאת שרת:", err);
    res.status(500).json({ error: "אירעה שגיאה בשרת. נסה שוב מאוחר יותר." });
});

// 📌 הפעלת השרת
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
}).on("error", (err) => {
    console.error("❌ Server failed to start:", err);
});

