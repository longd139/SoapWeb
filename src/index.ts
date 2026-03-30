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
import fs from 'fs'
const app = express()
const PORT = Number(process.env.PORT) || 3000

// CONNECT DB
dotenv.config()
databaseServices.connect()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser()) //

// app.use(express.static(path.join(__dirname, '../public')))
// app.get('/', (req, res) => {
//   const url_home = path.join(__dirname, 'views/home.html') // viết đúng là phải có dòng này
//   res.sendFile(url_home)
//   // hàm này có nhiệm vụ đọc 1 file HTML, pdf ...
// })
// --- ĐƯA LÊN ĐẦU ---

app.get('/', (req, res) => {
  const rootDir = path.resolve(__dirname) // Thư mục dist
  const viewsDir = path.join(__dirname, 'views')

  let debugInfo = `<h1>Render File Explorer</h1>`
  debugInfo += `<p><strong>Thư mục hiện tại (__dirname):</strong> ${__dirname}</p>`

  // 1. Kiểm tra thư mục dist (rootDir)
  if (fs.existsSync(rootDir)) {
    debugInfo += `<h3>Danh sách trong dist:</h3><ul>`
    fs.readdirSync(rootDir).forEach((file) => {
      debugInfo += `<li>${file}</li>`
    })
    debugInfo += `</ul>`
  }

  // 2. Kiểm tra thư mục dist/views
  if (fs.existsSync(viewsDir)) {
    debugInfo += `<h3>Danh sách trong dist/views:</h3><ul>`
    fs.readdirSync(viewsDir).forEach((file) => {
      debugInfo += `<li>${file}</li>`
    })
    debugInfo += `</ul>`
  } else {
    debugInfo += `<h3 style="color:red">❌ Thư mục dist/views KHÔNG TỒN TẠI!</h3>`
  }

  res.send(debugInfo)
})

app.use(express.static(path.join(__dirname, '../public')))
// --- CÁC ROUTER CON ĐỂ XUỐNG DƯỚI ---
// app.use('/user', usersRoutes)
// app.use('/admin', adminRoute)
// app.use('/cart', cartRoutes)
// app.use('/products', productsRouter)

// --- ERROR HANDLER LUÔN Ở CUỐI CÙNG ---
// app.use(defaultErrorHandler)

// 2. Route dành cho STAFF và ADMIN (Role 0, 1)
// usersRoutes.get('/staff/orders', accessTokenValidator, checkRole([USER_ROLE.Admin, USER_ROLE.Staff]), (req, res) => {
//   res.sendFile('views/staff/orders.html')
// })
// mo port
app.listen(PORT, '0.0.0.0', () => {
  console.log(`This project running in localhost:${PORT}`)
})
