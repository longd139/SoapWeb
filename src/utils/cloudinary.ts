import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import multer from 'multer'
import dotenv from 'dotenv'
dotenv.config()

// 1. Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME, // Lấy trên web cloudinary
  api_key: process.env.COULE_API_KEY,
  api_secret: process.env.COULE_API_SECRET
})

// 2. Cấu hình nơi lưu (Storage)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'emee-shop-products', // Tên thư mục trên cloud
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'] // Định dạng cho phép
    // transformation: [{ width: 500, height: 500, crop: 'limit' }] // Tự động resize ảnh nếu muốn
  } as any
})

// 3. Xuất biến upload để dùng ở Router
export const uploadCloud = multer({ storage })
