import {
  View,
  ScrollView,
  StyleSheet,
  ToastAndroid,
  Alert,
  BackHandler,
  useColorScheme,
} from "react-native"
import React, { useContext, useEffect, useState } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { Divider, List } from "react-native-paper"
import normalize, { SCREEN_HEIGHT, SCREEN_WIDTH } from "react-native-normalize"
import HeaderImage from "../components/HeaderImage"
import { flowerHome, flowerHomeDark } from "../resources/images"
import { usePaperColorScheme } from "../theme/theme"
import { loginStorage } from "../storage/appStorage"
import { useIsFocused, useNavigation } from "@react-navigation/native"
import { AppStore } from "../context/AppContext"
import MenuPaper from "../components/MenuPaper"
import ButtonPaper from "../components/ButtonPaper"
import { GeneralSettingsEditCredentials } from "../models/api_types"
import InputPaper from "../components/InputPaper"
import useGeneralSettings from "../hooks/api/useGeneralSettings"
import { AppStoreContext } from "../models/custom_types"

export default function GeneralSettingsScreen() {
  const theme = usePaperColorScheme()
  const isFocused = useIsFocused()
  const navigation = useNavigation()
  const colorScheme = useColorScheme()
  const loginStore = JSON.parse(loginStorage.getString("login-data"))

  const { receiptSettings, handleGetReceiptSettings } = useContext<AppStoreContext>(AppStore)

  const { editGeneralSettings } = useGeneralSettings()

  const [isLoading, setIsLoading] = useState(() => false)
  const [isDisabled, setIsDisabled] = useState(() => false)

  const [rcptType, setRcptType] = useState<"P" | "B" | "S">(
    () => receiptSettings?.rcpt_type || "P",
  )
  const [receiptFlag, setReceiptFlag] = useState<"Y" | "N">(
    () => receiptSettings?.rcpt_flag || "Y",
  )
  const [stockFlag, setStockFlag] = useState<"Y" | "N">(
    () => receiptSettings?.stock_flag || "N",
  )
  const [customerInfo, setCustomerInfo] = useState<"Y" | "N">(
    () => receiptSettings?.cust_inf || "Y",
  )
  const [payMode, setPayMode] = useState<"Y" | "N">(
    () => receiptSettings?.pay_mode || "Y",
  )
  const [priceType, setPriceType] = useState<"A" | "M">(
    () => receiptSettings?.price_type || "M",
  )
  const [cashFlag, setCashFlag] = useState<"Y" | "N">(
    () => receiptSettings?.rcv_cash_flag || "Y",
  )
  const [kot, setKot] = useState<"Y" | "N">(
    () => receiptSettings?.kot_flag || "N",
  )
  const [low_stock, setLowStock] = useState<"Y" | "N">(
    () => receiptSettings?.stock_alert_flag || "N",
  )
  const [low_stock_prtg, setLowStockPrtg] = useState<number>(
    () => receiptSettings?.stock_alert_prtg || 100,
    // () =>  100,
  )
  const [refundTime, setRefundTime] = useState<number>(
    () => receiptSettings?.refund_days || 1,
  )
  const [unitFlag, setUnitFlag] = useState<"Y" | "N">(
    receiptSettings?.unit_flag,
  )

  const [printOp, setPrintOp] = useState(
    receiptSettings?.print_op,
  )

  const [custom_sl_flag, setCust_sl_flag] = useState(
    receiptSettings?.custom_sl_flag || "N",
  )

  let receiptTypeArr = [
    {
      icon: "cloud-print-outline",
      title: "Print",
      func: () => setRcptType("P"),
    },
    { icon: "android-messages", title: "SMS", func: () => setRcptType("S") },
    { icon: "all-inclusive", title: "Both", func: () => setRcptType("B") },
  ]

  // let receiptFlagArr = [
  //   { icon: "check-outline", title: "Allow", func: () => setReceiptFlag("Y") },
  //   { icon: "close-outline", title: "Deny", func: () => setReceiptFlag("N") },
  // ]

  let stockFlagArr = [
    { icon: "check-outline", title: "Allow", func: () => setStockFlag("Y") },
    { icon: "close-outline", title: "Deny", func: () => setStockFlag("N") },
  ]

  let customerInfoArr = [
    { icon: "check-outline", title: "Allow", func: () => setCustomerInfo("Y") },
    { icon: "close-outline", title: "Deny", func: () => setCustomerInfo("N") },
  ]

  let payModeArr = [
    { icon: "check-outline", title: "Allow", func: () => setPayMode("Y") },
    { icon: "close-outline", title: "Deny", func: () => setPayMode("N") },
  ]

  let custom_sl_flagArr = [
    { icon: "check-outline", title: "On", func: () => setCust_sl_flag("Y") },
    { icon: "close-outline", title: "Off", func: () => setCust_sl_flag("N") },
  ]

  let low_stock_flagArr = [
    { icon: "check-outline", title: "On", func: () => setLowStock("Y") },
    { icon: "close-outline", title: "Off", func: () => setLowStock("N") },
  ]

  let print_op_flagArr = [
    { icon: "check-outline", title: "2 Inch", func: () => setPrintOp("2") },
    { icon: "close-outline", title: "3 Inch", func: () => setPrintOp("3") },
  ]


  let priceAutoManualArr = [
    { icon: "auto-fix", title: "Auto", func: () => setPriceType("A") },
    {
      icon: "database-edit-outline",
      title: "Manual",
      func: () => setPriceType("M"),
    },
  ]

  let cashFlagArr = [
    { icon: "check-outline", title: "Allow", func: () => setCashFlag("Y") },
    {
      icon: "close-outline",
      title: "Deny",
      func: () => setCashFlag("N"),
    },
  ]

  let unitSwitchArr = [
    { icon: "check-outline", title: "Allow", func: () => setUnitFlag("Y") },
    { icon: "close-outline", title: "Deny", func: () => setUnitFlag("N") },
  ]

  let kotArr = [
    { icon: "check-outline", title: "Allow", func: () => setKot("Y") },
    { icon: "close-outline", title: "Deny", func: () => setKot("N") },
  ]

  const handleReceiptSettingsUpdate = async () => {
    setIsDisabled(true)
    setIsLoading(true)
    let editedGeneralSettings: GeneralSettingsEditCredentials = {
      comp_id: loginStore?.comp_id,
      rcpt_type: rcptType,
      rcv_cash_flag: cashFlag,
      stock_flag: stockFlag,
      cust_inf: customerInfo,
      pay_mode: payMode,
      price_type: priceType,
      kot_flag: kot,
      modified_by: loginStore?.user_name,
      unit_flag: unitFlag,
      refund_days: refundTime,
      custom_sl_flag: custom_sl_flag,
      stock_alert_flag: low_stock,
      stock_alert_prtg: low_stock_prtg,
      print_op: printOp
    }

    console.log("==========+++++++++++=+===+++++++++======", editedGeneralSettings)

    await editGeneralSettings(editedGeneralSettings)
      .then(res => {
        ToastAndroid.show("General Settings Updated!", ToastAndroid.SHORT)

        console.log("*****************************************", res)
        handleGetReceiptSettings()
        navigation.goBack()
      })
      .catch(err => {
        ToastAndroid.show(
          "Something went wrong while updating!",
          ToastAndroid.SHORT,
        )
      })
    setIsDisabled(false)
    setIsLoading(false)
  }

  useEffect(() => {
    const backAction = () => {
      Alert.alert(
        "Want to Go Back?",
        "Please press UPDATE Button to update. Do you want to still go back?",
        [
          {
            text: "NO",
            onPress: () => null,
            style: "cancel",
          },
          { text: "YES", onPress: () => navigation.goBack() },
        ],
      )
      return true
    }

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    )

    return () => backHandler.remove()
  }, [])

  const backPressed = () => {
    Alert.alert(
      "Want to Go Back?",
      "Please press UPDATE Button to update. Do you want to still go back?",
      [
        {
          text: "NO",
          onPress: () => null,
          style: "cancel",
        },
        { text: "YES", onPress: () => navigation.goBack() },
      ],
    )
  }

  return (
    // <SafeAreaView
    //   style={[{ backgroundColor: theme.colors.background, height: "100%" }]}>
    //   <ScrollView keyboardShouldPersistTaps="handled">
    //     <View style={{ alignItems: "center" }}>
    //       <HeaderImage
    //         isBackEnabled
    //         isBackCustom={true}
    //         backPressed={backPressed}
    //         imgLight={flowerHome}
    //         imgDark={flowerHomeDark}
    //         borderRadius={30}
    //         blur={10}>
    //         General Settings
    //       </HeaderImage>
    //     </View>

    //     <View
    //       style={{
    //         paddingHorizontal: normalize(25),
    //         paddingBottom: normalize(10),
    //       }}>
    //       {loginStore?.user_type === "M" ? (
    //         <ButtonPaper
    //           icon="cloud-upload-outline"
    //           mode="contained"
    //           onPress={handleReceiptSettingsUpdate}
    //           loading={isLoading}
    //           buttonColor="#008181"
    //           disabled={isDisabled}>
    //           UPDATE
    //         </ButtonPaper>
    //       ) : (
    //         <ButtonPaper
    //           disabled
    //           mode="elevated"
    //           onPress={() => console.log("UPDATE")}>
    //           YOU CAN'T UPDATE
    //         </ButtonPaper>
    //       )}
    //     </View>

    //     <View style={{ padding: normalize(20) }}>
    //       <List.Item 
    //         title="Receipt Type"
    //         description={
    //           rcptType === "P"
    //             ? "Print"
    //             : rcptType === "S"
    //               ? "SMS"
    //               : rcptType === "B"
    //                 ? "Both"
    //                 : "Error Occurred!"
    //         }
    //         left={props => <List.Icon {...props} icon="receipt" />}
    //         right={props => {
    //           return <MenuPaper menuArrOfObjects={receiptTypeArr} disabled />
    //         }}
    //         descriptionStyle={{ color: theme.colors.primary }}
    //       />
    //       <Divider />
    //       <List.Item
    //         title="Inventory"
    //         description={
    //           stockFlag === "Y"
    //             ? "Allowed"
    //             : stockFlag === "N"
    //               ? "Denied"
    //               : "Error Occurred!"
    //         }
    //         left={props => <List.Icon {...props} icon="inbox-full-outline" />}
    //         right={props => {
    //           return <MenuPaper textColor="#008181" menuArrOfObjects={stockFlagArr} />
    //         }}
    //         descriptionStyle={{
    //           color:
    //             stockFlag === "Y" ? theme.colors.green : theme.colors.error,
    //         }}
    //       />
    //       <Divider />
    //       <List.Item
    //         title="Unit"
    //         description={
    //           unitFlag === "Y"
    //             ? "Allowed"
    //             : unitFlag === "N"
    //               ? "Denied"
    //               : "Error Occurred!"
    //         }
    //         left={props => <List.Icon {...props} icon="weight-kilogram" />}
    //         right={props => {
    //           return <MenuPaper textColor="#008181" menuArrOfObjects={unitSwitchArr} />
    //         }}
    //         descriptionStyle={{
    //           color: unitFlag === "Y" ? theme.colors.green : theme.colors.error,
    //         }}
    //       />
    //       <Divider />
    //       <List.Item
    //         title="Customer Name"
    //         description={
    //           customerInfo === "Y"
    //             ? "Allowed"
    //             : customerInfo === "N"
    //               ? "Denied"
    //               : "Error Occurred!"
    //         }
    //         left={props => (
    //           <List.Icon {...props} icon="account-circle-outline" />
    //         )}
    //         right={props => {
    //           return <MenuPaper textColor="#008181" menuArrOfObjects={customerInfoArr} />
    //         }}
    //         descriptionStyle={{
    //           color:
    //             customerInfo === "Y" ? theme.colors.green : theme.colors.error,
    //         }}
    //       />
    //       <Divider />
    //       <List.Item
    //         title="Payment Mode"
    //         description={
    //           payMode === "Y"
    //             ? "Allowed"
    //             : payMode === "N"
    //               ? "Denied"
    //               : "Error Occurred!"
    //         }
    //         left={props => (
    //           <List.Icon {...props} icon="contactless-payment-circle-outline" />
    //         )}
    //         right={props => {
    //           return <MenuPaper textColor="#008181" menuArrOfObjects={payModeArr} />
    //         }}
    //         descriptionStyle={{
    //           color: payMode === "Y" ? theme.colors.green : theme.colors.error,
    //         }}
    //       />
    //        <Divider />
    //       <List.Item
    //         title="Custom Receipt"
    //         description={
    //           custom_sl_flag === "Y"
    //             ? "On"
    //             : custom_sl_flag === "N"
    //               ? "Off"
    //               : "Error Occurred!"
    //         }
    //         left={props => (
    //           <List.Icon {...props} icon="receipt" />
    //         )}
    //         right={props => {
    //           return <MenuPaper textColor="#008181" menuArrOfObjects={custom_sl_flagArr} />
    //         }}
    //         descriptionStyle={{
    //           color: custom_sl_flag === "Y" ? theme.colors.green : theme.colors.error,
    //         }}
    //       />
    //       <Divider />
    //       <List.Item
    //         title="Cash Receive"
    //         description={
    //           cashFlag === "Y"
    //             ? "Allowed"
    //             : cashFlag === "N"
    //               ? "Denied"
    //               : "Error Occurred!"
    //         }
    //         left={props => (
    //           <List.Icon {...props} icon="cash-remove" />
    //         )}
    //         right={props => {
    //           return <MenuPaper textColor="#008181" menuArrOfObjects={cashFlagArr} />
    //         }}
    //         descriptionStyle={{
    //           color: cashFlag === "Y" ? theme.colors.green : theme.colors.error,
    //         }}
    //       />
    //       <Divider />
    //       <List.Item
    //         title="Price Type"
    //         description={
    //           priceType === "A"
    //             ? "Automatic"
    //             : priceType === "M"
    //               ? "Manual Edit"
    //               : "Error Occurred!"
    //         }
    //         left={props => <List.Icon {...props} icon="cash-lock-open" />}
    //         right={props => {
    //           return <MenuPaper textColor="#008181" menuArrOfObjects={priceAutoManualArr} />
    //         }}
    //         descriptionStyle={{
    //           color:
    //             priceType === "A" ? theme.colors.primary : theme.colors.orange,
    //         }}
    //       />
    //       <Divider />
    //       <List.Item
    //         title="KOT"
    //         description={
    //           kot === "Y"
    //             ? "Allowed"
    //             : kot === "N"
    //               ? "Denied"
    //               : "Error Occurred!"
    //         }
    //         left={props => <List.Icon {...props} icon="badge-account-outline" />}
    //         right={props => {
    //           return <MenuPaper textColor="#008181" menuArrOfObjects={kotArr} />
    //         }}
    //         descriptionStyle={{
    //           color:
    //             kot === "Y" ? theme.colors.green : theme.colors.error,
    //         }}
    //       />
    //       <Divider />
    //       <List.Item
    //         title="Refund Time (In Days)"
    //         description={
    //           refundTime == 1 ? `${refundTime} day` : `${refundTime} days`
    //         }
    //         left={props => <List.Icon {...props} icon="cash-refund" />}
    //         right={props => {
    //           return (
    //             <InputPaper
    //               keyboardType="numeric"
    //               label="Days"
    //               mode="outlined"
    //               value={refundTime}
    //               onChangeText={(txt: number) => setRefundTime(txt)}
    //               customStyle={{ height: normalize(35) }}
    //               maxLength={3}
    //             />
    //           )
    //         }}
    //         descriptionStyle={{
    //           color:
    //             priceType === "A" ? theme.colors.primary : theme.colors.orange,
    //         }}
    //       />
    //       <Divider/>
    //       <List.Item
    //         title="Printer Options"
    //         description={
    //           printOp === "2"
    //             ? "2 Inch"
    //             :"3 Inch"
    //         }
    //         left={props => <List.Icon {...props} icon="badge-account-outline" />}
    //         right={props => {
    //           return <MenuPaper textColor="#008181" menuArrOfObjects={print_op_flagArr} />
    //         }}
    //         descriptionStyle={{
    //           color:
    //             theme.colors.green ,
    //         }}
    //       />
    //       {/* <Divider />
    //        <List.Item
    //         title="Low Stock Alert"
    //         description={
    //           low_stock === "Y"
    //             ? "Allowed"
    //             : low_stock === "N"
    //               ? "Denied"
    //               : "Error Occurred!"
    //         }
    //         left={props => <List.Icon {...props} icon="badge-account-outline" />}
    //         right={props => {
    //           return <MenuPaper textColor="#008181" menuArrOfObjects={low_stock_flagArr} />
    //         }}
    //         descriptionStyle={{
    //           color:
    //             low_stock === "Y" ? theme.colors.green : theme.colors.error,
    //         }}
    //       />
    //       <Divider />
    //       {low_stock == 'Y' && <List.Item
    //         title="Minimum qty. for alert"

    //         left={props => <List.Icon {...props} icon="cash-refund" />}
    //         right={props => {
    //           return (
    //             <InputPaper
    //               keyboardType="numeric"
    //               label="qty."
    //               mode="outlined"
    //               value={low_stock_prtg}
    //               onChangeText={(txt: number) => setLowStockPrtg(txt)}
    //               customStyle={{ height: normalize(35) }}
    //               maxLength={3}
    //             />
    //           )
    //         }}
    //         descriptionStyle={{
    //           color:
    //             priceType === "A" ? theme.colors.primary : theme.colors.orange,
    //         }}
    //       />} */}
    //     </View>
    //   </ScrollView>
    // </SafeAreaView>

    <SafeAreaView style={[{ backgroundColor: theme.colors.background, height: "100%" }]}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: "center", marginBottom: normalize(20) }}>
          <View style={{ alignItems: "center" }}>
            <HeaderImage
              isBackEnabled
              isBackCustom={true}
              backPressed={backPressed}
              imgLight={flowerHome}
              imgDark={flowerHomeDark}
              borderRadius={30}
              blur={10}>
              General Settings
            </HeaderImage>
          </View>
        </View>

        <View style={{ paddingHorizontal: normalize(25), paddingBottom: normalize(10) }}>
          {loginStore?.user_type === "M" ? (
            <ButtonPaper
              icon="cloud-upload-outline"
              mode="contained"
              onPress={handleReceiptSettingsUpdate}
              loading={isLoading}
              disabled={isDisabled}
              buttonColor={colorScheme === "dark" ? "#009689" : "#008181"}
              textColor="white"
              style={{ borderRadius: normalize(8), elevation: 1 }}
            >
              UPDATE
            </ButtonPaper>
          ) : (
            <ButtonPaper
              disabled
              mode="elevated"
              onPress={() => console.log("UPDATE")}
              buttonColor="#f5f9ff"
              textColor="#97979eff"
              style={{ borderRadius: normalize(8), elevation: 1 }}
            >
              YOU CAN'T UPDATE
            </ButtonPaper>
          )}
        </View>

        {receiptSettings?.stock_flag == 'Y' && (
          <View style={{ padding: normalize(20) }}>
            {[
              { title: "Receipt Type", value: rcptType, arr: receiptTypeArr, icon: "receipt" },
              { title: "Inventory", value: stockFlag, arr: stockFlagArr, icon: "inbox-full-outline" },
              { title: "Unit", value: unitFlag, arr: unitSwitchArr, icon: "weight-kilogram" },
              { title: "Customer Name", value: customerInfo, arr: customerInfoArr, icon: "account-circle-outline" },
              { title: "Payment Mode", value: payMode, arr: payModeArr, icon: "contactless-payment-circle-outline" },
              { title: "Custom Receipt", value: custom_sl_flag, arr: custom_sl_flagArr, icon: "receipt" },
              { title: "Cash Receive", value: cashFlag, arr: cashFlagArr, icon: "cash-remove" },
              { title: "Price Type", value: priceType, arr: priceAutoManualArr, icon: "cash-lock-open" },
              { title: "KOT", value: kot, arr: kotArr, icon: "badge-account-outline" },
              { title: "Printer Options", value: printOp, arr: print_op_flagArr, icon: "badge-account-outline" },
            ].map((item, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: colorScheme === "dark" ? "#008181" : "#ececf0ff",
                  borderRadius: normalize(8),
                  elevation: 1,
                  borderWidth: 1,
                  borderColor: colorScheme === "dark" ? "#2e2929ff" : '#ececf0ff',
                  padding: normalize(12),
                  marginBottom: normalize(12),
                }}
              >
                <List.Item
                  title={item.title}
                  description={
                    item.value === "Y" || item.value === "A" || item.value === "2"
                      ? item.value === "Y" ? "Allowed" : item.value === "A" ? "Automatic" : item.value === "2" ? "2 Inch" : "On"
                      : item.value === "N" || item.value === "M" || item.value === "3"
                        ? item.value === "N" ? "Denied" : item.value === "M" ? "Manual Edit" : item.value === "3" ? "3 Inch" : "Off" : item.value == 'P' ? "Print" : item.value == 'S' ? "SMS" : item.value == 'B' ? "Both" :
                          "Error Occurred!"
                  }
                  left={props => <List.Icon {...props} icon={item.icon} color={colorScheme === "dark" ? "#009689" : "#008181"} />}
                  right={() => (
                    <MenuPaper menuArrOfObjects={item.arr} textColor="#008181" />
                  )}
                  descriptionStyle={{
                    color: item.value === "Y" || item.value === "A" || item.value === "2" ? '#009689' : theme.colors.error,
                  }}
                />
              </View>
            ))}

            <View
              style={{
                backgroundColor: colorScheme === "dark" ? "#2e2929ff" : "#ffffff",
                borderRadius: normalize(8),
                elevation: 1,
                borderWidth: 1,
                borderColor: colorScheme === "dark" ? "#2e2929ff" : '#ececf0ff',
                padding: normalize(12),
                marginBottom: normalize(12),
              }}
            >
              <List.Item
                title="Refund Time (In Days)"
                description={`${refundTime == 1 ? `${refundTime} day` : `${refundTime} days`}`}
                left={props => <List.Icon {...props} icon="cash-refund" color={colorScheme === "dark" ? "#009689" : "#ececf0ff"} />}
                right={props => (
                  <InputPaper
                    keyboardType="numeric"
                    label="Days"
                    mode="outlined"
                    value={refundTime}
                    onChangeText={(txt: any) => setRefundTime(txt)}
                    customStyle={{ height: normalize(35) }}
                    maxLength={3}
                  />
                )}
                descriptionStyle={{ color: '#008181' }}
              />
            </View>
          </View>)}
        {receiptSettings?.stock_flag == 'N' && (
          <View style={{ padding: normalize(20) }}>
            {[
              { title: "Receipt Type", value: rcptType, arr: receiptTypeArr, icon: "receipt" },
              { title: "Unit", value: unitFlag, arr: unitSwitchArr, icon: "weight-kilogram" },
              { title: "Customer Name", value: customerInfo, arr: customerInfoArr, icon: "account-circle-outline" },
              { title: "Payment Mode", value: payMode, arr: payModeArr, icon: "contactless-payment-circle-outline" },
              { title: "Custom Receipt", value: custom_sl_flag, arr: custom_sl_flagArr, icon: "receipt" },
              { title: "Cash Receive", value: cashFlag, arr: cashFlagArr, icon: "cash-remove" },
              { title: "Price Type", value: priceType, arr: priceAutoManualArr, icon: "cash-lock-open" },
              { title: "KOT", value: kot, arr: kotArr, icon: "badge-account-outline" },
              { title: "Printer Options", value: printOp, arr: print_op_flagArr, icon: "badge-account-outline" },
            ].map((item, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: colorScheme === "dark" ? "#2e2929ff" : "#ececf0ff",
                  borderRadius: normalize(8),
                  elevation: 1,
                  borderWidth: 1,
                  borderColor: colorScheme === "dark" ? "#2e2929ff" : '#ececf0ff',
                  padding: normalize(12),
                  marginBottom: normalize(12),
                }}
              >
                <List.Item
                  title={item.title}
                  description={
                    item.value === "Y" || item.value === "A" || item.value === "2"
                      ? item.value === "Y" ? "Allowed" : item.value === "A" ? "Automatic" : item.value === "2" ? "2 Inch" : "On"
                      : item.value === "N" || item.value === "M" || item.value === "3"
                        ? item.value === "N" ? "Denied" : item.value === "M" ? "Manual Edit" : item.value === "3" ? "3 Inch" : "Off" : item.value == 'P' ? "Print" : item.value == 'S' ? "SMS" : item.value == 'B' ? "Both" :
                          "Error Occurred!"
                  }
                  left={props => <List.Icon {...props} icon={item.icon} color="#008181" />}
                  right={() => (
                    <MenuPaper menuArrOfObjects={item.arr} textColor="#008181" />
                  )}
                  descriptionStyle={{
                    color: item.value === "Y" || item.value === "A" || item.value === "2" ? '#41c57f' : theme.colors.error,
                  }}
                />
              </View>
            ))}

            <View
              style={{
                backgroundColor: colorScheme === "dark" ? "#2e2929ff" : "#ececf0ff",
                borderRadius: normalize(8),
                elevation: 1,
                borderWidth: 1,
                borderColor: colorScheme === "dark" ? "#2e2929ff" : '#ececf0ff',
                padding: normalize(12),
                marginBottom: normalize(12),
              }}
            >
              <List.Item
                title="Refund Time (In Days)"
                description={`${refundTime == 1 ? `${refundTime} day` : `${refundTime} days`}`}
                left={props => <List.Icon {...props} icon="cash-refund" color={colorScheme === "dark" ? "#ececf0ff" : "#009689"} />}
                right={props => (
                  <InputPaper
                    keyboardType="numeric"
                    label="Days"
                    mode="outlined"
                    value={refundTime}
                    onChangeText={(txt: any) => setRefundTime(txt)}
                    customStyle={{ height: normalize(35) }}
                    maxLength={3}
                  />
                )}
                descriptionStyle={{ color: colorScheme === "dark" ? "#ececf0ff" : "#009689" }}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  iconBtnStyle: {
    justifyContent: "center",
    alignItems: "center",
    width: SCREEN_WIDTH / 10,
    height: SCREEN_HEIGHT / 20,
  },
  iconStyle: {
    alignSelf: "center",
  },
})
