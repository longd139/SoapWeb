import { error } from 'console'
import jwt from 'jsonwebtoken'
import { TokenPayload } from '~/models/request/User.request'
export const signToken = ({
  payload,
  privateKey,
  options = { algorithm: 'HS256' }
}: {
  payload: object | string | Buffer
  privateKey: string //
  options?: jwt.SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    // 1. Kiểm tra an toàn: Nếu key rỗng thì chặn ngay lập tức
    if (!privateKey) {
      return reject(new Error('❌ Lỗi: JWT_SECRET chưa được cung cấp!'))
    }

    jwt.sign(payload, privateKey, options, (err, token) => {
      // 2. Sửa lỗi logic: Bỏ 'throw', chỉ cần reject
      if (err) {
        return reject(err)
      }
      resolve(token as string)
    })
  })
}

export const verifyToken = ({ token, secretOrPublicKey }: { token: string; secretOrPublicKey: string }) => {
  //trả về JwtPayload(thông tin người gữi req) nếu token hợp lệ
  return new Promise<jwt.JwtPayload>((resolve, reject) => {
    //method này sẽ verify token, nếu token hợp lệ thì nó sẽ trả về payload
    //nếu token không hợp lệ thì nó sẽ throw error
    //secretOrPublicKey dùng để verify token
    //nếu token được tạo ra bằng secret|PublicKey thì ta dùng secret|PublicKey key để verify
    //từ đó biết rằng access_token được tạo bởi chính server
    jwt.verify(token, secretOrPublicKey, (error, decoded) => {
      if (error) throw reject(error)
      resolve(decoded as jwt.JwtPayload)
    })
  })
}
