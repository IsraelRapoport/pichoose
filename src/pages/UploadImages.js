import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { uploadImage, getImagesByClient, updateImageStatus, getClientById, deleteImage } from "../utils/api";
import "../styles/UploadImages.css";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

function UploadImages() {
    const { clientId } = useParams(); // קבלת מזהה הלקוח מה-URL
    const navigate = useNavigate();
    const [selectedImages, setSelectedImages] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [clientData, setClientData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dataFetched, setDataFetched] = useState(false);

    // קבלת כתובת הבסיס של ה-API
    const getBaseUrl = () => {
        const serverPort = 5000; // הפורט של השרת שלך
        const hostname = window.location.hostname; // מקבל את הדומיין הנוכחי (localhost או דומיין בפרודקשן)
        return `http://${hostname}:${serverPort}`;
    };

    // פונקציה לפתיחת תמונה בחלון חדש
    const openImageInNewTab = (image) => {
        const imageUrl = `${getBaseUrl()}${image.image_url}`;
        window.open(imageUrl, '_blank');
    };

    // טעינת נתוני הלקוח והתמונות הקיימות
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log(`[DEBUG] מתחיל לטעון נתונים עבור לקוח ${clientId}`);

                // קבלת פרטי הלקוח
                try {
                    const client = await getClientById(clientId);
                    console.log(`[DEBUG] פרטי לקוח נטענו:`, client);
                    setClientData(client);
                } catch (clientError) {
                    console.error(`[ERROR] שגיאה בטעינת פרטי לקוח:`, clientError);
                    // ממשיך לנסות לטעון תמונות גם אם יש שגיאה בפרטי לקוח
                }

                // קבלת התמונות הקיימות של הלקוח
                console.log(`[DEBUG] מנסה לטעון תמונות של לקוח ${clientId}`);
                const images = await getImagesByClient(clientId);

                // בדיקה שהתמונות במבנה תקין
                console.log(`[DEBUG] התקבלו תמונות:`,
                    Array.isArray(images) ? `מערך באורך ${images.length}` : typeof images);

                // וידוא שהתשובה היא מערך
                const safeImages = Array.isArray(images) ? images : [];

                // המרת שדות בוליאניים לפורמט אחיד
                const processedImages = safeImages.map(img => {
                    // בדיקה שהאובייקט תקין
                    if (!img || typeof img !== 'object') {
                        console.warn('[DEBUG] נמצא פריט לא תקין במערך התמונות');
                        return null;
                    }

                    // המרת ערך is_selected לבוליאני אמיתי
                    const isSelected = img.is_selected === 1 || img.is_selected === true;
                    console.log(`[DEBUG] תמונה ${img.id}, מצב בחירה מקורי: ${img.is_selected}, לאחר המרה: ${isSelected}`);

                    return {
                        ...img,
                        is_selected: isSelected
                    };
                }).filter(img => img !== null); // סינון פריטים לא תקינים

                console.log(`[DEBUG] עיבוד הסתיים, מציג ${processedImages.length} תמונות`);
                setExistingImages(processedImages);
                setDataFetched(true);
            } catch (error) {
                console.error("[ERROR] שגיאה כללית בטעינת נתונים:", error);
                setError("שגיאה בטעינת נתוני הלקוח או התמונות");
                setExistingImages([]);
                setDataFetched(true);
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
        // בדיקה אם הקבצים הם תמונות מסוג מותר
        const validFiles = files.filter(file => {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            return validTypes.includes(file.type);
        });

        if (validFiles.length !== files.length) {
            alert("❌ חלק מהקבצים אינם תמונות בפורמט נתמך (JPG, PNG, GIF, WEBP)");
        }

        setSelectedImages(validFiles);
    };

    // טיפול בהעלאת תמונות לשרת
    const handleUpload = async () => {
        if (selectedImages.length === 0) return;

        setIsUploading(true);
        setUploadProgress(0);
        setError(null);

        try {
            const total = selectedImages.length;
            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < total; i++) {
                const image = selectedImages[i];
                const formData = new FormData();
                formData.append("client_id", clientId);
                formData.append("file", image);
                formData.append("file_name", image.name);
                formData.append("is_selected", "false"); // התמונה לא נבחרה כברירת מחדל

                try {
                    await uploadImage(formData);
                    successCount++;
                } catch (uploadError) {
                    console.error("שגיאה בהעלאת תמונה:", image.name, uploadError);
                    errorCount++;
                }

                // עדכון התקדמות
                setUploadProgress(Math.floor(((i + 1) / total) * 100));
            }

            // רענון הגלריה לאחר העלאה
            try {
                console.log("[DEBUG] מנסה לקבל תמונות מעודכנות לאחר העלאה");
                let updatedImages = await getImagesByClient(clientId);

                if (!Array.isArray(updatedImages)) {
                    console.warn("[DEBUG] getImagesByClient לא החזיר מערך לאחר העלאה. מגדיר כמערך ריק.");
                    updatedImages = [];
                }

                console.log("[DEBUG] תמונות שהתקבלו לאחר העלאה:", updatedImages);

                const processedImages = updatedImages.map(img => ({
                    ...img,
                    is_selected: img.is_selected === 1 || img.is_selected === true ? true : false
                }));

                console.log("[DEBUG] תמונות מעובדות לאחר העלאה:", processedImages);
                setExistingImages(processedImages);
            } catch (fetchError) {
                console.error("שגיאה בקבלת תמונות מעודכנות:", fetchError);
            }

            setSelectedImages([]);

            if (errorCount > 0) {
                alert(`✅ ${successCount} תמונות הועלו בהצלחה, ❌ ${errorCount} תמונות נכשלו`);
            } else {
                alert("✅ כל התמונות הועלו בהצלחה!");
            }
        } catch (error) {
            console.error("❌ שגיאה בהעלאת תמונות:", error);
            setError("אירעה שגיאה בהעלאת התמונות");
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
                    img.id === imageId ? { ...img, is_selected: newStatus } : img
                )
            );
        } catch (error) {
            console.error("❌ שגיאה בעדכון סטטוס תמונה:", error);
            alert("שגיאה בעדכון סטטוס התמונה");
        }
    };

    // פונקציה למחיקת תמונה
    const handleDeleteImage = async (imageId) => {
        if (!window.confirm("האם אתה בטוח שברצונך למחוק תמונה זו?")) {
            return;
        }

        try {
            await deleteImage(imageId);

            // עדכון הגלריה לאחר מחיקה
            setExistingImages(prevImages =>
                prevImages.filter(img => img.id !== imageId)
            );

            alert("✅ התמונה נמחקה בהצלחה");
        } catch (error) {
            console.error("❌ שגיאה במחיקת תמונה:", error);
            alert("❌ אירעה שגיאה במחיקת התמונה");
        }
    };

    // חזרה לדשבורד
    const handleBack = () => {
        navigate("/dashboard");
    };

    // פונקציה להורדת כל התמונות הנבחרות כקובץ ZIP
    const downloadSelectedImages = async () => {
        // בודק אם יש תמונות נבחרות
        const selectedImages = existingImages.filter(img => img.is_selected);

        if (selectedImages.length === 0) {
            alert("אין תמונות נבחרות להורדה");
            return;
        }

        try {
            // יצירת אובייקט ZIP חדש
            const zip = new JSZip();
            const imgFolder = zip.folder("selected_images");

            // הודעה למשתמש שהורדת התמונות החלה
            alert(`מתחיל להוריד ${selectedImages.length} תמונות נבחרות...`);

            // מערך של הבטחות להורדת התמונות
            const downloadPromises = selectedImages.map(async (image, index) => {
                try {
                    // יצירת URL מלא לתמונה
                    const imageUrl = `${getBaseUrl()}${image.image_url}`;

                    // הורדת התמונה כבלוב
                    const response = await fetch(imageUrl);
                    if (!response.ok) {
                        throw new Error(`שגיאה בהורדת תמונה: ${response.statusText}`);
                    }

                    const blob = await response.blob();

                    // שם קובץ ייחודי לתמונה (או שימוש בשם המקורי אם קיים)
                    let fileName = image.file_name || `image_${index + 1}${getFileExtension(image.image_url)}`;

                    // הוספת התמונה לארכיון ZIP
                    imgFolder.file(fileName, blob);

                    return true;
                } catch (error) {
                    console.error(`שגיאה בהורדת תמונה ${image.id}:`, error);
                    return false;
                }
            });

            // המתנה להורדת כל התמונות
            const results = await Promise.all(downloadPromises);
            const successCount = results.filter(r => r).length;

            if (successCount === 0) {
                alert("שגיאה בהורדת התמונות");
                return;
            }

            // יצירת קובץ ZIP
            const content = await zip.generateAsync({ type: "blob" });

            // הגדרת שם קובץ ZIP עם שם האירוע ותאריך נוכחי
            let zipFileName = "selected_images.zip";
            if (clientData) {
                const eventName = clientData.name || "event";
                const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
                zipFileName = `${eventName}_${dateStr}.zip`;
            }

            // הורדת קובץ ZIP
            saveAs(content, zipFileName);

            // הודעת סיכום
            if (successCount < selectedImages.length) {
                alert(`הושלמה הורדה של ${successCount} מתוך ${selectedImages.length} תמונות נבחרות`);
            } else {
                alert(`הושלמה הורדה של ${successCount} תמונות נבחרות`);
            }
        } catch (error) {
            console.error("שגיאה בהורדת תמונות:", error);
            alert("אירעה שגיאה בהורדת התמונות");
        }
    };

    // פונקציית עזר לקבלת סיומת קובץ מ-URL
    const getFileExtension = (url) => {
        const match = url.match(/\.([^./?&#]+)(?:[?&#]|$)/);
        return match ? `.${match[1]}` : '.jpg'; // ברירת מחדל היא jpg אם אין סיומת
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

    console.log("[DEBUG] מצב הגלריה בזמן הרנדור:", {
        dataFetched,
        existingImagesLength: existingImages.length,
        filteredImagesLength: filteredImages.length,
        showOnlySelected
    });

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

            {/* הצג שגיאה רק אם יש בעיה */}
            {error && (
                <div className="error-message">
                    <p>❌ {error}</p>
                </div>
            )}

            {/* אזור העלאת תמונות חדשות */}
            <div className="upload-section">
                <h3>📷 העלאת תמונות חדשות</h3>
                <div className="upload-controls">
                    <label className="file-input-label">
                        <span>בחר תמונות</span>
                        <input
                            type="file"
                            multiple
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
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
                    <h3>
                        🖼️ {showOnlySelected ? "גלריית תמונות נבחרות" : "גלריית תמונות"}
                        {filteredImages.length > 0 ? ` (${filteredImages.length})` : ""}
                    </h3>

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

                        {/* כפתור הורדת תמונות נבחרות - מופיע רק כאשר יש תמונות נבחרות ומסננים לפיהן */}
                        {showOnlySelected && filteredImages.length > 0 && (
                            <button
                                className="download-button"
                                onClick={downloadSelectedImages}
                            >
                                📥 הורד תמונות נבחרות
                            </button>
                        )}
                    </div>
                </div>

                {/* בדיקת מצב הגלריה בצורה ברורה */}
                {existingImages.length === 0 ? (
                    <div className="empty-gallery">
                        ❌ הגלריה ריקה - העלה תמונות חדשות
                    </div>
                ) : showOnlySelected && filteredImages.length === 0 ? (
                    <div className="empty-gallery">
                        ❌ הלקוח טרם בחר תמונות
                    </div>
                ) : (
                    <div className="gallery-grid">
                        {filteredImages.map((image) => (
                            <div
                                className={`gallery-item ${image.is_selected ? 'selected' : ''}`}
                                key={image.id}
                            >
                                <div className="image-container">
                                    <img
                                        src={`${getBaseUrl()}${image.image_url}`}
                                        alt={image.file_name || 'תמונה'}
                                        className="gallery-image image-clickable"
                                        onClick={() => openImageInNewTab(image)}
                                        onError={(e) => {
                                            console.error(`שגיאה בטעינת תמונה: ${image.image_url}`);
                                            e.target.src = '/placeholder-image.png';
                                        }}
                                    />
                                    <span
                                        className="zoom-icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openImageInNewTab(image);
                                        }}
                                    >
                                        🔍
                                    </span>
                                    <div className="image-overlay">
                                        <span
                                            className={`selection-status ${image.is_selected ? 'selected' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation(); // מונע פתיחת התמונה בחלון חדש בעת לחיצה על הסטטוס
                                                handleImageSelection(image.id, image.is_selected);
                                            }}
                                        >
                                            {image.is_selected ? '✓ נבחרה' : 'לחץ לבחירה'}
                                        </span>
                                        <button
                                            className="delete-image-button"
                                            onClick={(e) => {
                                                e.stopPropagation(); // מונע פתיחת התמונה בחלון חדש בעת לחיצה על כפתור המחיקה
                                                handleDeleteImage(image.id);
                                            }}
                                        >
                                            🗑️ מחק
                                        </button>
                                    </div>
                                </div>
                                <div className="image-info">
                                    <span className="image-name">{image.file_name || 'תמונה ללא שם'}</span>
                                    <span className="upload-date">
                                        {image.uploaded_at
                                            ? new Date(image.uploaded_at).toLocaleDateString('he-IL')
                                            : 'תאריך לא זמין'}
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