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

// export const getAllProductsController = async (req: Request, res: Response) => {
//   try {
//     // 1. Tìm tất cả ({}) và sắp xếp mới nhất lên đầu (-1)
//     const products = await productsService.getAllProducts()

//     return res.json({
//       message: 'Lấy toàn bộ danh sách sản phẩm thành công',
//       result: products
//     })
//   } catch (error) {
//     return res.status(500).json({
//       message: 'Lỗi lấy danh sách sản phẩm',
//       error: error
//     })
//   }
// }
export const getAllProductsController = async (req: Request, res: Response) => {
  // try {
  //   // 1. Lấy tham số từ URL
  //   const searchKeyword = req.query.search as string
  //   const maxPriceStr = req.query.maxPrice as string

  //   // 2. Ép kiểu giá tiền từ String sang Number
  //   let maxPrice: number | undefined = undefined
  //   if (maxPriceStr) {
  //     maxPrice = Number(maxPriceStr)
  //   }

  //   // 3. Truyền cả 2 tham số này xuống cho Service xử lý
  //   const products = await productsService.getAllProducts(searchKeyword, maxPrice)

  //   return res.json({
  //     message: 'Lấy danh sách sản phẩm thành công',
  //     result: products
  //   })
  // } catch (error) {
  //   return res.status(500).json({
  //     message: 'Lỗi lấy danh sách sản phẩm',
  //     error: error
  //   })
  // }

  try {
    // 1. Lấy biến từ URL (Frontend gửi lên)
    const searchKeyword = req.query.search as string
    const maxPriceStr = req.query.maxPrice as string

    // 2. CHÚ Ý: Phải ép maxPrice thành số (Number), vì URL luôn gửi dạng chuỗi
    let maxPrice: number | undefined = undefined
    if (maxPriceStr) {
      maxPrice = Number(maxPriceStr)
    }

    // 3. Truyền xuống Service
    const products = await productsService.getAllProducts(searchKeyword, maxPrice)

    return res.json({ message: 'Thành công', result: products })
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi', error })
  }
}

export const deleteProductController = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    // 👇 GỌI SERVICE (Thay vì gọi trực tiếp database)
    const result = await productsService.delete({ id: id as string })

    // Kiểm tra xem có xóa được dòng nào không
    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm để xóa'
      })
    }

    return res.json({
      message: 'Xóa sản phẩm thành công',
      result // Trả về kết quả từ Service
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi khi xóa sản phẩm',
      error: error
    })
  }
}

export const updateProductController = async (req: Request, res: Response) => {
  const { id } = req.params
  const payload = req.body

  try {
    // 👇 GỌI SERVICE (Thay vì gọi trực tiếp database)
    const result = await productsService.update(id as string, payload)

    // Nếu không tìm thấy sản phẩm để sửa (result sẽ là null)
    if (!result) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm'
      })
    }

    return res.json({
      message: 'Cập nhật sản phẩm thành công',
      result // Trả về sản phẩm đã được sửa
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi cập nhật sản phẩm',
      error: error
    })
  }
}
export const getCategoriesController = async (req: Request, res: Response) => {
  try {
    const categories = await productsService.getAllCategories()
    return res.json({
      message: 'Lấy toàn bộ danh sách danh mục thành công',
      result: categories
    })
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi lấy danh sách danh mục', error })
  }
}

// API: Tạo danh mục mới
export const createCategoryController = async (req: Request, res: Response) => {
  try {
    const { name } = req.body // Lấy tên danh mục do Admin nhập
    if (!name) {
      return res.status(400).json({ message: 'Tên danh mục không được để trống' })
    }

    const result = await productsService.createCategory(name)
    return res.json({
      message: 'Tạo danh mục thành công',
      result
    })
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi tạo danh mục', error })
  }
}

export const deleteCategoryController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string // Lấy cái :id từ đường dẫn URL

    if (!id) {
      return res.status(400).json({ message: 'Thiếu ID danh mục cần xóa' })
    }

    const result = await productsService.deleteCategory(id)

    // Kiểm tra xem MongoDB có thực sự xóa được dòng nào không
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục này trong Database' })
    }

    return res.json({
      message: 'Xóa danh mục thành công',
      result
    })
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ khi xóa danh mục', error })
  }
}
