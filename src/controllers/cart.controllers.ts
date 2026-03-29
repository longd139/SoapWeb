import { Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import path from 'path'
import { cartService } from '~/services/cart.services'
import databaseServices from '~/services/database.services'

export const addToCartController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const { product_id, quantity } = req.body

  // Gọi service đã viết trước đó
  await cartService.addToCart({
    user_id,
    product_id,
    quantity: Number(quantity)
  })

  // Tính lại tổng số lượng item trong giỏ để gửi về cho Frontend update cái Badge
  const allItems = await databaseServices.carts.find({ user_id: new ObjectId(user_id) }).toArray()
  const totalItems = allItems.reduce((sum, item) => sum + item.quantity, 0)

  return res.json({
    message: 'Thêm vào giỏ hàng thành công',
    totalItems // Trả về con số này
  })
}

export const getCartController = async (req: Request, res: Response) => {
  // Lấy user_id từ token đã được decode qua middleware
  const { user_id } = (req as any).decoded_authorization

  const result = await cartService.getCartByUserId(user_id)

  // Tính tổng số lượng sản phẩm để cập nhật badge (số lượng trên icon giỏ hàng)
  const totalQuantity = result.reduce((sum, item) => sum + item.quantity, 0)

  return res.json({
    message: 'Lấy giỏ hàng thành công',
    result,
    totalQuantity // Con số này dùng để hiển thị vào thẻ <span> trong HTML của bạn
  })
}
