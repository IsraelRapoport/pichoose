import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, getClients, updateClient, deleteClient } from "../utils/api";

import "../styles/Dashboard.css";

function Dashboard() {


    
    useEffect(() => {
        document.body.classList.add("dashboard-page");
        return () => {
            document.body.classList.remove("dashboard-page");
        };
    }, []);

    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [user, setUser] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [editedData, setEditedData] = useState({});
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(null);
    const [filterStatus, setFilterStatus] = useState("הצג הכל");
    
    // מצב למיון הטבלה
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'ascending'
    });
    
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userData = await getCurrentUser();
                setUser(userData);
                setLoading(false);
            } catch (err) {
                console.error("❌ שגיאת אימות:", err);
                navigate("/auth");
            }
        };

        fetchUser();
    }, [navigate]);

    useEffect(() => {
        if (user) {
            fetchClients();
        }
    }, [user]);


    const [clientsLoading, setClientsLoading] = useState(true);

    const fetchClients = async () => {
        try {
            const response = await getClients();
            if (Array.isArray(response) && response.length > 0) {
                const formattedClients = response.map(client => ({
                    ...client,
                    event_date: client.event_date.split("T")[0]
                }));
                setClients(formattedClients);
                setFilteredClients(formattedClients);
            }
        } catch (error) {
            console.error("❌ שגיאה בטעינת לקוחות:", error);
            setError("שגיאה בטעינת לקוחות, נסה שוב מאוחר יותר.");
        } finally {
            setClientsLoading(false);
        }
    };
    
    // פונקציה לטיפול במיון
    const requestSort = (key) => {
        let direction = 'ascending';
        
        // אם לוחצים על אותו העמודה שוב, משנים את כיוון המיון
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        
        setSortConfig({ key, direction });
    };
    
    // פונקציה שמחזירה את מחלקת המיון (עבור CSS)
    const getSortClass = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'ascending' ? 'sortable-header sort-asc' : 'sortable-header sort-desc';
        }
        return 'sortable-header';
    };
    
    // מיון הלקוחות בהתאם להגדרות המיון
    useEffect(() => {
        let sortedClients = [...filteredClients];
        
        if (sortConfig.key) {
            sortedClients.sort((a, b) => {
                const valueA = a[sortConfig.key];
                const valueB = b[sortConfig.key];
                
                if (valueA < valueB) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (valueA > valueB) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
            
            setFilteredClients(sortedClients);
        }
    }, [sortConfig]);

    const openEditModal = (client) => {
        setEditingClient(client.id);
        setEditedData({ ...client });
        setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        setEditedData({ ...editedData, [e.target.name]: e.target.value });
    };

    const saveClient = async () => {
        try {
            // שליחת הנתונים המעודכנים לשרת
            await updateClient(editingClient, editedData);
            
            // עדכון מיידי של הממשק לאחר הצלחה
            setClients(clients.map(client => 
                client.id === editingClient ? editedData : client
            ));
            setFilteredClients(filteredClients.map(client => 
                client.id === editingClient ? editedData : client
            ));
            
            // סגירת חלון העריכה
            setShowEditModal(false);
            setEditingClient(null);
        } catch (error) {
            console.error("❌ שגיאה בעדכון לקוח:", error);
            alert("אירעה שגיאה בעדכון הלקוח. אנא נסה שוב.");
        }
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setEditingClient(null);
    };

    const confirmDelete = (id) => {
        setShowDeleteConfirmation(id);
    };

    const handleDeleteClient = async () => {
        try {
            await deleteClient(showDeleteConfirmation);
            // עדכון מערכי הלקוחות לאחר מחיקה מוצלחת
            setClients(clients.filter(client => client.id !== showDeleteConfirmation));
            setFilteredClients(filteredClients.filter(client => client.id !== showDeleteConfirmation));
            setShowDeleteConfirmation(null);
        } catch (error) {
            console.error("❌ שגיאה במחיקת לקוח:", error);
        }
    };

    const handleStatusChange = async (clientId, newStatus) => {
        try {
            await updateClient(clientId, { status: newStatus });

            // עדכון הסטטוס של הלקוח במאגר הנתונים
            setClients(prevClients =>
                prevClients.map(client =>
                    client.id === clientId ? { ...client, status: newStatus } : client
                )
            );

            // עדכון הסטטוס גם ברשימת הלקוחות המסוננים
            setFilteredClients(prevFilteredClients =>
                prevFilteredClients.map(client =>
                    client.id === clientId ? { ...client, status: newStatus } : client
                )
            );
        } catch (error) {
            console.error("❌ שגיאה בעדכון סטטוס:", error);
        }
    };

    // ✅ סינון אוטומטי לאחר שינוי סטטוס או שינוי סטטוס בסינון
    useEffect(() => {
        if (filterStatus === "הצג הכל") {
            setFilteredClients(clients);
        } else {
            setFilteredClients(clients.filter(client => client.status === filterStatus));
        }
        
        // איפוס הגדרות המיון בעת שינוי סינון
        setSortConfig({ key: null, direction: 'ascending' });
    }, [filterStatus, clients]);

    // פונקציה לreset הסינון כאשר נלחץ שוב על אותו סטטוס
    const resetFilter = () => {
        setFilteredClients(clients);
    };

    // פונקציה להפעיל סינון מחדש רק כאשר בוחרים סטטוס חדש
    const handleStatusFilter = (e) => {
        setFilterStatus(e.target.value);
        resetFilter();
    };

    if (loading) {
        return null;
    }

    const handleClientNameClick = (clientId) => {
        // זה יעביר אותנו לעמוד UploadImages עם מזהה הלקוח
        navigate(`/upload-images/${clientId}`);
    };

    return (
        <div className="dashboard-container">
            <h1>📊 ניהול לקוחות</h1>

            {user && (
                <div className="user-info">
                    <p>👤 שלום לך, <strong>{user.name}</strong></p>
                    <p>🏢 עסק: <strong>{user.business_name}</strong></p>
                </div>
            )}

            {error && <p style={{ color: "red" }}>{error}</p>}

            {/* אזור בקרה חדש עם סינון וכפתור יצירה */}
            <div className="controls-container">
                <div className="filter-container">
                    <label>📌 סנן לפי סטטוס:</label>
                    <select value={filterStatus} onChange={handleStatusFilter}>
                        <option value="הצג הכל">הצג הכל</option>
                        <option value="חדש">חדש</option>
                        <option value="בטיפול">בטיפול</option>
                        <option value="הסתיים">הסתיים</option>
                    </select>
                </div>

                {/* כפתור יצירת לקוח חדש עבר לכאן */}
                <button
                    className="add-client-btn"
                    onClick={() => navigate("/create-client")}
                >
                    ➕ צור לקוח חדש
                </button>
            </div>

            {clientsLoading ? (
                <p className="loading">📡 טוען נתונים...</p>
            ) : filteredClients.length === 0 ? (
                <p className="no-clients">❌ אין לקוחות להצגה</p>
            ) : (
                <div className="clients-table-wrapper">
                    <div className="clients-table-container">
                        <table className="clients-table">
                            <thead>
                                <tr>
                                    <th onClick={() => requestSort('name')} className={getSortClass('name')}>
                                        שם
                                    </th>
                                    <th>📞 טלפון</th>
                                    <th>📧 אימייל</th>
                                    <th>🎉 סוג האירוע</th>
                                    <th onClick={() => requestSort('event_date')} className={getSortClass('event_date')}>
                                        📅 תאריך אירוע
                                    </th>
                                    <th>🔑 קוד לקוח</th>
                                    <th>📌 סטטוס</th>
                                    <th>✏️ עריכה</th>
                                    <th>🗑️ מחיקה</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClients.map((client) => (
                                    <tr key={client.id}>
                                        <td>
                                            <button
                                                className="client-name-btn"
                                                onClick={() => handleClientNameClick(client.id)}
                                            >
                                                {client.name}
                                            </button>
                                        </td>
                                        <td>{client.phone}</td>
                                        <td>{client.email}</td>
                                        <td>{client.event_type}</td>
                                        <td>{client.event_date}</td>
                                        <td>{client.code}</td>
                                        <td>
                                            <select value={client.status} onChange={(e) => handleStatusChange(client.id, e.target.value)}>
                                                <option value="חדש">חדש</option>
                                                <option value="בטיפול">בטיפול</option>
                                                <option value="הסתיים">הסתיים</option>
                                            </select>
                                        </td>
                                        <td>
                                            <button className="edit-btn" onClick={() => openEditModal(client)}>📝 ערוך</button>
                                        </td>
                                        <td>
                                            <button className="delete-btn" onClick={() => confirmDelete(client.id)}>🗑️ מחק</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 🔲 חלון עריכת לקוח */}
            {showEditModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>✏️ עריכת לקוח</h2>
                        <button className="close-modal" onClick={closeEditModal}>✖</button>
                        
                        <div className="form-group">
                            <label>📝 שם הלקוח:</label>
                            <input 
                                type="text" 
                                name="name" 
                                value={editedData.name || ''} 
                                onChange={handleEditChange} 
                                placeholder="שם הלקוח" 
                            />
                        </div>
                        <div className="form-group">
                            <label>📞 טלפון:</label>
                            <input 
                                type="text" 
                                name="phone" 
                                value={editedData.phone || ''} 
                                onChange={handleEditChange} 
                                placeholder="מספר טלפון" 
                            />
                        </div>
                        <div className="form-group">
                            <label>📧 אימייל:</label>
                            <input 
                                type="email" 
                                name="email" 
                                value={editedData.email || ''} 
                                onChange={handleEditChange} 
                                placeholder="כתובת אימייל" 
                            />
                        </div>
                        <div className="form-group">
                            <label>🎉 סוג האירוע:</label>
                            <input 
                                type="text" 
                                name="event_type" 
                                value={editedData.event_type || ''} 
                                onChange={handleEditChange} 
                                placeholder="סוג האירוע" 
                            />
                        </div>
                        <div className="form-group">
                            <label>📅 תאריך האירוע:</label>
                            <input 
                                type="date" 
                                name="event_date" 
                                value={editedData.event_date || ''} 
                                onChange={handleEditChange} 
                                placeholder="תאריך האירוע" 
                            />
                        </div>
                        <div className="form-group">
                            <label>🔑 קוד לקוח:</label>
                            <input 
                                type="text" 
                                name="code" 
                                value={editedData.code || ''} 
                                onChange={handleEditChange} 
                                placeholder="קוד לקוח" 
                            />
                        </div>
                        <div className="form-group">
                            <label>📌 סטטוס:</label>
                            <select 
                                name="status" 
                                value={editedData.status || 'חדש'} 
                                onChange={handleEditChange}
                            >
                                <option value="חדש">חדש</option>
                                <option value="בטיפול">בטיפול</option>
                                <option value="הסתיים">הסתיים</option>
                            </select>
                        </div>
                        <div className="modal-buttons">
                            <button onClick={saveClient}>✔️ שמור</button>
                            <button onClick={closeEditModal}>❌ ביטול</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🔲 חלון אישור מחיקה */}
            {showDeleteConfirmation && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>🗑️ אישור מחיקה</h2>
                        <p>⚠️ האם אתה בטוח שברצונך למחוק לקוח זה?</p>
                        <p><strong>שים לב:</strong> כל התמונות בגלריה שלו יימחקו!</p>
                        <div className="modal-buttons">
                            <button onClick={handleDeleteClient}>כן, מחק</button>
                            <button onClick={() => setShowDeleteConfirmation(null)}>ביטול</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;