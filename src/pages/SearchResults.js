import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { searchEvents, validateEventPassword } from "../utils/api";
import "../styles/SearchResults.css";

function SearchResults() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventCode, setEventCode] = useState("");
    const [codeError, setCodeError] = useState("");
    const [showCodeDialog, setShowCodeDialog] = useState(false);
    const [queryText, setQueryText] = useState("");

    useEffect(() => {
        const fetchResults = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // קבלת פרמטר החיפוש מה-URL
                const params = new URLSearchParams(location.search);
                const query = params.get("query");
                setQueryText(query || "");
                
                console.log(`מתחיל חיפוש עם מחרוזת: "${query}"`);
                
                if (!query || query.trim() === "") {
                    setError("נא להזין טקסט לחיפוש");
                    setSearchResults([]);
                    setLoading(false);
                    return;
                }
                
                // ביצוע החיפוש באמצעות ה-API
                const results = await searchEvents(query);
                
                console.log(`התקבלו תוצאות מה-API:`, results);
                
                // המרת התאריכים לפורמט מתאים
                const processedResults = Array.isArray(results) ? results.map(event => ({
                    ...event,
                    event_date: event.event_date ? new Date(event.event_date).toLocaleDateString('he-IL') : 'תאריך לא זמין'
                })) : [];
                
                console.log(`לאחר עיבוד:`, processedResults);
                
                setSearchResults(processedResults);
                
                if (processedResults.length === 0) {
                    setError(`לא נמצאו תוצאות עבור החיפוש "${query}"`);
                }
            } catch (error) {
                console.error("שגיאה בחיפוש:", error);
                setError("אירעה שגיאה בביצוע החיפוש");
                setSearchResults([]);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [location]);

    const handleEventClick = (event) => {
        console.log(`נבחר אירוע:`, event);
        setSelectedEvent(event);
        setEventCode("");
        setCodeError("");
        setShowCodeDialog(true);
    };

    const handleCloseDialog = () => {
        setShowCodeDialog(false);
        setSelectedEvent(null);
    };

    const handleCodeSubmit = async (e) => {
        e.preventDefault();
        
        if (!eventCode.trim()) {
            setCodeError("נא להזין קוד גישה");
            return;
        }
        
        try {
            console.log(`מאמת קוד ${eventCode} לאירוע ${selectedEvent.id}`);
            const response = await validateEventPassword(selectedEvent.id, eventCode);
            
            console.log(`תוצאת אימות:`, response);
            
            if (response.valid) {
                // אם הקוד תקין, ניווט לדף הגלריה של הלקוח
                navigate(`/gallery/${selectedEvent.id}?code=${eventCode}`);
            } else {
                setCodeError("קוד גישה שגוי, נסה שוב");
            }
        } catch (error) {
            console.error("שגיאה באימות קוד:", error);
            setCodeError("אירעה שגיאה באימות הקוד");
        }
    };

    const handleBackToHome = () => {
        navigate("/");
    };

    const handleNewSearch = () => {
        const newSearch = prompt("הזן טקסט לחיפוש חדש:", queryText);
        if (newSearch && newSearch.trim() !== "") {
            navigate(`/search?query=${encodeURIComponent(newSearch.trim())}`);
        }
    };

    return (
        <div className="search-results-container">
            <button className="back-button" onClick={handleBackToHome}>← חזרה לדף הבית</button>
            
            <h1>תוצאות חיפוש</h1>
            <div className="search-info">
                {queryText && <p>תוצאות עבור: "{queryText}" <button className="new-search-button" onClick={handleNewSearch}>חיפוש חדש</button></p>}
            </div>
            
            {loading ? (
                <div className="loading">טוען תוצאות...</div>
            ) : error ? (
                <div className="error-message">
                    <p>{error}</p>
                    <button className="new-search-button" onClick={handleNewSearch}>נסה חיפוש אחר</button>
                </div>
            ) : (
                <>
                    <div className="results-count">
                        נמצאו {searchResults.length} תוצאות
                    </div>
                    
                    <div className="results-table-container">
                        <table className="results-table">
                            <thead>
                                <tr>
                                    <th>שם לקוח</th>
                                    <th>שם הצלם</th>
                                    <th>סוג אירוע</th>
                                    <th>תאריך</th>
                                    <th>פעולות</th>
                                </tr>
                            </thead>
                            <tbody>
                                {searchResults.map((result) => (
                                    <tr key={result.id}>
                                        <td>{result.name}</td>
                                        <td>{result.photographer_name}</td>
                                        <td>{result.event_type}</td>
                                        <td>{result.event_date}</td>
                                        <td>
                                            <button 
                                                className="view-album-button"
                                                onClick={() => handleEventClick(result)}
                                            >
                                                צפה באלבום
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
            
            {/* דיאלוג להזנת קוד גישה */}
            {showCodeDialog && selectedEvent && (
                <div className="code-dialog-overlay">
                    <div className="code-dialog">
                        <button className="close-dialog" onClick={handleCloseDialog}>&times;</button>
                        <h2>הזן קוד גישה לאלבום</h2>
                        <h3>{selectedEvent.name} - {selectedEvent.event_type}</h3>
                        
                        <form onSubmit={handleCodeSubmit}>
                            <div className="input-group">
                                <label htmlFor="eventCode">קוד גישה:</label>
                                <input
                                    type="text"
                                    id="eventCode"
                                    value={eventCode}
                                    onChange={(e) => setEventCode(e.target.value)}
                                    placeholder="הזן קוד גישה"
                                    autoFocus
                                />
                                {codeError && <div className="error">{codeError}</div>}
                            </div>
                            
                            <div className="dialog-actions">
                                <button type="button" className="cancel-button" onClick={handleCloseDialog}>ביטול</button>
                                <button type="submit" className="submit-button">כניסה לאלבום</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SearchResults;