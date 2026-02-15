import { verify } from 'crypto'
import express from 'express'
import { access } from 'fs'
import { filter, wrap } from 'lodash'
import { USER_ROLE } from '~/constants/enums'
import {
  changePasswordController,
  emailVerifyController,
  forgotPasswordController,
  getMeController,
  loginController,
  logoutController,
  refreshTokenController,
  registerController,
  resendVerifyEmailTokenController,
  resetPasswordController,
  updateMeController,
  verifyForgotPasswordCsontroller
} from '~/controllers/users.controllers'
import { checkRole } from '~/middlewares/auth.middlewares'
import { fillterMiddleware } from '~/middlewares/common.middlewares'
import {
  accessTokenValidator,
  changePasswordValidator,
  emailVerifyTokenValidation,
  forgotPasswordTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  updateMeValidator
} from '~/middlewares/users.middleware'
import { ChangePasswordReqBody, UpdateMeReqBody } from '~/models/request/User.request'
import { wrapAsync } from '~/utils/handler'
import adminRoute from './admin.routes'
const usersRoutes = express.Router()

/* login 
path: users/login
method: POST
Request: headers body param query
// Mình sẽ gửi qua body, còn header là người ta cho mình giữ mình gửi lên server
body: {
    email: string,
    password: string
}
    loginValidator: kiểm tra email và password
    loginController: đóng gói kiện và gửi kết quả
*/
usersRoutes.post('/login', loginValidator, wrapAsync(loginController))

/**
    register
    path: users/register
    method: post
    body:{
        email: String
        name: String
        password: String,
        confirm_passwor : string,
        date_of_birth: ISO8601
    }
 */

usersRoutes.post(
  '/register',
  registerValidator, //
  wrapAsync(registerController)
)

/*
    Logout:
    path: /users/logout
    method: post
    headers: {
        Authorization: 'Bearer access_token'
    }
    body: {
        refresh_token: string,
        
    }
*/
usersRoutes.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController))
/*
Verify email
des: Người dùng vào email để bấm vào link xác thực, link này thực chất là gửi lại email_verify_token lên server để server xác thực
path: /users/verify-email/?email_verify_token=${email_verify_token}
method: get(vì người dùng chỉ bấm vào link)
query:{
    email_verify_token: string

}
*/
usersRoutes.get('/verify-email/', emailVerifyTokenValidation, wrapAsync(emailVerifyController))

/*
resend-verify-email
des: người dùng muốn verify email nhưng chưa|không có link
path: /users/response-verify-email
method: POST(cần biết người dùng là ai để gửi mail của người dùng đó)
header: {
    Authorization: 'Bearer access_token'
}
*/
usersRoutes.post('/resend-verify-email', accessTokenValidator, wrapAsync(resendVerifyEmailTokenController))

/*
forgot-password
path: /users/forgot-password
method: POST
body:{
email:sadasd
}
*/
usersRoutes.post('/forgot-password', forgotPasswordValidator, wrapAsync(forgotPasswordController))

/*
    verify-forgot-password
des: khi người dùng vào mail click vào link để verify thì họ sẽ gửi forgot-password-token cho FE , FE sẽ gửi tolen này lên server để verify -> nếu oke thì hiển thị form nhập mật khẩu mới

path: /users/verify-forgot-password
method: post
body: {
    forgot_password_token: string
}
*/
usersRoutes.post(
  '/verify-forgot-password', //
  forgotPasswordTokenValidator, // kiểm tra forgot_password_token trong body
  wrapAsync(verifyForgotPasswordCsontroller)
)

/*
    reset-password
    des: FE sẽ gửi password và confirm _password, kèm với forgot_password_token lên cho BE tiến hành xác thực và đổi mật khẩu
    path: /user/reset-password
    method: Post
    body: {
        password: string
        confirm_password: string
        forgot_password: string
    }
*/
usersRoutes.post(
  '/reset-password', //
  forgotPasswordTokenValidator, // hàm kiểm tra mã
  resetPasswordValidator, // kiểm tra password và confirm pass
  wrapAsync(resetPasswordController)
)

// login | forgot-password | reset-password | login

/*
getme
des: lấy thông tin của chính mfinh, của user đang đăng 
path: /users/me
method: POST
header {
    Authorization: 'Beared access_token'
}
*/

usersRoutes.post(
  '/me',
  accessTokenValidator, //
  wrapAsync(getMeController)
)

/*
des: update profile của user
path: '/me'
method: patch
Header: {Authorization: Bearer <access_token>}
body: {
  name?: string
  date_of_birth?: Date
  bio?: string // optional
  location?: string // optional
  website?: string // optional
  username?: string // optional
  avatar?: string // optional
  cover_photo?: string // optional}
*/

usersRoutes.patch(
  '/me', //
  accessTokenValidator,
  updateMeValidator,
  fillterMiddleware<UpdateMeReqBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'avatar',
    'username',
    'cover_photo'
  ]),
  wrapAsync(updateMeController)
)

/*
change Password
des: khi người dùng đã 'đăng nhập' muốn đổi mật khẩu
path: /users/change-password
method: PUT
header: {
    Authorization: 'Beaer access_token'    
}
body: {
    old_password: string,
    password: string,
    confirm_password: string
}
*/
usersRoutes.put(
  '/change-password', //
  accessTokenValidator,
  changePasswordValidator, // kiểm tra old_p, password, confirm_password
  fillterMiddleware<ChangePasswordReqBody>(['confirm_password', 'old_password', 'password']),
  wrapAsync(changePasswordController)
)

/*
Refresh Token
des: khi mã access_token hết hạn thì client sẽ gửi refresh_token lên để xin access_token và rf
path: 'users/refresh-token'
method: POST
body: {
    refresh_token: string
}
*/

usersRoutes.post(
  '/refresh-token', //
  refreshTokenValidator,
  wrapAsync(refreshTokenController)
)

export default usersRoutes
