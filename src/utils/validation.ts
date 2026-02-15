import { NextFunction, Request, Response } from 'express'
import { ValidationChain, validationResult } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema'
import HTTP_STATUS from '~/constants/httpStatus'
import { EntityError, ErrorWithStatus } from '~/models/Errors'

export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // chạy
    await validation.run(req) // chạy cái checkSchema và lưu lỗi vào cái req
    // khui lỗi
    const error = validationResult(req) // khui lỗi
    // nếu không có lỗi thì qua bước tiếp theo, k check nữa
    if (error.isEmpty()) {
      return next()
    }
    // nếu có lỗi thì tổng hợp lỗi lại
    // Hầu hết các lỗi là 422
    const errorObject = error.mapped() // đây là thằng lỗi ban đầu cực xấu
    const entityError = new EntityError({
      errors: {}
    })
    // mình sẽ độ lại cái error object này
    for (const key in errorObject) {
      const { msg } = errorObject[key]
      if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(msg) // ném cho Error Handler tống
      }
      entityError.errors[key] = msg
    }
    return next(entityError)
  }
}
