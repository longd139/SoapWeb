import express from 'express'
import { serveImageController, serveVideoController } from '~/controllers/medias.controllers'
import { wrapAsync } from '~/utils/handler'
const staticRoutes = express.Router()

// route chia sẽ ảnh
staticRoutes.get(
  '/image/:filename', //
  wrapAsync(serveImageController)
)

staticRoutes.get(
  '/video/:filename', //
  wrapAsync(serveVideoController)
)
export default staticRoutes
