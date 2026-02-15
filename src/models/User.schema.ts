import { ObjectId } from 'mongodb'
import { USER_ROLE, UserVerifyStatus } from '~/constants/enums'

interface UserType {
  _id?: ObjectId
  name: string
  email: string
  date_of_birth?: Date
  password: string
  created_at?: Date
  updated_at?: Date
  email_verify_token?: string
  forgot_password_token?: string
  verify?: UserVerifyStatus

  username?: string
  role?: USER_ROLE // Enum
}

export default class User {
  _id?: ObjectId
  name: string
  email: string
  date_of_birth?: Date
  password: string
  created_at: Date
  updated_at: Date
  email_verify_token: string
  forgot_password_token: string
  verify: UserVerifyStatus

  role: USER_ROLE // Enum

  constructor(user: UserType) {
    const date = new Date() // tạo này cho ngày created and update
    this._id = user._id || new ObjectId()
    this.name = user.name || ''
    this.email = user.email
    this.date_of_birth = user.date_of_birth || date
    this.password = user.password
    this.created_at = user.created_at || date
    this.updated_at = user.updated_at || date
    this.email_verify_token = user.email_verify_token || ''
    this.forgot_password_token = user.forgot_password_token || ''
    this.verify = user.verify || UserVerifyStatus.Unverified

    this.role = user.role || USER_ROLE.User
  }
}
