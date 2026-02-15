import { NextFunction, Request, Response } from 'express'
import { validationResult } from 'express-validator'
import {
  ChangePasswordReqBody,
  EmailVerifyReqQuery,
  ForgotPasswordReqBody,
  LoginRequestBody,
  LogoutReqBody,
  RefreshTokenReqBody,
  RegisterReqBody,
  ResetPasswordReqBody,
  TokenPayload,
  UpdateMeReqBody,
  VerifyForgotPasswordController
} from '~/models/request/User.request'
import usersServices from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { TokenType, USER_ROLE, UserVerifyStatus } from '~/constants/enums'
import databaseServices from '~/services/database.services'
import { result } from 'lodash'
export const loginController = async (req: Request<ParamsDictionary, any, LoginRequestBody>, res: Response) => {
  // code mà vào được đây tức là dữ liệu truyền lên ngon
  // body có email vào password ngon chỉ cần kiểm tra đúng hay không thoi
  const result = await usersServices.login(req.body)
  // gửi result cho client
  return res.status(HTTP_STATUS.OK).json({
    // chinh
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  })
}

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  // khui kiện từ req -- đã chạy ở middleware (registerValidation)

  // kiểm tra tính đúng của dữ liệu có liên quan đến db
  // *** ở controller thì dữ liệu đã sạch và đủ ***
  //  - kiểm tra email này đã có người sử dụng chưa ?
  const isExist = await usersServices.checkEmailExist(req.body.email)
  if (isExist) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY, // 422
      message: USERS_MESSAGES.EMAIL_ALREADY_EXISTS
    })
  }
  //  - tạo user mới trên database - phải kết nối với collection để tạo
  const result = await usersServices.register(req.body) //mình kết nối với một hệ thống khác ở đây thì có khả năng nó gặp bug đó là mất mạng hoặc ... thì nên đặt try catch ở đây
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result
  })

  // reponse đóng gói kết quả
}

export const logoutController = async (
  req: Request<ParamsDictionary, any, LogoutReqBody>, //
  res: Response
) => {
  const { user_id: user_id_ac } = req.decoded_authorization as TokenPayload
  const { user_id: user_id_rf } = req.decoded_refresh_token as TokenPayload
  if (user_id_ac !== user_id_rf) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNAUTHORIZED,
      message: USERS_MESSAGES.REFRESH_TOKEN_IS_INVALID
    })
  }
  const { refresh_token } = req.body
  // kiểm tra xem rf token còn trên hệ thống không ?
  await usersServices.checkRefreshToken({
    user_id: user_id_rf,
    refresh_token
  })
  // nếu còn bth thì mình xóa
  await usersServices.logout(refresh_token) // xóa rf token khỏi hệ thống
  //res.json({ messgae: 'Logout success' })
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.LOGOUT_SUCCESS
  })
}

export const emailVerifyController = async (
  req: Request<ParamsDictionary, any, any, EmailVerifyReqQuery>, //
  res: Response
) => {
  const { email_verify_token } = req.query
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  //kiểm tra email_verify_token có thật sự thuộc sở hưu của user đó không
  await usersServices.checkEmailVerifyToken({
    user_id,
    email_verify_token
  })
  // verify email: xóa email_verify_token và đổi verify: từ 0 thành 1
  await usersServices.verifyEmail(user_id) //
  //gửi response
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESS
  })
}

export const resendVerifyEmailTokenController = async (req: Request, res: Response) => {
  // 0. Lấy user_id từ decoded_access_token vì mình có verify access_token trước đó ở middlewware rồi
  const { user_id } = req.decoded_authorization as TokenPayload
  // 1. tìm thông tin user xem trạng thái verify của nó thế nào
  const verifyStatus = await usersServices.getVerifyStatus(user_id)
  // nếu đã verify thì thông báo là khong cần gửi lại
  if (verifyStatus == UserVerifyStatus.Verified) {
    return res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }
  // Nếu bị banned thì không gửi
  if (verifyStatus == UserVerifyStatus.Banned) {
    return res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.ACCOUNT_HAS_BEEN_BANNED
    })
  }
  // nếu chưa verify thì gửi lại
  if (verifyStatus == UserVerifyStatus.Unverified) {
    // resendVerifyEmail: tạo email_verify-token mới , cập nhật lại user và gửi email
    await usersServices.resendVerifyEmail(user_id)
    return res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS
    })
  }
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response
) => {
  // dựa vào emai lkieemr tra xem user này có tồn tại không
  // email này có tồn tại trong hệ thống ko
  const { email } = req.body
  const isExisted = await usersServices.checkEmailExist(email)
  if (!isExisted) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNAUTHORIZED, // 401
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }
  // NẾU CÓ TỒN TẠI THÌ MÌNH SẼ TẠO FORGOT PASSWORD TOKEN VÀ LƯU VÀO USER VÀ ĐỒNG THỜI GỬI LINK CHO NGƯỜI  DÙNG QUA
  await usersServices.forgotPassword(email)
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.CHECK_YOUR_EMAIL
  })
}

export const verifyForgotPasswordCsontroller = async (
  req: Request<ParamsDictionary, any, VerifyForgotPasswordController>, //
  res: Response
) => {
  // người ta đưa mã cho ình và muốn biết mã đã verify hay chưa
  // mình đã verify có nghĩa là do mình tạo ra
  // nhưng mình phải xem thử mã này là cũ hay mới trong hệ thống
  // tức là trong db có còn mã này nữa ko
  // tức là user_id có còn sở hữu forgot_password_token này không
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const { forgot_password_token } = req.body
  await usersServices.checkForgotPasswordToken({
    user_id,
    forgot_password_token
  })
  // nếu có thông tin thì ok
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS
  })
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response
) => {
  // kiểm tra xem forgot_password_token còn khớp với user_id
  // nếu còn thì iến hành đổi mật khẩu mới do req cung cấp
  // xong thì res

  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const { forgot_password_token, password } = req.body
  await usersServices.checkForgotPasswordToken({
    user_id,
    forgot_password_token
  })
  // nếu còn thì tiến hành đổi mật khẩu mới do req cung cấp
  await usersServices.resetPassword({
    user_id,
    password
  })

  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS
  })
}

export const getMeController = async (
  req: Request, //
  res: Response
) => {
  // dùng user_id tìm thông tin user
  const { user_id } = req.decoded_authorization as TokenPayload
  const userInfor = await usersServices.getMe(user_id)
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.GET_ME_SUCCESS,
    result: userInfor
  })
}

export const updateMeController = async (
  req: Request<ParamsDictionary, any, UpdateMeReqBody>, //
  res: Response
) => {
  // chức năng update này tôi muốn chỉ khi user đã verify thì tui mới cho
  const { user_id } = req.decoded_authorization as TokenPayload
  const verifyStatus = await usersServices.getVerifyStatus(user_id)
  // chưa verify thì khong cho update
  if (verifyStatus != UserVerifyStatus.Verified) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY, // 422
      message: USERS_MESSAGES.USER_NOT_VERIFIED
    })
  }
  // nếu verify thì tiến hành update
  const userInfor = await usersServices.updateMe({
    user_id,
    payload: req.body
  })
  // update thành công thì gửi thôn tin user cần update
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.UPDATE_PROFILE_SUCCESS,
    result: userInfor
  })
}

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordReqBody>, //
  res: Response
) => {
  // đầu tiên mình phải kiểm tra xem password cũ có đúng hay không
  const { user_id } = req.decoded_authorization as TokenPayload
  const { old_password, password } = req.body
  // tiến hành đổi mật khẩu
  await usersServices.changePassword({
    user_id,
    old_password,
    password
  })
  // nếu đổi thành công thì
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS
  })
}

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenReqBody>, //
  res: Response
) => {
  // kiểm tra xem rf token còn tồn tại trong hệ thống ko
  const { user_id } = req.decoded_refresh_token as TokenPayload
  const { refresh_token } = req.body
  await usersServices.checkRefreshToken({ user_id, refresh_token })
  // kiểm tra xong thì tiến hành tạo ra ac và rf mới và gửi cho client
  const result = await usersServices.refreshToken({
    user_id,
    refresh_token
  }) // hàm phải trả ra ac và rf mới
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESS,
    result
  })
}

export const dashboardController = (req: Request, res: Response) => {
  const { role } = req.decoded_authorization as TokenPayload

  let redirectUrl = '/' // Mặc định về trang chủ

  switch (role) {
    case USER_ROLE.Admin:
      redirectUrl = '/admin/dashboard'
      break
    case USER_ROLE.Staff:
      redirectUrl = '/staff/orders'
      break
    case USER_ROLE.User:
      redirectUrl = '/' // Hoặc /profile
      break
  }

  // Trả về JSON để Frontend tự chuyển trang
  return res.json({
    message: 'Lấy đường dẫn thành công',
    result: {
      url: redirectUrl,
      role: role
    }
  })
}

// 1. Controller lấy danh sách chờ
export const getPendingUsersController = async (req: Request, res: Response) => {
  // Gọi sang Service
  const result = await usersServices.getPendingUsers()

  return res.json({
    message: 'Lấy danh sách người dùng chờ duyệt thành công', // Hoặc dùng USERS_MESSAGES
    result: result
  })
}
// 2. Controller Duyệt User
export const approveUserController = async (req: Request<{ user_id: string }>, res: Response) => {
  const { user_id } = req.params

  // Lúc này user_id được hiểu là string xịn, không còn lỗi nữa
  const result = await usersServices.approveUser(user_id)

  return res.json({
    message: 'Đã duyệt thành viên thành công!',
    result: result
  })
}
