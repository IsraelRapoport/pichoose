const express = require("express");
const router = express.Router();
const db = require("../db");
const { authenticateUser } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// קביעת נתיב התיקייה בצורה מוחלטת
const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads");
console.log("📁 נתיב תיקיית האחסון בקובץ images.js:", uploadDir);

// וידוא שתיקיית האחסון קיימת
if (!fs.existsSync(uploadDir)) {
    try {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log("✅ תיקיית uploads נוצרה בהצלחה:", uploadDir);
    } catch (error) {
        console.error("❌ שגיאה ביצירת תיקיית uploads:", error);
    }
}

// הגדרת אחסון מקומי עם multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // יצירת שם קובץ ייחודי עם חותמת זמן
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExt = path.extname(file.originalname);
        cb(null, uniqueSuffix + fileExt);
    }
});

// פילטר לסוגי קבצים מותרים
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("סוג קובץ לא נתמך! רק תמונות מסוג JPG, JPEG, PNG, GIF, WEBP מותרות."), false);
    }
};

// הגדרת multer לטיפול בקבצים
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // הגבלת גודל קובץ ל-10MB
    }
});

// 📌 העלאת תמונה חדשה
router.post("/upload", authenticateUser, upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "לא נבחר קובץ להעלאה" });
        }

        const { client_id, file_name, is_selected } = req.body;
        const photographer_id = req.user.userId;

        // שם הקובץ שנוצר בפועל
        console.log("📝 שם הקובץ שנוצר:", req.file.filename);
        
        // יצירת URL יחסי לתמונה - חשוב לשים לב שזה הנתיב שיישמר במסד הנתונים
        const imageUrl = `${process.env.IMAGE_PATH || '/images'}/${req.file.filename}`;
        console.log("🔗 הנתיב שיישמר במסד הנתונים:", imageUrl);

        // בדיקה שה-uploaded_at מוגדר כראוי
        const now = new Date();
        
        // הוספת רשומה למסד הנתונים עם תאריך העלאה מוגדר
        const [result] = await db.query(
            "INSERT INTO images (client_id, photographer_id, file_name, image_url, is_selected, uploaded_at) VALUES (?, ?, ?, ?, ?, ?)",
            [client_id, photographer_id, file_name, imageUrl, is_selected === "true" ? 1 : 0, now]
        );

        res.status(201).json({
            message: "✅ תמונה הועלתה בהצלחה!",
            image: {
                id: result.insertId,
                client_id,
                photographer_id,
                file_name,
                image_url: imageUrl,
                is_selected: is_selected === "true",
                uploaded_at: now
            }
        });
    } catch (error) {
        console.error("❌ שגיאה בהעלאת תמונה:", error);
        res.status(500).json({ error: "שגיאה בשרת, נסה שוב מאוחר יותר." });
    }
});

// 📌 קבלת כל התמונות של לקוח מסוים
router.get("/client/:clientId", authenticateUser, async (req, res) => {
    try {
        const clientId = req.params.clientId;
        const userId = req.user.userId;
        
        console.log(`👉 מנסה להביא תמונות ללקוח ${clientId} של הצלם ${userId}`);
        
        // בדיקה שהלקוח קיים ושייך לצלם
        const [clientCheck] = await db.query(
            "SELECT * FROM clients WHERE id = ? AND photographer_id = ?",
            [clientId, userId]
        );
        
        if (clientCheck.length === 0) {
            console.log(`❌ לקוח ${clientId} לא נמצא או לא שייך לצלם ${userId}`);
            return res.status(404).json({ error: "לקוח לא נמצא או שאין לך הרשאות" });
        }
        
        console.log(`✅ הלקוח נמצא והשיוך תקין, מביא תמונות...`);
        
        // קבלת כל התמונות
        const [images] = await db.query(
            "SELECT * FROM images WHERE client_id = ? ORDER BY uploaded_at DESC",
            [clientId]
        );
        
        console.log(`📊 נמצאו ${images?.length || 0} תמונות ללקוח ${clientId}`);
        
        if (images && images.length > 0) {
            console.log(`🖼️ דוגמה לתמונה ראשונה:`, JSON.stringify(images[0]));
        }
        
        // תמיד להחזיר מערך, גם אם הוא ריק
        const processedImages = Array.isArray(images) ? images : [];
        
        // התאמת ערכים - לטפל במקרה ש-uploaded_at הוא null ובערכים בוליאניים
        const processedWithDates = processedImages.map(img => ({
            ...img,
            is_selected: img.is_selected === 1 || img.is_selected === true ? true : false, // הבטחה שזה יהיה ערך בוליאני ולא 0/1
            uploaded_at: img.uploaded_at || new Date() // אם אין תאריך העלאה, השתמש בתאריך הנוכחי
        }));
        
        console.log(`✅ מחזיר ${processedWithDates.length} תמונות מעובדות`);
        
        res.json(processedWithDates);
    } catch (error) {
        console.error("❌ שגיאה בקבלת תמונות:", error);
        // במקרה של שגיאה, החזר מערך ריק במקום שגיאה
        res.json([]);
    }
});

// 📌 עדכון סטטוס בחירת תמונה
router.put("/:imageId/status", authenticateUser, async (req, res) => {
    try {
        const imageId = req.params.imageId;
        const { is_selected } = req.body;
        
        if (is_selected === undefined) {
            return res.status(400).json({ error: "חובה לציין סטטוס בחירה" });
        }
        
        // בדיקה שהתמונה קיימת ושייכת לצלם
        const [imageCheck] = await db.query(
            "SELECT i.* FROM images i JOIN clients c ON i.client_id = c.id WHERE i.id = ? AND c.photographer_id = ?",
            [imageId, req.user.userId]
        );
        
        if (imageCheck.length === 0) {
            return res.status(404).json({ error: "תמונה לא נמצאה או שאין לך הרשאות" });
        }
        
        // עדכון סטטוס הבחירה
        await db.query(
            "UPDATE images SET is_selected = ? WHERE id = ?",
            [is_selected ? 1 : 0, imageId]
        );
        
        res.json({
            message: "✅ סטטוס התמונה עודכן בהצלחה!",
            is_selected
        });
    } catch (error) {
        console.error("❌ שגיאה בעדכון סטטוס תמונה:", error);
        res.status(500).json({ error: "שגיאה בשרת, נסה שוב מאוחר יותר." });
    }
});

// 📌 מחיקת תמונה
router.delete("/:imageId", authenticateUser, async (req, res) => {
    try {
        const imageId = req.params.imageId;
        
        // בדיקה שהתמונה קיימת ושייכת לצלם
        const [images] = await db.query(
            "SELECT i.* FROM images i JOIN clients c ON i.client_id = c.id WHERE i.id = ? AND c.photographer_id = ?",
            [imageId, req.user.userId]
        );
        
        if (images.length === 0) {
            return res.status(404).json({ error: "תמונה לא נמצאה או שאין לך הרשאות" });
        }
        
        const image = images[0];
        
        try {
            // מחיקת הקובץ הפיזי מהשרת - אם הנתיב כולל את המיקום המלא, נחלץ רק את שם הקובץ
            if (image.image_url) {
                const imageFilename = image.image_url.split('/').pop();
                if (imageFilename) {
                    const imagePath = path.join(uploadDir, imageFilename);
                    console.log("🗑️ מוחק תמונה בנתיב:", imagePath);
                    
                    // בדיקה אם הקובץ קיים לפני מחיקתו
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                        console.log("✅ הקובץ נמחק בהצלחה");
                    } else {
                        console.warn("⚠️ הקובץ לא נמצא בנתיב:", imagePath);
                    }
                }
            }
        } catch (fsError) {
            console.error("❌ שגיאה במחיקת קובץ התמונה הפיזי:", fsError);
            // נמשיך למחוק את הרשומה במסד הנתונים גם אם נכשלה מחיקת הקובץ הפיזי
        }
        
        // מחיקת התמונה ממסד הנתונים
        await db.query("DELETE FROM images WHERE id = ?", [imageId]);
        
        res.json({ message: "✅ תמונה נמחקה בהצלחה!" });
    } catch (error) {
        console.error("❌ שגיאה במחיקת תמונה:", error);
        res.status(500).json({ error: "שגיאה בשרת, נסה שוב מאוחר יותר." });
    }
});

module.exports = router;