import express from 'express'
import { wrap } from 'lodash'
import { uploadSingleImageController, uploadSingleVideoController } from '~/controllers/medias.controllers'
import { wrapAsync } from '~/utils/handler'
const mediasRoutes = express.Router()
/*
upload-image (single image)
des: người dùng gửi form có chứa hình ảnh lên server
server lưu trữ hình ảnh trên vào hệ thống
path: /medias/upload-image
method: POST
*/

mediasRoutes.post(
  '/upload-image', //
  wrapAsync(uploadSingleImageController)
)

mediasRoutes.post(
  '/upload-video', //
  wrapAsync(uploadSingleVideoController)
)
export default mediasRoutes
