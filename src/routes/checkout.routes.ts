import { Router } from 'express'
import path from 'path'
const checkoutRoutes = Router()
// Trong file routes của bạn (ví dụ: orders.routes.ts hoặc index.ts)
checkoutRoutes.get('/', (req, res) => {
  // Đảm bảo dùng path.join và '..' nếu file này nằm trong thư mục routes
  const checkoutPath = path.join(__dirname, '..', 'views', 'checkout.html')
  res.sendFile(checkoutPath)
})

export default checkoutRoutes
