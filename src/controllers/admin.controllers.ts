import usersServices from '~/services/users.services'
import { NextFunction, Request, Response } from 'express'
export const pendingController = async (req: Request, res: Response) => {
  // Gọi Service (hàm getPendingUsers bạn đã viết ở bước trước)
  const result = await usersServices.getPendingUsers()

  return res.json({
    message: 'Lấy danh sách chờ duyệt thành công',
    result: result
  })
}
