import { Request, Response } from 'express'
import productsService from '~/services/products.services'

export const createProductController = async (req: Request, res: Response) => {
  const result = await productsService.createProduct(req.body)
  return res.json({
    message: 'Tạo sản phẩm thành công',
    result
  })
}

export const getProductsController = async (req: Request, res: Response) => {
  const { search } = req.query // Lấy từ khóa từ client gửi lên

  // Tạo điều kiện lọc
  let condition = {}

  if (search) {
    // Tìm kiếm gần đúng (Regex), không phân biệt hoa thường ('i')
    condition = {
      name: {
        $regex: search,
        $options: 'i'
      }
    }
  }

  // Gọi database với điều kiện lọc
  const products = await productsService.find({ condition })

  return res.json({
    message: 'Lấy danh sách sản phẩm thành công',
    result: products
  })
}
