import { TokenPayLoad } from './models/request/User.request'
import { Request } from 'express'
declare module 'express' {
  interface Request {
    decoded_authorization?: TokenPayLoad
    decoded_refresh_token?: TokenPayLoad
    decoded_email_verify_token?: TokenPayLoad
    decoded_forgot_password_token?: TokenPayLoad
  }
}
