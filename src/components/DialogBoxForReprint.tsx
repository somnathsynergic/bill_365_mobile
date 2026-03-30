import { PropsWithChildren, useState } from "react"
import { Dialog, Portal, Button, Text, TouchableRipple } from "react-native-paper"
import Clipboard from "@react-native-clipboard/clipboard"
import { usePaperColorScheme } from "../theme/theme"
import { Alert, Pressable, ToastAndroid, useColorScheme, View } from "react-native"
import ScrollableListContainer from "./ScrollableListContainer"
import AddedProductList from "./AddedProductList"
import NetTotalForRePrints from "./NetTotalForRePrints"
import ButtonPaper from "./ButtonPaper"
import normalize from "react-native-normalize"
import { ShowBillData } from "../models/api_types"
import useCancelBill from "../hooks/api/useCancelBill"
import { loginStorage } from "../storage/appStorage"

type DialogBoxProps = {
  visible: boolean
  hide: () => void
  title?: string
  btnFail?: string
  btnSuccess?: string
  icon?: string
  iconSize?: number
  titleStyle?: {}
  buttonSuccessIcon?: string
  dismissable?: boolean
  currentReceiptNo?: number
  billedSaleData?: ShowBillData[]
  cancelledBillStatus?: string
  netTotalButtonColors?: Array<string>
  handleCancelBill?: (rcptNo: number) => void

  onDialogFailure?: () => void
  onDialogSuccecss?: () => void
}

export default function DialogBoxForReprint({
  children,
  visible,
  icon,
  iconSize,
  title,
  titleStyle,
  hide,
  dismissable = false,
  cancelledBillStatus,
  currentReceiptNo,
  billedSaleData = [],
  netTotalButtonColors = [],
  handleCancelBill,
  onDialogFailure,
  onDialogSuccecss
}: PropsWithChildren<DialogBoxProps>) {
  const theme = usePaperColorScheme()
  const colorScheme = useColorScheme()
  let netTotal = 0,
    totalDiscount = 0

  // const handleCancellingBill = async (rcptNo: number) => {
  //   await cancelBill(rcptNo, loginStore.user_id).then(res => {
  //     if (res?.status === 1) {
  //       ToastAndroid.show(res?.data, ToastAndroid.SHORT)
  //       setVisible(!visible)
  //     }
  //   }).catch(err => {
  //     ToastAndroid.show(`Error occurred during cancelling bill. ${err}`, ToastAndroid.SHORT)
  //     setVisible(!visible)
  //   })

  //   handleGetBillSummary()
  //   handleGetRecentBills()
  // }

  // const handleCancelBill = (rcptNo: number) => {
  //   Alert.alert(
  //     "Cancelling Bill",
  //     `Are you sure you want to cancel this bill?`,
  //     [
  //       { text: "BACK", onPress: () => null },
  //       { text: "CANCEL BILL", onPress: () => handleCancellingBill(rcptNo) },
  //     ],
  //     { cancelable: false },
  //   )
  // }

  const copyToClipboard = (value: string) => {
    Clipboard.setString(value)
    ToastAndroid.show(`Copied: ${value}`, ToastAndroid.SHORT)
  }
  return (
    <Portal>
      <Dialog
        style={{
          // backgroundColor: '#f5f9ff',
          backgroundColor: colorScheme === "dark" ? 'black' : 'white',
          borderRadius: normalize(10),
          padding: normalize(16),
        }}
        visible={visible}
        onDismiss={hide}
        theme={theme}
        dismissable={dismissable}
      >
        {icon && <Dialog.Icon icon={icon} size={iconSize} />}
        {title && <Dialog.Title style={{ ...titleStyle, color: colorScheme === "dark" ? '#009689' : '#008181' }}>{title}</Dialog.Title>}
        <Dialog.Content>
          <View style={{ paddingBottom: 0 }}>
            <Text style={{ fontWeight: 'bold', color: colorScheme === "dark" ? '#009689' : '#008181', fontSize: normalize(16) }}>
              {currentReceiptNo || "Fetching receipt..."}
            </Text>
            <Text style={{ color: '#97979eff', fontSize: normalize(13) }}>
              {billedSaleData[0]?.created_dt ? new Date(billedSaleData[0]?.created_dt).toLocaleString("en-GB") : "Fetching date..."}
            </Text>
          </View>

          <View style={{ marginVertical: 10 }}>
            <View style={{ borderBottomWidth: 1, borderColor: '#ececf0ff', marginVertical: 5 }} />
            {billedSaleData[0]?.cust_name && (
              <Text style={{ fontWeight: 'bold', color: colorScheme === "dark" ? '#009689' : '#008181', fontSize: normalize(16) }}>
                {billedSaleData[0]?.cust_name}
              </Text>
            )}
            <TouchableRipple onPress={() => copyToClipboard(billedSaleData[0]?.phone_no)}>
              <Text style={{ color: '#97979eff', fontSize: normalize(14) }}>
                {billedSaleData[0]?.phone_no}
              </Text>
            </TouchableRipple>
            <Text style={{ color: '#FFCD04', fontSize: normalize(12) }}>
              Payment Mode: {`[${billedSaleData[0]?.pay_mode === "C" ? "Cash" : billedSaleData[0]?.pay_mode === "D" ? "Card" : billedSaleData[0]?.pay_mode === "U" ? "UPI" : billedSaleData[0]?.pay_mode === "R" ? "Credit" : billedSaleData[0]?.pay_mode === null ? "Pay Off" : "Fetching mode..."}]`}
            </Text>
          </View>

         <ScrollableListContainer
  backgroundColor={colorScheme === "dark" ? '#2e2929ff' : '#FBF1CB'}
  height={Math.min(billedSaleData?.length * 60, 250)} // Adjust item height as needed
  width={280}
>
  {billedSaleData?.map((item, i) => {
    netTotal += item.price * item.qty;
    totalDiscount = item?.tdiscount_amt;
    return (
      <View
        key={i}
        style={{
          backgroundColor: colorScheme === "dark" ? '#2e2929ff' : '#ffffff',
          borderRadius: normalize(6),
          padding: normalize(10),
          marginBottom: normalize(8),
          elevation: 1,
          borderWidth: 1,
          borderColor: colorScheme === "dark" ? '#2e2929ff' : '#ececf0ff',
        }}
      >
        <Text
          style={{
            fontWeight: 'bold',
            color: colorScheme === "dark" ? '#009689' : '#008181',
            fontSize: normalize(14),
          }}
        >
          {item.item_name}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: normalize(4) }}>
          <Text style={{ color: '#97979eff', fontSize: normalize(12) }}>Qty: {item.qty}</Text>
          <Text style={{ color: '#008181', fontSize: normalize(12) }}>₹{item.price}</Text>
        </View>
        {item?.discount_flag === 'Y' && (
          <Text style={{ color: '#FFCD04', fontSize: normalize(11), marginTop: normalize(2) }}>
            Discount: {item?.discount_type === 'P' ? `${item?.dis_pertg}%` : `₹${item?.discount_amt}`}
          </Text>
        )}
      </View>
    );
  })}
</ScrollableListContainer>

         {/* <NetTotalForRePrints
  width={280}
  backgroundColor='#fff'
  addedProductsList={billedSaleData}
  netTotal={netTotal}
  textColor='#008181'
  totalDiscount={totalDiscount}
  disabled
  // style={{
   
  // }}
/> */}
<NetTotalForRePrints
  width={280}
  backgroundColor={colorScheme === "dark" ? '#2e2929ff' : '#ffffff'}
  addedProductsList={billedSaleData}
  netTotal={netTotal}
  textColor={colorScheme === "dark" ? '#009689' : '#008181'}
  totalDiscount={totalDiscount}
  disabled
  // style={{
   
  // }}
/>



          <View style={{ paddingTop: normalize(10) }}>
            <ButtonPaper
              style={{ borderRadius: normalize(0) }}
              icon="cancel"
              mode="contained-tonal"
              onPress={() => handleCancelBill(currentReceiptNo)}
              buttonColor='#FFCD04'
              textColor='#97979eff'
              disabled={cancelledBillStatus === "Y"}
            >
              CANCEL BILL
            </ButtonPaper>
          </View>

          <View style={{ justifyContent: "space-between", flexDirection: "row", paddingTop: 10 }}>
            <ButtonPaper
              mode="text"
              onPress={onDialogFailure}
              textColor='#97979eff'
            >
              Cancel
            </ButtonPaper>
            <ButtonPaper
              mode="text"
              onPress={onDialogSuccecss}
              textColor='#008181'
            >
              Reprint
            </ButtonPaper>
          </View>
        </Dialog.Content>
      </Dialog>
    </Portal>

  )
}
