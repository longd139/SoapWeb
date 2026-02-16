import { ObjectId } from 'mongodb'

export default class Product {
  _id?: ObjectId
  name: string
  price: number
  images: string[]
  description: string
  category: string
  created_at?: Date
  updated_at?: Date

  constructor(product: any) {
    this._id = product._id
    this.name = product.name
    this.price = product.price
    this.images = product.images || []
    this.description = product.description || ''
    this.category = product.category || 'General'
    this.created_at = product.created_at || new Date()
    this.updated_at = product.updated_at || new Date()
  }
}
