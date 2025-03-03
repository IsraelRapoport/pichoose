// 📌 טעינת המודולים
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

require("../src/utils/logger"); // ✅ מתקן כיוון הדפסות בעברית

console.log("🔍 ENV LOADED:", process.env.PORT, process.env.DB_USER);

const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

// 📌 Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" })); // תמיכה בקבצי JSON גדולים
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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

// 📌 בדיקת חיבור לשרת
app.get("/", (req, res) => {
    res.send("📡 Backend is running...");
});

// 📌 הפעלת השרת
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
}).on("error", (err) => {
    console.error("❌ Server failed to start:", err);
});
