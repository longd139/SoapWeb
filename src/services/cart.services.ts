import { ObjectId } from 'mongodb'
import databaseService from '~/services/database.services'

class CartService {
  async addToCart({ user_id, product_id, quantity }: { user_id: string; product_id: string; quantity: number }) {
    // Chúng ta dùng updateOne với upsert: true
    const result = await databaseService.carts.findOneAndUpdate(
      {
        user_id: new ObjectId(user_id),
        product_id: new ObjectId(product_id)
      },
      {
        $inc: { quantity: quantity }, // Tự động cộng dồn quantity
        $setOnInsert: {
          created_at: new Date()
        },
        $set: {
          updated_at: new Date()
        }
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )
    return result
  }
  async getCartByUserId(user_id: string) {
    const result = await databaseService.carts
      .aggregate([
        {
          // 1. Lọc đúng giỏ hàng của user này
          $match: {
            user_id: new ObjectId(user_id)
          }
        },
        {
          // 2. Join với collection products
          $lookup: {
            from: 'products', // Tên collection chứa sản phẩm
            localField: 'product_id',
            foreignField: '_id',
            as: 'product_info'
          }
        },
        {
          // 3. Chuyển mảng product_info thành object duy nhất
          $unwind: '$product_info'
        },
        {
          // 4. (Tùy chọn) Sắp xếp theo ngày thêm mới nhất lên đầu
          $sort: { updated_at: -1 }
        }
      ])
      .toArray()

    return result
  }
}

export const cartService = new CartService()
