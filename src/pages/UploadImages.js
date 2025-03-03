import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { uploadImage, getImagesByClient, updateImageStatus, getClientById } from "../utils/api";
import "../styles/UploadImages.css";

function UploadImages() {
    const { clientId } = useParams(); // קבלת מזהה הלקוח מה-URL
    const navigate = useNavigate();
    const [selectedImages, setSelectedImages] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [clientData, setClientData] = useState(null);
    const [loading, setLoading] = useState(true);

    // טעינת נתוני הלקוח והתמונות הקיימות
    useEffect(() => {
        const fetchData = async () => {
            try {
                // קבלת פרטי הלקוח
                const client = await getClientById(clientId);
                setClientData(client);
                
                // קבלת התמונות הקיימות של הלקוח
                const images = await getImagesByClient(clientId);
                setExistingImages(images || []);
            } catch (error) {
                console.error("❌ שגיאה בטעינת נתונים:", error);
            } finally {
                setLoading(false);
            }
        };

        if (clientId) {
            fetchData();
        }
    }, [clientId]);

    // טיפול בבחירת קבצים
    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        setSelectedImages(files);
    };

    // טיפול בהעלאת תמונות לשרת
    const handleUpload = async () => {
        if (selectedImages.length === 0) return;
        
        setIsUploading(true);
        setUploadProgress(0);
        
        try {
            const total = selectedImages.length;
            
            for (let i = 0; i < total; i++) {
                const image = selectedImages[i];
                const formData = new FormData();
                formData.append("client_id", clientId);
                formData.append("file", image);
                formData.append("file_name", image.name);
                formData.append("is_selected", "false"); // התמונה לא נבחרה כברירת מחדל
                
                await uploadImage(formData);
                
                // עדכון התקדמות
                setUploadProgress(Math.floor(((i + 1) / total) * 100));
            }
            
            // רענון הגלריה לאחר העלאה
            const updatedImages = await getImagesByClient(clientId);
            setExistingImages(updatedImages || []);
            
            setSelectedImages([]);
            
            alert("✅ תמונות הועלו בהצלחה!");
        } catch (error) {
            console.error("❌ שגיאה בהעלאת תמונות:", error);
            alert("❌ אירעה שגיאה בהעלאת התמונות");
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    // טיפול בשינוי סטטוס בחירת תמונה
    const handleImageSelection = async (imageId, currentSelection) => {
        try {
            // שינוי הסטטוס (נבחר/לא נבחר)
            const newStatus = !currentSelection;
            await updateImageStatus(imageId, { is_selected: newStatus });
            
            // עדכון התמונות בממשק
            setExistingImages(prevImages => 
                prevImages.map(img => 
                    img.id === imageId ? {...img, is_selected: newStatus} : img
                )
            );
        } catch (error) {
            console.error("❌ שגיאה בעדכון סטטוס תמונה:", error);
        }
    };

    // חזרה לדשבורד
    const handleBack = () => {
        navigate("/dashboard");
    };

    // פילטר תצוגת תמונות
    const [showOnlySelected, setShowOnlySelected] = useState(false);
    
    // הפילטר של התמונות לפי בחירה
    const filteredImages = showOnlySelected 
        ? existingImages.filter(img => img.is_selected) 
        : existingImages;

    // טוען את הדף
    if (loading) {
        return <div className="loading-container">📡 טוען נתונים...</div>;
    }

    return (
        <div className="upload-images-container">
            <div className="header-section">
                <button className="back-button" onClick={handleBack}>← חזרה לדשבורד</button>
                <h1>ניהול תמונות</h1>
                {clientData && (
                    <div className="client-info">
                        <h2>{clientData.name} - {clientData.event_type}</h2>
                        <p>תאריך אירוע: {new Date(clientData.event_date).toLocaleDateString('he-IL')}</p>
                    </div>
                )}
            </div>

            {/* אזור העלאת תמונות חדשות */}
            <div className="upload-section">
                <h3>📷 העלאת תמונות חדשות</h3>
                <div className="upload-controls">
                    <label className="file-input-label">
                        <span>בחר תמונות</span>
                        <input 
                            type="file" 
                            multiple 
                            accept="image/*" 
                            onChange={handleFileChange} 
                            className="file-input"
                        />
                    </label>
                    <span className="selected-count">
                        {selectedImages.length > 0 ? `נבחרו ${selectedImages.length} תמונות` : 'לא נבחרו תמונות'}
                    </span>
                    <button 
                        className="upload-button" 
                        onClick={handleUpload} 
                        disabled={selectedImages.length === 0 || isUploading}
                    >
                        {isUploading ? `מעלה... ${uploadProgress}%` : '📤 העלה תמונות'}
                    </button>
                </div>

                {/* תצוגה מקדימה של תמונות נבחרות */}
                {selectedImages.length > 0 && (
                    <div className="preview-section">
                        <h3>🖼️ תמונות שנבחרו להעלאה:</h3>
                        <div className="preview-grid">
                            {selectedImages.map((image, index) => (
                                <div className="preview-item" key={index}>
                                    <img 
                                        src={URL.createObjectURL(image)} 
                                        alt={`תצוגה מקדימה ${index + 1}`} 
                                        className="preview-image"
                                    />
                                    <span className="preview-name">{image.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* גלריית התמונות הקיימות */}
            <div className="gallery-section">
                <div className="gallery-header">
                    <h3>🖼️ גלריית תמונות</h3>
                    <div className="gallery-filters">
                        <button 
                            className={`filter-button ${!showOnlySelected ? 'active' : ''}`}
                            onClick={() => setShowOnlySelected(false)}
                        >
                            הצג הכל
                        </button>
                        <button 
                            className={`filter-button ${showOnlySelected ? 'active' : ''}`}
                            onClick={() => setShowOnlySelected(true)}
                        >
                            הצג רק נבחרות
                        </button>
                    </div>
                </div>

                {filteredImages.length === 0 ? (
                    <div className="empty-gallery">
                        {showOnlySelected 
                            ? '❌ הלקוח טרם בחר תמונות' 
                            : '❌ הגלריה ריקה - העלה תמונות חדשות'}
                    </div>
                ) : (
                    <div className="gallery-grid">
                        {filteredImages.map((image) => (
                            <div 
                                className={`gallery-item ${image.is_selected ? 'selected' : ''}`} 
                                key={image.id}
                                onClick={() => handleImageSelection(image.id, image.is_selected)}
                            >
                                <div className="image-container">
                                    <img 
                                        src={image.image_url} 
                                        alt={image.file_name} 
                                        className="gallery-image"
                                    />
                                    <div className="image-overlay">
                                        <span className={`selection-status ${image.is_selected ? 'selected' : ''}`}>
                                            {image.is_selected ? '✓ נבחרה' : 'לחץ לבחירה'}
                                        </span>
                                    </div>
                                </div>
                                <div className="image-info">
                                    <span className="image-name">{image.file_name}</span>
                                    <span className="upload-date">
                                        {new Date(image.uploaded_at).toLocaleDateString('he-IL')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default UploadImages;