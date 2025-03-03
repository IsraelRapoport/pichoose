import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getImagesByClient, updateImageStatus } from "../utils/api";

function ChooseImages() {
    const { clientId } = useParams();
    const [images, setImages] = useState([]);

    useEffect(() => {
        async function fetchImages() {
            const data = await getImagesByClient(clientId);
            setImages(data);
        }
        fetchImages();
    }, [clientId]);

    const handleSelectImage = async (imageId) => {
        setImages((prevImages) => {
            const updatedImages = prevImages.map(img =>
                img.id === imageId ? { ...img, is_selected: !img.is_selected } : img
            );

            // עדכון סטטוס התמונה לאחר שינוי הנתונים
            const selectedImage = updatedImages.find(img => img.id === imageId);
            updateImageStatus(imageId, selectedImage.is_selected);

            return updatedImages;
        });
    };

    return (
        <div>
            <h1>📸 בחירת תמונות</h1>
            <div className="gallery">
                {images.map((image) => (
                    <div 
                        key={image.id} 
                        className={`image-card ${image.is_selected ? "selected" : ""}`} 
                        onClick={() => handleSelectImage(image.id)}
                    >
                        <img src={`/uploads/${image.file_name}`} alt={`תמונה ${image.id}`} />
                        <p>{image.file_name}</p>
                    </div>
                ))}
            </div>
            <button onClick={() => alert("✅ הבחירה נשמרה!")}>💾 שמור בחירה</button>
        </div>
    );
}

export default ChooseImages;
