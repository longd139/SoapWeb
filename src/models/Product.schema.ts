import { ObjectId } from 'mongodb'

export default class Product {
  _id?: ObjectId
  name: string
  price: number
  image: string // Tạm thời lưu link ảnh (URL) cho đơn giản
  description: string
  category: string
  created_at?: Date
  updated_at?: Date

  constructor(product: any) {
    this._id = product._id
    this.name = product.name
    this.price = product.price
    this.image = product.image
    this.description = product.description || ''
    this.category = product.category || 'General'
    this.created_at = product.created_at || new Date()
    this.updated_at = product.updated_at || new Date()
  }
}
