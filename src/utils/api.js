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
    return await handleRequest(
        axios.get(`${API_URL}/images/client/${clientId}`, { headers: getAuthHeader() })
    );
};
export const updateImageStatus = async (imageId, statusData) => {
    return await handleRequest(
        axios.put(`${API_URL}/images/${imageId}/status`, { statusData }, { headers: getAuthHeader() })
    );
};
export const uploadImage = async (imageData) => {
    return await handleRequest(
        axios.post(`${API_URL}/images/upload`, imageData, { headers: getAuthHeader() })
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
    return await handleRequest(
        axios.get(`${API_URL}/clients/${clientId}`, { headers: getAuthHeader() })
    );
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

// 📌 חיפוש אירועים (לא מחייב טוקן)
export const searchEvents = async (query) => {
    return await handleRequest(
        axios.get(`${API_URL}/events/search`, { params: { query } })
    );
};
export const validateEventPassword = async (eventId, password) => {
    return await handleRequest(
        axios.post(`${API_URL}/events/${eventId}/validate`, { password })
    );
};

// 📌 קבלת סטטוס לקוח לפי ID (כולל טוקן)
export const getClientStatus = async (clientId) => {
    return await handleRequest(
        axios.get(`${API_URL}/clients/${clientId}/status`, { headers: getAuthHeader() })
    );
};

// 📌 פונקציה לרענון טוקן (אם בעתיד תשתמש בטוקן רענון)
export const refreshToken = async () => {
    try {
        const data = await handleRequest(
            axios.post(`${API_URL}/auth/refresh-token`, {}, { headers: getAuthHeader() })
        );
        if (data.token) {
            localStorage.setItem("token", data.token); // ✅ עדכון הטוקן החדש
        }
        return data;
    } catch (error) {
        console.error("❌ שגיאה ברענון טוקן:", error);
        logoutUser(); // ✅ התנתקות אוטומטית אם הרענון נכשל
        throw error;
    }
};

// 📌 עדכון סטטוס של לקוח
export const updateClientStatus = async (clientId, status) => {
    return await handleRequest(
        axios.put(`${API_URL}/clients/${clientId}/status`, { status }, { headers: getAuthHeader() })
    );
};