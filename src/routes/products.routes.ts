import { Router } from 'express'
import { createProductController, getProductsController } from '~/controllers/products.controllers'
import { accessTokenValidator } from '~/middlewares/users.middleware'
import { USER_ROLE } from '~/constants/enums'
import { checkRole } from '~/middlewares/auth.middlewares'
import path from 'path'

const productsRouter = Router()

/**
 * 1. API CÔNG KHAI (Public)
 * Ai cũng gọi được, không cần Token
 * Dùng cho trang chủ, trang danh sách sản phẩm
 */
productsRouter.get('/', (req, res) => {
  // Trỏ đúng đến file html sản phẩm của bạn
  // Lưu ý: Sửa đường dẫn '../views/products.html' tùy theo cấu trúc thư mục của bạn
  const htmlPath = path.join(__dirname, '../views/products.html')
  return res.sendFile(htmlPath)
})

productsRouter.get('/list', getProductsController)

/**
 * 2. API BẢO MẬT (Private)
 * Phải có Token + Phải là Admin mới được gọi
 * Dùng cho trang Dashboard Admin để đăng bài
 */
productsRouter.post(
  '/',
  accessTokenValidator, // Check đăng nhập
  checkRole([USER_ROLE.Admin]), // Check quyền Admin
  createProductController // Cho phép tạo
)

export default productsRouter
