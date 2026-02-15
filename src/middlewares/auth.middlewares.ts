import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '~/utils/jwt' // Hàm giải mã token của bạn
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import dotenv from 'dotenv'
import { CheckRoleTokenReqBody } from '~/models/request/User.request'
import { USER_ROLE } from '~/constants/enums'
dotenv.config()

// Hàm bao đóng (Higher Order Function) nhận vào mảng các role cho phép
export const checkRole = (allowedRoles: USER_ROLE[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Lấy role từ bước 1 (accessTokenValidator)
    // console.log('🕵️ Check Role - Decoded:', req.decoded_authorization)
    const { role } = req.decoded_authorization as CheckRoleTokenReqBody

    if (!allowedRoles.includes(role)) {
      return next(
        new ErrorWithStatus({
          message: 'Bạn không có quyền truy cập tài nguyên này (Forbidden)',
          status: HTTP_STATUS.FORBIDDEN // 403
        })
      )
    }

    next() // Role hợp lệ -> Cho qua
  }
}
