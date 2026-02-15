import { createHash } from 'crypto'
import dotenv from 'dotenv'
dotenv.config()

// hàm mã hóa nội dung bất kỳ thành SHA256
function sha256(content: string) {
  return createHash('sha256').update(content).digest('hex') // hex
}

// hàm mã hóa mật khẩu theo tiêu chuẩn sha256
export function hashPassword(password: string) {
  return sha256(password + process.env.PASSWORD_SECRET)
}
