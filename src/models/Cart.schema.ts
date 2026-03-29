import { ObjectId } from 'mongodb'

export default class CartItem {
  _id?: ObjectId
  user_id?: ObjectId
  product_id: ObjectId
  quantity: number
  created_at?: Date
  updated_at?: Date

  constructor(cart: any) {
    this._id = cart._id
    this.user_id = cart.user_id
    this.product_id = new ObjectId(cart.product_id)
    this.quantity = cart.quantity || 1
    this.created_at = cart.created_at || new Date()
    this.updated_at = cart.updated_at || new Date()
  }
}
