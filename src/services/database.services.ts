import { Collection, Db, MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import User from '~/models/User.schema'
import RefreshToken from '~/models/RefreshToken.schema'
import Product from '~/models/Product.schema'
dotenv.config() // kết nối đến file .env

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@websoapcluster.lizuuzv.mongodb.net/?appName=webSoapCluster`

// đây là đường dẫn xác thực mình là ai
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
class DatabaseServices {
  private client: MongoClient // prop
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME) // giấu đi tên db
  }
  async connect() {
    try {
      await this.db.command({ ping: 1 }) // chỉnh admin thành tên database của mình
      // bởi vì database kết nối với backend của mình thì nó sẽ tốn thời gian nên phải sử dụng await
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  get users(): Collection<User> {
    return this.db.collection(process.env.DB_USERS_COLLECTION as string) // có khả năng bị undefind nên cho nó biết nó là string
  }

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_REFRESH_TOKENS_COLLECTION as string) // có khả năng bị undefind nên cho nó biết nó là string
  }
  get products(): Collection<Product> {
    return this.db.collection(process.env.DB_PRODUCTS_COLLECTION as string) // có khả năng bị undefind nên cho nó biết nó là string
  }
}
//tạo instance ở đây và export instance đó
const databaseServices = new DatabaseServices()
export default databaseServices
// mình đang tạo 1 tài khoản để truy cập vào mongo và nó sử dụng username và password
