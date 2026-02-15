import User from '~/models/User.schema'
import databaseServices from './database.services'
import { LoginRequestBody, RegisterReqBody, UpdateMeReqBody } from '~/models/request/User.request'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType, USER_ROLE, UserVerifyStatus } from '~/constants/enums'
import { StringValue } from 'ms'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import RefreshToken from '~/models/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { update } from 'lodash'

class UsersServices {
  private signAccessToken({ user_id, role, verify }: { user_id: string; role: number; verify: number }) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken, role, verify },
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_IN as StringValue },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string //thêm
    })
  }
  private signRefreshToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken },
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN as StringValue },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string //thêm
    })
  }
  private signEmailVerifyToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.EmailVerificationToken },
      options: { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRE_IN as StringValue },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string //thêm
    })
  }

  private signForgotPasswordToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.ForgotPasswordToken },
      options: { expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRE_IN as StringValue },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string //thêm
    })
  }

  async register(payload: RegisterReqBody) {
    // muốn gửi một tài khoản thì phải định nghĩa
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString())
    // console.log('ahihi', email_verify_token)

    const result = await databaseServices.users.insertOne(
      new User({
        username: `user${user_id}`,
        _id: user_id,
        email_verify_token,
        ...payload,
        date_of_birth: payload.date_of_birth ? new Date(payload.date_of_birth) : undefined,
        password: hashPassword(payload.password), // ghi đè lại password,
        role: USER_ROLE.User
      })
    )
    // lấy id của user vừa tạo để làm access và refresh

    // ký ac và rf
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken({
        user_id: user_id.toString(),
        role: USER_ROLE.User as number,
        verify: UserVerifyStatus.Unverified
      }),
      this.signRefreshToken(user_id.toString())
    ])
    await databaseServices.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    // email_verify_token thì phải gửi qua email
    console.log(`http://localhost:3000/users/verify-email/?email_verify_token=${email_verify_token}`)

    return {
      access_token,
      refresh_token
    }
  }

  async checkEmailExist(email: string): Promise<boolean> {
    const user = await databaseServices.users.findOne({ email })
    return Boolean(user)
  }

  async login(payload: LoginRequestBody) {
    // tìm user bằng các email và password đã mã hóa
    const user = await databaseServices.users.findOne({ ...payload, password: hashPassword(payload.password) })
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
        message: USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT
      })
    }

    if (user.verify === UserVerifyStatus.Unverified) {
      throw new ErrorWithStatus({
        message: 'Tài khoản của bạn đang chờ Admin phê duyệt. Vui lòng quay lại sau!',
        status: HTTP_STATUS.FORBIDDEN // 403
      })
    }

    if (user.verify === UserVerifyStatus.Banned) {
      throw new ErrorWithStatus({
        message: 'Tài khoản của bạn đã bị khóa!',
        status: HTTP_STATUS.FORBIDDEN
      })
    }
    // nếu có thì phải tạo ac và rf từ user_id của user tìm được
    const user_id = user._id.toString()

    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken({
        user_id: user_id,
        role: user.role as number,
        verify: user.verify
      }),
      this.signRefreshToken(user_id)
    ])
    await databaseServices.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return {
      access_token,
      refresh_token,
      role: user.role
    }
  }

  async checkRefreshToken({ user_id, refresh_token }: { user_id: string; refresh_token: string }) {
    const refreshToken = await databaseServices.refreshTokens.findOne({
      user_id: new ObjectId(user_id),
      token: refresh_token
    })
    if (!refreshToken) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: USERS_MESSAGES.REFRESH_TOKEN_IS_INVALID
      })
    }
  }

  async logout(refresh_token: string) {
    await databaseServices.refreshTokens.deleteOne({ token: refresh_token })
  }

  async checkEmailVerifyToken({
    user_id,
    email_verify_token
  }: {
    user_id: string //
    email_verify_token: string
  }) {
    // tìm user sở hữu 2 thông tin này cùng luc : kiểm tra xem user có đang sở hữu cái evt này không ?
    const user = await databaseServices.users.findOne({
      _id: new ObjectId(user_id),
      email_verify_token
    })
    // newwus không tìm thấy user thì nghĩa là evt không hợp lệ
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY, // 422
        message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_INVALID
      })
    }
    // nếu có thì thôi
  }

  async verifyEmail(user_id: string) {
    await databaseServices.users.updateOne(
      { _id: new ObjectId(user_id) }, //
      [
        {
          $set: {
            email_verify_token: '', //
            updated_at: '$$NOW',
            verify: UserVerifyStatus.Verified
          }
        }
      ]
    )
  }

  async getVerifyStatus(user_id: string) {
    // 1. tìm user thông qua user_id
    const user = await databaseServices.users.findOne({ _id: new ObjectId(user_id) })
    // nếu không có thì ném lỗi
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNAUTHORIZED, // 401
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    }
    return user.verify // chỉ return trạng thái verify, không được return user ra controller
    // nếu ko thì sẽ lộ rất nhiều thoogn tin
  }

  async resendVerifyEmail(user_id: string) {
    // tạo email_verify_token mới
    const email_verify_token = await this.signEmailVerifyToken(user_id)
    // cập nhật lại user với emai_verify_token mới
    await databaseServices.users.updateOne(
      { _id: new ObjectId(user_id) }, //
      [
        {
          $set: {
            email_verify_token, //
            updated_at: '$$NOW'
          }
        }
      ]
    )
    // gửi email
    console.log(`http://localhost:3000/users/verify-email/?email_verify_token=${email_verify_token}`)
  }

  async forgotPassword(email: string) {
    // tìm user thông qua email để lấy id để ký
    const user = await databaseServices.users.findOne({ email })
    //
    const user_id = user!._id.toString()
    // tạo forgot_password_token từ user_id
    const forgot_password_token = await this.signForgotPasswordToken(user_id)
    // cập nhật lại usr với forgot_password_token mới
    await databaseServices.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            forgot_password_token, //
            updated_at: '$$NOW'
          }
        }
      ]
    )
    // taoj link
    console.log(`http://localhost:8000/users/reset-password/?forgot_password_token=${forgot_password_token}`)
  }

  async checkForgotPasswordToken({
    user_id, //
    forgot_password_token
  }: {
    user_id: string
    forgot_password_token: string
  }) {
    //dựa vào 2 thông tin trên tìm user nếu không có nghĩa là mã forgot_password_token
    // không hợp lệ,, không còn trong hệ thống nưa
    const user = await databaseServices.users.findOne({
      _id: new ObjectId(user_id),
      forgot_password_token
    })
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNAUTHORIZED, // 401
        message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INVALID
      })
    }

    // còn có thì thôi, không nói gì cả
  }

  async resetPassword({ user_id, password }: { user_id: string; password: string }) {
    // tìm và cập nhật
    await databaseServices.users.updateOne(
      { _id: new ObjectId(user_id) }, // filter
      [
        {
          $set: {
            forgot_password_token: '',
            password: hashPassword(password),
            updated_at: '$$NOW'
          }
        }
      ]
    )
  }

  async getMe(user_id: string) {
    const user = await databaseServices.users.findOne(
      {
        _id: new ObjectId(user_id)
      }, //
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    //
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    }
    return user
  }

  async updateMe({ user_id, payload }: { user_id: string; payload: UpdateMeReqBody }) {
    // payload này có thứ cần fix là dob và username
    const _payload = payload.date_of_birth //
      ? { ...payload, date_of_birth: new Date(payload.date_of_birth) }
      : payload
    // nếu có muốn cập nhật username
    if (_payload.username) {
      const user = await databaseServices.users.findOne({ username: _payload.username })
      // nếu có người dùng cái username rồi thì báo lỗi
      if (user) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
          message: USERS_MESSAGES.USERNAME_ALREADY_EXISTS
        })
      }
    }
    // Tiến hành cập nhật
    const userInfor = await databaseServices.users.findOneAndUpdate(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            ..._payload,
            updated_at: '$$NOW'
          }
        }
      ],
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return userInfor
  }

  async changePassword({
    user_id, //
    old_password,
    password
  }: {
    user_id: string //
    old_password: string
    password: string
  }) {
    // tìm user dựa trên thông tin cũ nếu có thì mới cập nhật
    const user = await databaseServices.users.findOne({
      _id: new ObjectId(user_id),
      password: hashPassword(old_password)
    })
    // nếu không có
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    }
    // Nếu có thì cập nhật password mới cho user
    await databaseServices.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          password: hashPassword(password),
          updated_at: '$$NOW'
        }
      }
    ])
  }

  async refreshToken({
    user_id, //
    refresh_token
  }: {
    user_id: string
    refresh_token: string
  }) {
    // xóa refresh token cũ
    await databaseServices.refreshTokens.deleteOne({
      user_id: new ObjectId(user_id), //
      token: refresh_token
    })
    // ký 2 mã mới và gửi cho người dùng
    const [access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({
        user_id: user_id.toString(),
        role: USER_ROLE.User as number,
        verify: UserVerifyStatus.Unverified
      }),
      this.signRefreshToken(user_id)
    ])
    await databaseServices.refreshTokens.insertOne(
      new RefreshToken({
        token: new_refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return {
      access_token,
      refresh_token: new_refresh_token
    }
  }

  async getPendingUsers() {
    // 1. Gọi Database
    const users = await databaseServices.users
      .find(
        {
          verify: UserVerifyStatus.Unverified // Điều kiện lọc
        },
        {
          // 2. Projection: Chỉ lấy những trường cần thiết, bỏ mật khẩu
          projection: {
            password: 0,
            email_verify_token: 0,
            forgot_password_token: 0,
            verify_email_token: 0 // Nếu có trường này thì ẩn luôn
          }
        }
      )
      .toArray() // Chuyển Cursor thành Array

    // Đối với danh sách, nếu không có ai thì trả về mảng rỗng []
    // Không cần ném lỗi 404 Not Found như getMe
    return users
  }

  async approveUser(user_id: string) {
    const user = await databaseServices.users.findOneAndUpdate(
      {
        _id: new ObjectId(user_id) // Tìm user theo ID
      },
      {
        $set: {
          verify: UserVerifyStatus.Verified, // Set trạng thái Verify
          updated_at: new Date() // (Tùy chọn) Cập nhật ngày sửa đổi
        }
      },
      {
        returnDocument: 'after', // Quan trọng: Trả về document SAU khi update
        projection: {
          // Ẩn các trường nhạy cảm
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )

    // Kiểm tra nếu không tìm thấy user (user === null)
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND, // "Không tìm thấy người dùng"
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return user
  }
}

const usersServices = new UsersServices()
export default usersServices
