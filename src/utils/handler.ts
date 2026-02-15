// wraperAsync biến những hàm Async
import { NextFunction, Request, Response, RequestHandler } from 'express'
// thành hàm có cấu trúc try catch + next
export const wrapAsync = <P, T>(func: RequestHandler<P, any, any, T>) => {
  return async (req: Request<P, any, any, T>, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
