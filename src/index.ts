import express from 'express'
import path from 'path'
import usersRoutes from './routes/users.routes'
import databaseServices from './services/database.services'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import adminRoute from './routes/admin.routes'
import productsRouter from './routes/products.routes'
import cartRoutes from './routes/cart.routes'
const app = express()
const PORT = process.env.PORT || 3000

// CONNECT DB
databaseServices.connect()
dotenv.config()
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser()) //

app.use(express.json())
// app.use(express.static(path.join(__dirname, '../public')))
// app.get('/', (req, res) => {
//   const url_home = path.join(__dirname, 'views/home.html') // viết đúng là phải có dòng này
//   res.sendFile(url_home)
//   // hàm này có nhiệm vụ đọc 1 file HTML, pdf ...
// })
app.use(express.static(path.join(process.cwd(), 'public')))
app.get('/', (req, res) => {
  // process.cwd() trỏ thẳng vào thư mục gốc dự án (EmeeCare_Web)
  // Sau đó đi vào src/views/home.html
  const url_home = path.join(process.cwd(), 'src', 'views', 'home.html')

  res.sendFile(url_home, (err) => {
    if (err) {
      console.error('Lỗi không tìm thấy file home.html:', err)
      res.status(404).send('Server không tìm thấy file giao diện trang chủ.')
    }
  })
})
app.use('/user', usersRoutes)
// error handler
app.use(defaultErrorHandler)

// 1. Route chỉ dành cho ADMIN (Role 0)
app.use('/admin', adminRoute)

app.use('/cart', cartRoutes)

app.use('/products', productsRouter)

// 2. Route dành cho STAFF và ADMIN (Role 0, 1)
// usersRoutes.get('/staff/orders', accessTokenValidator, checkRole([USER_ROLE.Admin, USER_ROLE.Staff]), (req, res) => {
//   res.sendFile('views/staff/orders.html')
// })
// mo port
app.listen(PORT, () => {
  console.log(`This project running in localhost:${PORT}`)
})
