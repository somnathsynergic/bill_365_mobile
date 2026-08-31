import axios from "axios"
import { ADDRESSES } from "../../config/api_list"
import { BasicResponse, StockOutCredentials } from "../../models/api_types"

export default function useStockOut() {
  const stockOut = async (stockOutData: StockOutCredentials) => {
    return new Promise<PromiseLike<BasicResponse>>((resolve, reject) => {
      axios
        .post(`${ADDRESSES.STOCK_OUT}`, stockOutData)
        .then(res => {
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  }
  return { stockOut }
}
