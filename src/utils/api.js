import axios from "axios";

const API_URL = "http://localhost:5000/api";

// 📌 פונקציה לקבלת הכותרת עם הטוקן מה-LocalStorage (לשימוש בבקשות מאובטחות)
const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// 📌 פונקציה כללית לטיפול בבקשות API ושגיאות
const handleRequest = async (request) => {
    try {
        const response = await request;
        if (response.status === 204) return []; // טיפול בתשובה ריקה - החזר מערך ריק
        return response.data;
    } catch (error) {
        console.error("❌ שגיאה בבקשת API:", error?.response?.data || error.message);
        throw error?.response?.data || { error: "שגיאה בשרת, נסה שוב מאוחר יותר." };
    }
};

// 📌 התחברות, הרשמה והתנתקות
export const registerUser = async (userData) => {
    return await handleRequest(axios.post(`${API_URL}/auth/register`, userData));
};
export const loginUser = async (userData) => {
    const data = await handleRequest(axios.post(`${API_URL}/auth/login`, userData));
    if (data.token) {
        localStorage.setItem("token", data.token); // ✅ שמירת הטוקן ב-LocalStorage לאחר התחברות
    }
    return data;
};
export const logoutUser = () => {
    localStorage.removeItem("token"); // ✅ מחיקת הטוקן בעת יציאה
};

// 📌 קבלת פרטי המשתמש המחובר (דורש טוקן)
export const getCurrentUser = async () => {
    return await handleRequest(
        axios.get(`${API_URL}/auth/me`, { headers: getAuthHeader() })
    );
};

// 📌 ניהול תמונות (כולל תמיכה בטוקן)
export const getImagesByClient = async (clientId) => {
    try {
        console.log(`[DEBUG] מנסה להביא תמונות ללקוח ${clientId}`);
        
        const response = await axios.get(`${API_URL}/images/client/${clientId}`, { 
            headers: getAuthHeader(),
            // הגדרת timeout ארוך יותר למקרה שהשרת עמוס
            timeout: 10000
        });
        
        console.log(`[DEBUG] סטטוס תשובה: ${response.status}`);
        
        // בדיקת סטטוס התשובה
        if (response.status === 204) {
            console.log("[DEBUG] אין תמונות ללקוח (סטטוס 204)");
            return [];
        }
        
        // וידוא שהתשובה מכילה מערך תמיד
        if (Array.isArray(response.data)) {
            console.log(`[DEBUG] התקבלו ${response.data.length} תמונות`);
            return response.data;
        } else {
            console.warn("[DEBUG] התשובה אינה מערך:", typeof response.data);
            // אם זה אובייקט ולא מערך, נסה להמיר לפי היגיון
            if (response.data && typeof response.data === 'object') {
                // אם יש מאפיין images שהוא מערך, השתמש בו
                if (response.data.images && Array.isArray(response.data.images)) {
                    return response.data.images;
                }
                // נסה להמיר את האובייקט למערך
                const possibleArray = Object.values(response.data);
                if (possibleArray.length > 0) {
                    return possibleArray;
                }
            }
            return []; // החזר מערך ריק במקרה של תשובה לא צפויה
        }
    } catch (error) {
        console.error("[ERROR] שגיאה בקבלת תמונות:", error?.response?.data || error.message);
        // במקרה של שגיאה, החזר מערך ריק במקום לזרוק שגיאה
        return [];
    }
};

export const updateImageStatus = async (imageId, statusData) => {
    return await handleRequest(
        axios.put(`${API_URL}/images/${imageId}/status`, statusData, { headers: getAuthHeader() })
    );
};
export const uploadImage = async (imageData) => {
    return await handleRequest(
        axios.post(`${API_URL}/images/upload`, imageData, { 
            headers: { 
                ...getAuthHeader(),
                'Content-Type': 'multipart/form-data'
            }
        })
    );
};
export const deleteImage = async (imageId) => {
    return await handleRequest(
        axios.delete(`${API_URL}/images/${imageId}`, { headers: getAuthHeader() })
    );
};

// 📌 ניהול לקוחות (כולל תמיכה בטוקן)
export const getClients = async () => {
    return await handleRequest(
        axios.get(`${API_URL}/clients`, { headers: getAuthHeader() })
    );
};
export const addClient = async (clientData) => {
    return await handleRequest(
        axios.post(`${API_URL}/clients`, clientData, { headers: getAuthHeader() })
    );
};

// 📌 קבלת פרטי לקוח ספציפי (כולל טוקן)
export const getClientById = async (clientId) => {
    try {
        console.log(`[DEBUG] מנסה לקבל פרטי לקוח ${clientId}`);
        return await handleRequest(
            axios.get(`${API_URL}/clients/${clientId}`, { headers: getAuthHeader() })
        );
    } catch (error) {
        console.error(`[ERROR] שגיאה בקבלת פרטי לקוח ${clientId}:`, error);
        throw error;
    }
};

// 📌 עדכון לקוח (כולל טוקן)
export const updateClient = async (clientId, updatedData) => {
    return await handleRequest(
        axios.put(`${API_URL}/clients/${clientId}`, updatedData, { headers: getAuthHeader() })
    );
};

// 📌 מחיקת לקוח (כולל טוקן)
export const deleteClient = async (clientId) => {
    return await handleRequest(
        axios.delete(`${API_URL}/clients/${clientId}`, { headers: getAuthHeader() })
    );
};

// 📌 שליחת תגובה על לקוח (כולל טוקן)
export const sendComment = async (clientId, comment) => {
    return await handleRequest(
        axios.post(`${API_URL}/clients/${clientId}/comment`, { comment }, { headers: getAuthHeader() })
    );
};

// אם פונקציות searchEvents ו-validateEventPassword כבר קיימות בקובץ api.js,
// החלף אותן לגרסאות אלה:

// 📌 חיפוש אירועים (לא מחייב טוקן)
export const searchEvents = async (query) => {
    try {
        console.log(`מתחיל חיפוש עבור: "${query}"`);
        
        const response = await axios.get(`${API_URL}/events/search`, { 
            params: { query }
        });
        
        console.log(`סטטוס תשובה: ${response.status}, סוג התשובה: ${typeof response.data}`);
        
        // בדיקה אם התשובה ריקה
        if (response.status === 204 || !response.data) {
            console.log("אין תוצאות חיפוש");
            return [];
        }
        
        // וידוא שהתשובה היא מערך
        if (Array.isArray(response.data)) {
            console.log(`נמצאו ${response.data.length} תוצאות`);
            return response.data;
        } else {
            console.warn("התשובה אינה מערך:", response.data);
            // אם התשובה היא אובייקט עם מאפיין של מערך, נחזיר אותו
            if (response.data && typeof response.data === 'object' && Array.isArray(response.data.results)) {
                return response.data.results;
            }
            // אחרת, ננסה להמיר את האובייקט למערך
            return Object.values(response.data).filter(item => item && typeof item === 'object');
        }
    } catch (error) {
        // לוג שגיאה מפורט יותר
        console.error("❌ שגיאה בחיפוש אירועים:", 
                      error.response ? 
                      `סטטוס: ${error.response.status}, תוכן: ${JSON.stringify(error.response.data)}` : 
                      error.message);
        
        // במקרה של שגיאה, נחזיר מערך ריק במקום לזרוק שגיאה
        return [];
    }
};

// 📌 אימות קוד גישה לאירוע (לא מחייב טוקן)
export const validateEventPassword = async (eventId, password) => {
    try {
        const response = await axios.post(`${API_URL}/events/${eventId}/validate`, { password });
        return response.data;
    } catch (error) {
        console.error("❌ שגיאה באימות קוד גישה:", error?.response?.data || error.message);
        // במקרה של שגיאה, נחזיר שהקוד אינו תקף
        return { valid: false, error: error?.response?.data?.error || "שגיאה באימות קוד גישה" };
    }
};

// אם הפונקציות כבר קיימות, אל תוסיף אותן שוב - רק החלף את הקיימות