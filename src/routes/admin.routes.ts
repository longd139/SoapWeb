import express from 'express'
import path from 'path'
import { USER_ROLE } from '~/constants/enums'
import { pendingController } from '~/controllers/admin.controllers'
import { approveUserController, dashboardController } from '~/controllers/users.controllers'
import { checkRole } from '~/middlewares/auth.middlewares'
import { accessTokenValidator } from '~/middlewares/users.middleware'
import { uploadCloud } from '~/utils/cloudinary'
import mediasRoutes from './medias.routes'

const adminRoute = express.Router()

adminRoute.get('/dashboard', dashboardController)

adminRoute.get('/', (req, res) => {
  // Chỉ Admin được vào,(req, res) => {
  const url_home = path.join(__dirname, '../views/admin/dashboard.html') // viết đúng là phải có dòng này
  res.sendFile(url_home)
  // hàm này có nhiệm vụ đọc 1 file HTML, pdf ...
})

adminRoute.patch(
  '/approve/:user_id',
  accessTokenValidator, // 1. Phải đăng nhập
  checkRole([USER_ROLE.Admin]),
  approveUserController
)
// adminRoute.patch('/approve/:user_id', approveUserController)

adminRoute.get(
  '/pending',
  accessTokenValidator, // Phải login
  checkRole([USER_ROLE.Admin]),
  pendingController
)
adminRoute.use('/medias', mediasRoutes)
export default adminRoute
