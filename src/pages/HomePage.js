import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCamera } from "react-icons/fa";
import "../styles/HomePage.css";

function HomePage() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");

    const handlePhotographerLogin = () => {
        const token = localStorage.getItem("token");

        if (token) {
            navigate("/dashboard");
        } else {
            navigate("/auth");
        }
    };

    return (
        <div className="home-container">
            <div className="site-info">
                <h2>
                    <span className="text-left">Welcome</span>
                    <span className="text-right">To PiChoose</span>
                </h2>
                <p>הדרך הקלה לבחירת תמונות לאלבום האירוע שלכם</p>
            </div>

            <button className="photographer-login" onClick={handlePhotographerLogin}>
                <FaCamera />
                <span>כניסת צלמים</span>
            </button>

            <div className="search-section">
                <div className="search-input-container">
                    <input
                        type="text"
                        placeholder="חיפוש אירוע - נא הכנס שם לקוח"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="search-button-container">
                    <div className="search-button">
                        <button onClick={() => navigate(`/search?query=${searchQuery}`)}>🔎 חפש</button>
                    </div>
                    <div className="search-button">
                        <button className="advanced-search" onClick={() => navigate("/SearchEvent")}>🔍 חיפוש מתקדם</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
