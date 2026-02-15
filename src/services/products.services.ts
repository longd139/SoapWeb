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
}

const productsService = new ProductsService()
export default productsService
