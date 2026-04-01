import Product from '~/models/Product.schema'
import databaseServices from '~/services/database.services'

import { ObjectId } from 'mongodb'
import Category from '~/models/Category.schema'

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

  async getAllProducts(searchKeyword?: string, maxPrice?: number) {
    // 1. Khởi tạo một bộ lọc rỗng.
    // (Nếu người dùng không tìm kiếm hay lọc giá gì cả, nó sẽ đóng vai trò y hệt cái {} cũ của bạn)
    const query: any = {}

    // 2. Nếu có từ khóa tìm kiếm -> Thêm điều kiện lọc theo tên sản phẩm
    if (searchKeyword) {
      // Dùng $regex để tìm gần đúng (ví dụ gõ "xà phòng" sẽ ra "Xà phòng thảo mộc")
      // $options: 'i' giúp không phân biệt chữ hoa, chữ thường
      query.name = { $regex: searchKeyword, $options: 'i' }
    }

    // 3. Nếu có mức giá tối đa -> Thêm điều kiện lọc giá
    if (maxPrice !== undefined) {
      // $lte (less than or equal) giúp lấy các sản phẩm có giá <= maxPrice
      query.price = { $lte: maxPrice }
    }

    // 4. Truyền biến query vào hàm find() thay vì để trống {}
    // Vẫn giữ nguyên sắp xếp mới nhất lên đầu (-1)
    const products = await databaseServices.products.find(query).sort({ created_at: -1 }).toArray()

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

  // Hàm lấy tất cả danh mục và kèm theo số lượng sản phẩm
  async getAllCategories() {
    // 1. Lấy danh sách danh mục và sắp xếp A-Z
    const categories = await databaseServices.categories.find({}).sort({ name: 1 }).toArray()

    // 2. Lặp qua từng danh mục để đếm số sản phẩm
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        // Đếm số sản phẩm có trường category khớp với ID của danh mục này
        // Lưu ý: Nếu trong bảng Product bạn lưu tên danh mục thay vì ID,
        // hãy đổi thành { category: category.name }
        const count = await databaseServices.products.countDocuments({
          category: category._id?.toString()
        })

        // Trả về object danh mục cũ cộng thêm trường productCount
        return {
          ...category,
          productCount: count
        }
      })
    )

    return categoriesWithCount
  }

  // Hàm 2: Tạo danh mục mới
  async createCategory(name: string) {
    const newCategory = new Category({ name })
    const result = await databaseServices.categories.insertOne(newCategory)
    return result
  }
  async deleteCategory(categoryId: string) {
    // Chuyển chuỗi id thành ObjectId của MongoDB để tìm chính xác
    const result = await databaseServices.categories.deleteOne({
      _id: new ObjectId(categoryId)
    })
    return result
  }
}

const productsService = new ProductsService()
export default productsService
