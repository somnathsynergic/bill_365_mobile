import axios from "axios"
import { ADDRESSES } from "../../config/api_list"
import { LoginData } from "../../models/api_types"

export default function useLogin() {
  const login = async (phoneNumber: string,fcm_token:string) => {
    console.log("fcm_token in useLogin:",fcm_token);
    return new Promise<LoginData>((resolve, reject) => {
      axios
        .post(`${ADDRESSES.LOGIN}`, {
          user_id: phoneNumber,
          fcm_token:fcm_token
          // PIN: pin
        })
        .then(res => {
          console.log(res.data,'login==================================');
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  }
  return { login }
}
