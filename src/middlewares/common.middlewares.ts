// tạo ra một middleware có khả năng sàn lọc req.body
import { NextFunction, Request, Response } from 'express'
import { pick } from 'lodash'
type FilterKeys<T> = Array<keyof T>
export const fillterMiddleware = <T>(filterKeys: FilterKeys<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.body = pick(req.body, filterKeys)
    return next()
  }
}
