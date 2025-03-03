import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchEvents, validateEventPassword } from "../utils/api";

function SearchEvent() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState([]);
    const [password, setPassword] = useState("");
    const [selectedEvent, setSelectedEvent] = useState(null);

    const handleSearch = async () => {
        const filteredResults = await searchEvents(searchQuery);
        setResults(filteredResults);
    };

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
    };

    const handleAccessGallery = async () => {
        const isValid = await validateEventPassword(selectedEvent.id, password);
        if (isValid) {
            navigate(`/choose-images/${selectedEvent.id}`);
        } else {
            alert("❌ סיסמה שגויה! נסה שוב.");
        }
    };

    return (
        <div>
            <h1>🔍 חיפוש אירוע</h1>
            <input
                type="text"
                placeholder="הכנס שם אירוע / תאריך / צלם"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button onClick={handleSearch}>🔎 חפש</button>

            {results.length > 0 && (
                <div>
                    <h2>📋 תוצאות חיפוש:</h2>
                    <ul>
                        {results.map((event) => (
                            <li key={event.id}>
                                {event.name} - {event.date} ({event.photographer})
                                <button onClick={() => handleSelectEvent(event)}>🔑 בחר אירוע</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {selectedEvent && (
                <div>
                    <h3>🔐 הזן סיסמה לצפייה בגלריה:</h3>
                    <input
                        type="password"
                        placeholder="סיסמה"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button onClick={handleAccessGallery}>🔓 אשר</button>
                </div>
            )}
        </div>
    );
}

export default SearchEvent;