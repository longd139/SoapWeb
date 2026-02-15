import { Request, Response } from 'express'
import formidable from 'formidable'
import path from 'path'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import mediasServices from '~/services/medias.services'
import { handleUploadSingleImage } from '~/utils/file'

export const uploadSingleImageController = async (
  req: Request, //
  res: Response
) => {
  const file = await mediasServices.uploadSingleImage(req)
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.UPLOAD_IMAGE_SUCCESS,
    result: file
  })
}

export const serveImageController = async (
  req: Request, //
  res: Response
) => {
  const { filename } = req.params
  return res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, filename), (error) => {
    if (error) {
      return res.status((error as any).status || 500).json({
        message: 'File not found'
      })
    }
  })
}

export const uploadSingleVideoController = async (
  req: Request, //
  res: Response
) => {
  const file = await mediasServices.uploadSingleVideo(req)
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.UPLOAD_IMAGE_SUCCESS,
    result: file
  })
}

export const serveVideoController = async (
  req: Request, //
  res: Response
) => {
  const { filename } = req.params
  return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, filename), (error) => {
    if (error) {
      return res.status((error as any).status || 500).json({
        message: 'File not found'
      })
    }
  })
}
