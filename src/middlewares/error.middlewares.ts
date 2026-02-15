import { NextFunction, Request, Response } from 'express'
import { omit } from 'lodash'
import HTTP_STATUS from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'

export const defaultErrorHandler = (
  err: any, //
  req: Request, //
  res: Response,
  next: NextFunction
) => {
  // lỗi về đây sẽ có lỗi ErrorWithStatus
  // nếu là lỗi do mình chỉ đích tạo ra thì nó là ErrorWithStatus và có status
  if (err instanceof ErrorWithStatus) {
    return res.status(err.status).json(omit(err, ['status']))
  }
  // nếu là lỗi khác thì phải đưa các property về enumerable true
  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, { enumerable: true })
  })
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
    omit(
      err, //
      ['stack']
    )
  )
}
