import Product from '~/models/Product.schema'
import databaseServices from '~/services/database.services'

import { ObjectId } from 'mongodb'

class ProductsService {
  async createProduct(payload: any) {
    const result = await databaseServices.products.insertOne(
      new Product({
        ...payload,
        price: Number(payload.price) // Đảm bảo giá là số
      })
    )
    return result
  }

  async getAllProducts() {
    // Lấy tất cả sản phẩm, sắp xếp mới nhất lên đầu
    const products = await databaseServices.products.find({}).sort({ created_at: -1 }).toArray()
    return products
  }
  async find(payload: { condition: any }) {
    // Lấy tất cả sản phẩm, sắp xếp mới nhất lên đầu
    const products = databaseServices.products.find(payload.condition).sort({ name: -1 }).toArray()
    return products
  }
  async delete(payload: { id: string }) {
    const result = await databaseServices.products.deleteOne({
      _id: new ObjectId(payload.id)
    })
    return result
  }

  async update(id: string, payload: any) {
    // Gọi Database ở đây
    const result = await databaseServices.products.findOneAndUpdate(
      {
        _id: new ObjectId(id) // Tìm theo ID
      },
      {
        $set: {
          ...payload, // Cập nhật các trường gửi lên
          updated_at: new Date() // Tự động cập nhật ngày sửa
        }
      },
      {
        returnDocument: 'after', // Trả về dữ liệu MỚI sau khi sửa (mặc định là trả về cái cũ)
        includeResultMetadata: false // Chỉ lấy document, không lấy metadata thừa
      }
    )

    return result
  }
}

const productsService = new ProductsService()
export default productsService
