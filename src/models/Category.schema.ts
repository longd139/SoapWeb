import { ObjectId } from 'mongodb'

export default class Category {
  _id?: ObjectId
  name: string
  created_at?: Date
  updated_at?: Date

  constructor(category: Category) {
    this._id = category._id
    this.name = category.name
    this.created_at = category.created_at || new Date()
    this.updated_at = category.updated_at || new Date()
  }
}
