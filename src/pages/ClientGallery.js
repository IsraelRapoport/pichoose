// ClientGallery.js - גרסה מעודכנת לפי הדרישות שלך
import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getImagesByClient, getClientById, validateEventPassword, updateImageStatus } from "../utils/api";
import "../styles/ClientGallery.css";

function ClientGallery() {
    const { clientId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [accessCode, setAccessCode] = useState("");
    const [existingImages, setExistingImages] = useState([]);
    const [clientData, setClientData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dataFetched, setDataFetched] = useState(false);
    const [accessVerified, setAccessVerified] = useState(false);
    const [showOnlySelected, setShowOnlySelected] = useState(false);

    const getBaseUrl = () => {
        const serverPort = 5000;
        const hostname = window.location.hostname;
        return `http://${hostname}:${serverPort}`;
    };

    const openImageInNewTab = (image) => {
        const imageUrl = `${getBaseUrl()}${image.image_url}`;
        window.open(imageUrl, '_blank');
    };

    const handleImageSelection = async (imageId, currentSelection) => {
        try {
            const newStatus = !currentSelection;
            await updateImageStatus(imageId, { is_selected: newStatus });

            setExistingImages(prevImages =>
                prevImages.map(img =>
                    img.id === imageId ? { ...img, is_selected: newStatus } : img
                )
            );
        } catch (error) {
            console.error("שגיאה בעדכון סטטוס תמונה:", error);
            alert("שגיאה בעדכון סטטוס התמונה");
        }
    };

    useEffect(() => {
        const verifyAccessAndLoadData = async () => {
            try {
                setLoading(true);
                setError(null);

                const params = new URLSearchParams(location.search);
                const code = params.get("code");

                if (!code || !clientId) {
                    setError("גישה לא מורשית - חסרים פרמטרים נדרשים");
                    setLoading(false);
                    return;
                }

                setAccessCode(code);

                const validation = await validateEventPassword(clientId, code);

                if (!validation.valid) {
                    setError("קוד גישה שגוי");
                    setLoading(false);
                    return;
                }

                setAccessVerified(true);

                try {
                    const client = await getClientById(clientId);
                    setClientData(client);
                } catch {}

                const images = await getImagesByClient(clientId);
                const safeImages = Array.isArray(images) ? images : [];

                const processedImages = safeImages.map(img => ({
                    ...img,
                    is_selected: img.is_selected === 1 || img.is_selected === true
                }));

                setExistingImages(processedImages);
                setDataFetched(true);
            } catch (e) {
                setError("אירעה שגיאה בטעינת הנתונים");
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        verifyAccessAndLoadData();
    }, [clientId, location.search]);

    const handleBack = () => navigate("/");

    const filteredImages = showOnlySelected
        ? existingImages.filter(img => img.is_selected)
        : existingImages;

    if (loading) {
        return <div className="loading-container">טוען נתונים...</div>;
    }

    if (error || !accessVerified) {
        return (
            <div className="error-container">
                <h2>שגיאה</h2>
                <p>{error || "גישה לא מורשית"}</p>
                <button className="back-button" onClick={handleBack}>חזרה לדף הבית</button>
            </div>
        );
    }

    return (
        <div className="client-gallery-container">
            <div className="header-section">
                <button className="back-button" onClick={handleBack}>← חזרה לדף הבית</button>
                <h1>גלריית תמונות</h1>
                {clientData && (
                    <div className="client-info">
                        <h2>{clientData.name} - {clientData.event_type}</h2>
                        <p>תאריך אירוע: {new Date(clientData.event_date).toLocaleDateString('he-IL')}</p>
                    </div>
                )}
            </div>

            <div className="gallery-section">
                <div className="gallery-header">
                    <h3>
  🖼️ {showOnlySelected ? "גלריית תמונות נבחרות" : "גלריית תמונות"} 
  {filteredImages.length > 0 ? ` (${filteredImages.length})` : ""}
</h3>

                    <div className="gallery-filters">
                        <button className={`filter-button ${!showOnlySelected ? 'active' : ''}`} onClick={() => setShowOnlySelected(false)}>הצג הכל</button>
                        <button className={`filter-button ${showOnlySelected ? 'active' : ''}`} onClick={() => setShowOnlySelected(true)}>הצג רק נבחרות</button>
                    </div>
                </div>

                {existingImages.length === 0 ? (
                    <div className="empty-gallery">אין תמונות זמינות באלבום זה</div>
                ) : showOnlySelected && filteredImages.length === 0 ? (
                    <div className="empty-gallery">אין תמונות נבחרות באלבום זה</div>
                ) : (
                    <div className="gallery-grid">
                        {filteredImages.map((image) => (
                            <div className={`gallery-item ${image.is_selected ? 'selected' : ''}`} key={image.id}>
                                <div className="image-container">
                                    <img
                                        src={`${getBaseUrl()}${image.image_url}`}
                                        alt={image.file_name || 'תמונה'}
                                        className="gallery-image"
                                        onError={(e) => {
                                            e.target.src = '/placeholder-image.png';
                                        }}
                                    />
                                    <span className="zoom-icon" onClick={(e) => {
                                        e.stopPropagation();
                                        openImageInNewTab(image);
                                    }}>🔍</span>
                                    <div className="image-overlay">
                                        <span
                                            className={`selection-status ${image.is_selected ? 'selected' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleImageSelection(image.id, image.is_selected);
                                            }}
                                        >
                                            {image.is_selected ? '✓ נבחרה' : 'לחץ לבחירה'}
                                        </span>
                                    </div>
                                </div>
                                <div className="image-info">
                                    <span className="image-name">{image.file_name || 'תמונה ללא שם'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ClientGallery;
