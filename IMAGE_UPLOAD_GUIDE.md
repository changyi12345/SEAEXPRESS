# Image Upload Guide (မြန်မာ)

## ✅ လုပ်ပြီးသား Features

### Backend
1. **Multer Setup** - File upload middleware
2. **Upload Routes** - `/api/upload/image` (single) and `/api/upload/images` (multiple)
3. **File Storage** - Images stored in `backend/uploads/` directory
4. **Static File Serving** - Images accessible at `http://localhost:5000/uploads/filename`
5. **File Validation** - Only images (jpeg, jpg, png, gif, webp), max 5MB

### Frontend
1. **ImageUpload Component** - Reusable component for image uploads
2. **Preview** - Shows image preview before upload
3. **Error Handling** - Shows upload errors
4. **Progress Indicator** - Shows uploading status

## 📝 Usage

### In Admin Pages:

```jsx
import ImageUpload from '../components/ImageUpload'

// Single image upload
<ImageUpload
  label="Restaurant Image"
  existingImage={restaurant?.images?.[0]}
  onUpload={(url) => {
    // Update restaurant with image URL
    setRestaurantData({ ...restaurantData, images: [url] })
  }}
/>
```

### API Endpoints:

1. **Upload Single Image:**
   ```
   POST /api/upload/image
   Content-Type: multipart/form-data
   Body: { image: File }
   
   Response: {
     success: true,
     url: "/uploads/filename.jpg",
     filename: "filename.jpg"
   }
   ```

2. **Upload Multiple Images:**
   ```
   POST /api/upload/images
   Content-Type: multipart/form-data
   Body: { images: [File, File, ...] }
   
   Response: {
     success: true,
     files: [
       { url: "/uploads/file1.jpg", filename: "file1.jpg" },
       { url: "/uploads/file2.jpg", filename: "file2.jpg" }
     ]
   }
   ```

## 🔧 Setup

1. **Backend:**
   - Multer already installed
   - Upload directory: `backend/uploads/`
   - Static files served at `/uploads/`

2. **Frontend:**
   - ImageUpload component ready
   - Can be used in any admin page

## 📸 Example: Adding Image Upload to Restaurant/Shop Creation

```jsx
const [imageUrl, setImageUrl] = useState('')

<ImageUpload
  label="Restaurant Image"
  onUpload={setImageUrl}
/>

// When submitting:
const restaurantData = {
  ...otherData,
  images: imageUrl ? [imageUrl] : []
}
```

## 🎯 Next Steps

1. Add ImageUpload to Restaurant creation/editing page
2. Add ImageUpload to Shop creation/editing page
3. Add ImageUpload to Menu Item/Product creation
4. Update existing restaurants/shops to use uploaded images

## ⚠️ Notes

- Images are stored locally in `backend/uploads/`
- For production, consider using cloud storage (AWS S3, Cloudinary, etc.)
- Make sure `backend/uploads/` is in `.gitignore`
- Backend must be running on port 5000 for images to load

