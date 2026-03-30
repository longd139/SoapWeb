import { Router } from 'express'
import path from 'path'
import { getCartController, addToCartController } from '~/controllers/cart.controllers'
import { accessTokenValidator } from '~/middlewares/users.middleware'
import { wrapAsync } from '~/utils/handler'

const cartRoutes = Router()

/**
 * @route   GET /cart
 * @desc    Lấy danh sách sản phẩm trong giỏ hàng của user
 * @access  Private (Cần Token)
 */
cartRoutes.get('/', (req, res) => {
  // Lấy đường dẫn tuyệt đối đến file cart.html trong thư mục views
  const htmlPath = path.join(__dirname, '..', 'views', 'cart.html')

  return res.sendFile(htmlPath)
})

/**
 * @route   POST /cart/add
 * @desc    Thêm sản phẩm mới hoặc tăng số lượng sản phẩm trong giỏ
 * @access  Private
 */
cartRoutes.post('/add', accessTokenValidator, wrapAsync(addToCartController))

export default cartRoutes
