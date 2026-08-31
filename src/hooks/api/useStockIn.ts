import axios from "axios"
import { ADDRESSES } from "../../config/api_list"
import { BasicResponse, StockInCredentials } from "../../models/api_types"

export default function useStockIn() {
  const stockIn = async (stockInData: StockInCredentials) => {
    return new Promise<PromiseLike<BasicResponse>>((resolve, reject) => {
      axios
        .post(`${ADDRESSES.STOCK_IN}`, stockInData)
        .then(res => {
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  }
  return { stockIn }
}
