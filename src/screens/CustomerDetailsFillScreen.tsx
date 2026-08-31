import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  ToastAndroid,
  useColorScheme,
  View,
} from "react-native"
import { List, RadioButton, Text } from "react-native-paper"
import LinearGradient from "react-native-linear-gradient"
import normalize, { SCREEN_HEIGHT, SCREEN_WIDTH } from "react-native-normalize"
import { usePaperColorScheme } from "../theme/theme"
import InputPaper from "../components/InputPaper"
import { useContext, useEffect, useState } from "react"
import ButtonPaper from "../components/ButtonPaper"
import {
  CommonActions,
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native"
import HeaderImage from "../components/HeaderImage"
import { productHeader, productHeaderDark } from "../resources/images"
import { useBluetoothPrint } from "../hooks/printables/useBluetoothPrint"
import NetTotalButton from "../components/NetTotalButton"
import { AppStore } from "../context/AppContext"
import SquircleBox from "../components/SquircleBox"
import useSaleInsert from "../hooks/api/useSaleInsert"
import { fileStorage, itemsContextStorage, loginStorage } from "../storage/appStorage"
import { AppStoreContext, FilteredItem } from "../models/custom_types"
import navigationRoutes from "../routes/navigationRoutes"
import { ProductsScreenRouteProp } from "../models/route_types"
import { mapItemToFilteredItem } from "../utils/mapItemToFilteredItem"
import { gstFilterationAndTotals } from "../utils/gstFilterTotal"
import useCalculations from "../hooks/useCalculations"
import useCustomerInfo from "../hooks/api/useCustomerInfo"
import useBillSms from "../hooks/api/useBillSms"
import {
  BillSmsCredentials,
  CustomerInfoCredentials,
} from "../models/api_types"
import useBillSms2 from "../hooks/api/useBillSms2"
import QRCode from "react-native-qrcode-svg"

const CustomerDetailsFillScreen = () => {
  const isFocused = useIsFocused()
  const navigation = useNavigation()
  const colorScheme = useColorScheme()
  const { params } = useRoute<ProductsScreenRouteProp>()
  const theme = usePaperColorScheme()

  const loginStore = JSON.parse(loginStorage.getString("login-data"))
  const upiData = fileStorage.getString("upi-data")

  const { receiptSettings } = useContext<AppStoreContext>(AppStore)

  const { totalGST } = gstFilterationAndTotals(
    params?.added_products,
    receiptSettings?.gst_type,
  )

  const { printReceipt, printReceiptWithoutGst } = useBluetoothPrint()
  const {
    grandTotalCalculate,
    grandTotalWithGSTCalculate,
    grandTotalWithGSTInclCalculate,
  } = useCalculations()
  const { sendSaleDetails } = useSaleInsert()
  const { fetchCustomerInfo } = useCustomerInfo()
  // const { sendBillSms } = useBillSms()
  const { sendBillSms } = useBillSms2()

  const [customerName, setCustomerName] = useState<string>(() => "")
  const [customerMobileNumber, setCustomerMobileNumber] = useState<string>(
    () => "",
  )
  const [cashAmount, setCashAmount] = useState<number>(
    () => 0,
  )
  const [finalCashAmount, setFinalCashAmount] = useState<number>(
    () => 0,
  )
  const [discountBillwise, setDiscountBillwise] = useState<number>(() => 0)

  let receiptNumber: number | undefined = undefined
  let rcpt_sl_no: number | undefined = undefined
  let kotNumber: number | undefined = undefined

  const [checked, setChecked] = useState<string>(() => "C")
  const [isLoading, setIsLoading] = useState(() => false)
  const [isDisabled, setIsDisabled] = useState(() => false)

  const [customerInfoFlag, setCustomerInfoFlag] = useState<number>(() => 0)

  // let paymentModeOptionsArr = [
  //   { icon: "cash", title: "Cash", func: () => setChecked("C") },
  //   { icon: "credit-card-outline", title: "Card", func: () => setChecked("D") },
  //   { icon: "contactless-payment", title: "UPI", func: () => setChecked("U") },
  //   { icon: "credit-card-clock-outline", title: "Credit", func: () => setChecked("R") },
  // ]

  useEffect(() => {
    if (receiptSettings?.gst_flag === "Y") {
      receiptSettings?.gst_type === "E"
        ? setFinalCashAmount(() =>
          cashAmount !== undefined
            ? cashAmount -
            parseFloat(
              grandTotalWithGSTCalculate(
                params?.net_total,
                receiptSettings?.discount_position !== "B"
                  ? params?.total_discount
                  : receiptSettings?.discount_type === "A"
                    ? discountBillwise
                    : (params?.net_total * discountBillwise) / 100,
                totalGST,
              ),
            )
            : 0,
        )
        : setFinalCashAmount(() =>
          cashAmount !== undefined
            ? cashAmount -
            parseFloat(
              grandTotalWithGSTInclCalculate(
                params?.net_total,
                receiptSettings?.discount_position !== "B"
                  ? params?.total_discount
                  : receiptSettings?.discount_type === "A"
                    ? discountBillwise
                    : (params?.net_total * discountBillwise) / 100,
              ),
            )
            : 0,
        )
    } else {
      setFinalCashAmount(() =>
        cashAmount !== undefined
          ? cashAmount -
          grandTotalCalculate(
            params?.net_total,
            receiptSettings?.discount_position !== "B"
              ? params?.total_discount
              : receiptSettings?.discount_type === "A"
                ? discountBillwise
                : (params?.net_total * discountBillwise) / 100,
          )
          : 0,
      )
    }
  }, [cashAmount, discountBillwise, isFocused])

  useEffect(() => {
    if (customerMobileNumber.length === 10) {
      handleGetCustomerInfo()
    }
  }, [customerMobileNumber])

  // useEffect(() => {
  //   if (receiptSettings?.rcv_cash_flag === "N") {
  //     setCashAmount(Math.abs(finalCashAmount))

  //     console.log("TTTSSSSSGGGGGDDDDDD", cashAmount)
  //   }
  // }, [isFocused])

  const handleGetCustomerInfo = async () => {
    let fetchCustInfCreds: CustomerInfoCredentials = {
      comp_id: loginStore?.comp_id,
      phone_no: customerMobileNumber,
    }

    await fetchCustomerInfo(fetchCustInfCreds)
      .then(res => {
        setCustomerName(res?.data[0]?.cust_name)
        setCustomerInfoFlag(() => 1)
        if (res?.data?.length === 0) {
          setCustomerName("")
          setCustomerInfoFlag(() => 0)
        }
      })
      .catch(err => {
        ToastAndroid.show(
          "Some error occurred while fetching Customer Name!",
          ToastAndroid.SHORT,
        )
      })
  }

  const onChangeCustomerMobileNumber = (mobile: string) => {
    if (/^\d*$/.test(mobile)) {
      setCustomerMobileNumber(mobile)
    }
  }

  const handleDiscountBillwise = (dis: number) => {
    setDiscountBillwise(dis)
  }

  const handleSendSaleData = async () => {
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const branchId = loginStore.br_id
    const createdBy = loginStore.user_id

    let filteredData: FilteredItem[]

    filteredData = (params?.added_products).map(item =>
      mapItemToFilteredItem(
        item,
        receiptSettings,
        branchId,
        params,
        checked,
        cashAmount,
        customerName,
        customerMobileNumber,
        createdBy,
        totalGST,
        receiptSettings?.gst_flag,
        receiptSettings?.gst_type,
        receiptSettings?.discount_flag,
        receiptSettings?.discount_type,
        receiptSettings?.discount_position,
        receiptSettings?.rcpt_type,
        customerInfoFlag,
        receiptSettings?.stock_flag,

        discountBillwise || 0
      ),
    )

    console.log("filteredData - handleSendSaleData", filteredData)
    await sendSaleDetails(filteredData)
      .then(res => {
        console.log("filteredData====filteredData", filteredData)

        console.log("res.data.status===================", res.data.status)
        console.log("res.data===================", res.data)
        if (res.data.status === 1) {
          receiptNumber = res?.data?.data
          kotNumber = res?.kot_no?.kot_no
          rcpt_sl_no = res?.data?.rcpt_sl_no

          console.log(
            "=========== receiptNumber = res?.data?.data ============",
            receiptNumber,
          )
          console.log(
            "=========== kotNumber = res?.kot_no ============",
            kotNumber,
          )

          Alert.alert("Success", "Bill Uploaded Successfully.")

          navigation.dispatch(
            CommonActions.navigate({
              name: navigationRoutes.homeScreen,
            }),
          )

          if (receiptSettings?.rcpt_type !== "P") {
            let sendBillSmsCreds: BillSmsCredentials = {
              comp_id: loginStore?.comp_id,
              phone: customerMobileNumber,
              receipt_no: receiptNumber,
            }
            sendBillSms(sendBillSmsCreds)
              .then(res => {
                if (res?.suc === 1) {
                  ToastAndroid.show("SMS Sent to customer.", ToastAndroid.SHORT)
                }
              })
              .catch(err => {
                ToastAndroid.show(
                  "Some error occurred while sending bill sms.",
                  ToastAndroid.SHORT,
                )
              })
          }
        } else {
          Alert.alert("Fail", "Something Went Wrong!")
        }
      })
      .catch(err => {
        Alert.alert("Fail", "Error while sending sale details!!!!!")
        console.log("EEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR", err)
      })
  }

  const handlePrintReceipt = async (printFlag = false) => {
    // pass conditonal grand total after - now just written net_total
    if (discountBillwise > params?.net_total) {
      ToastAndroid.show("Enter valid Bill Discount!", ToastAndroid.SHORT)
      return
    }

    if (receiptSettings.cust_inf == 'Y' && (!customerMobileNumber || customerMobileNumber.length !== 10)) {
      ToastAndroid.show("A valid mobile no. is mandatory!", ToastAndroid.SHORT)
      return
    }

    if (receiptSettings?.rcv_cash_flag === "Y") {
      if (
        checked === "C" &&
        (cashAmount === undefined || cashAmount === 0 || finalCashAmount < 0)
      ) {
        ToastAndroid.show("Add valid cash amount.", ToastAndroid.SHORT)
        return
      }
    }

    if (
      checked === "R" &&
      (cashAmount === undefined || finalCashAmount > 0)
    ) {
      ToastAndroid.show("Add valid cash amount.", ToastAndroid.SHORT)
      return
    }

    if (checked === "R" && finalCashAmount === 0) {
      ToastAndroid.show("Changing Payment mode to Cash...", ToastAndroid.SHORT)
      setChecked(() => "C")
      return
    }

    if (checked === "R" && customerMobileNumber.length < 10) {
      ToastAndroid.show("Valid Mobile Number is mandatory for Credit Mode.", ToastAndroid.SHORT)
      return
    }

    // if (customerMobileNumber.length === 0) {
    //   ToastAndroid.show("Customer mobile is mandatory.", ToastAndroid.SHORT)
    //   return
    // }

    setIsDisabled(true)
    setIsLoading(true)
    await handleSendSaleData()
    console.log("Sending data and printing receipts...")


    const receiptFunction =
      receiptSettings?.gst_flag === "N" ? printReceiptWithoutGst : printReceipt

    if (printFlag) {
      if (receiptSettings?.rcpt_type !== "S") {
        receiptFunction(
          params?.added_products,
          params?.net_total,
          //@ts-ignore
          // parseFloat(params?.total_discount),
          receiptSettings?.discount_position !== "B"
            //@ts-ignore
            ? parseFloat(params?.total_discount)
            : receiptSettings?.discount_type === "A"
              //@ts-ignore
              ? parseFloat(discountBillwise)
              //@ts-ignore
              : parseFloat((params?.net_total * discountBillwise) / 100),
          cashAmount,
          finalCashAmount,
          customerName,
          customerMobileNumber,
          receiptSettings?.custom_sl_flag == 'N' ? receiptNumber : rcpt_sl_no,
          checked,
          kotNumber,
          params?.table_no
        )

        console.log(
          "=================+++++++++++++++++++ params?.added_products",
          params?.added_products,
        )
        console.log(
          "=================+++++++++++++++++++ params?.net_total",
          params?.net_total,
        )
        console.log(
          "=================+++++++++++++++++++ parseFloat(params?.total_discount)",
          //@ts-ignore
          parseFloat(params?.total_discount),
        )
        console.log("=================+++++++++++++++++++ cashAmount", cashAmount)
        console.log(
          "=================+++++++++++++++++++ finalCashAmount",
          finalCashAmount,
        )
        console.log(
          "=================+++++++++++++++++++ customerName",
          customerName,
        )
        console.log(
          "=================+++++++++++++++++++ customerMobileNumber",
          customerMobileNumber,
        )
        console.log(
          "=================+++++++++++++++++++ receiptNumber",
          receiptNumber,
        )
        console.log("=================+++++++++++++++++++ checked", checked)
      }
    }



    itemsContextStorage.clearAll()

    setIsLoading(false)
    setIsDisabled(false)
  }

  return (
    // <SafeAreaView>
    //   <ScrollView keyboardShouldPersistTaps="handled">
    //     <View
    //       style={{
    //         backgroundColor: theme.colors.background,
    //         minHeight: SCREEN_HEIGHT,
    //         height: "auto",
    //       }}>
    //       <View style={{ alignItems: "center" }}>
    //         <HeaderImage
    //           imgLight={productHeader}
    //           imgDark={productHeaderDark}
    //           borderRadius={30}
    //           blur={10}
    //           isBackEnabled>
    //           {receiptSettings?.cust_inf === "Y"
    //             ? "Customer Details & Print"
    //             : "Print"}
    //         </HeaderImage>
    //       </View>

    //       <View style={{
    //         backgroundColor: '#008181',
    //         borderRadius: 4,
    //         width: SCREEN_WIDTH / 1.15,
    //         alignSelf: "center",
    //         marginTop: normalize(-8),
    //         height: "auto",
    //         paddingVertical: normalize(15)
    //       }}>
    //         {receiptSettings?.discount_flag === "Y" && receiptSettings?.discount_position === "B" && (
    //           <View
    //             style={{
    //               paddingHorizontal: SCREEN_WIDTH / 20,
    //             }}>
    //             <InputPaper
    //               selectTextOnFocus
    //               label={
    //                 receiptSettings?.discount_type === "A"
    //                   ? "Discount (₹)"
    //                   : "Discount (%)"
    //               }
    //               onChangeText={handleDiscountBillwise}
    //               value={discountBillwise}
    //               keyboardType="numeric"
    //               mode="flat"
    //             />
    //           </View>
    //         )}
    //         <NetTotalButton
    //           width={290}
    //           disabled
    //           backgroundColor={'#008181'}
    //           textColor={theme.colors.surfaceVariant}
    //           addedProductsList={params?.added_products}
    //           netTotal={params?.net_total}
    //           totalDiscount={
    //             receiptSettings?.discount_position !== "B"
    //               ? params?.total_discount
    //               : receiptSettings?.discount_type === "A"
    //                 ? discountBillwise
    //                 : (params?.net_total * discountBillwise) / 100
    //           }
    //         />
    //       </View>

    //       <View
    //         style={{
    //           backgroundColor: '#fbf1cb',
    //           borderRadius: 4,
    //           width: SCREEN_WIDTH / 1.15,
    //           alignSelf: "center",
    //           marginTop: normalize(10),
    //         }}>
    //         <View style={{ justifyContent: "center" }}>
    //           <View
    //             style={{
    //               paddingHorizontal: normalize(20),
    //               paddingVertical: normalize(5),
    //               marginVertical: SCREEN_HEIGHT / 100,
    //               gap: 2
    //             }}>
    //                {receiptSettings?.cust_inf === "Y" && (
    //             <InputPaper
    //               label="Enter Mobile"
    //               value={customerMobileNumber}
    //               onChangeText={onChangeCustomerMobileNumber}
    //               keyboardType="number-pad"
    //               leftIcon="card-account-phone-outline"
    //               maxLength={10}
    //               customStyle={{backgroundColor:'white', marginBottom: normalize(12) }}
    //             />)}
    //             {receiptSettings?.cust_inf === "Y" && (
    //               <InputPaper
    //                 selectTextOnFocus
    //                 label="Enter Name (Optional)"
    //                 value={customerName}
    //                 onChangeText={(customerName: string) =>
    //                   setCustomerName(customerName)
    //                 }
    //                 keyboardType="default"
    //                 leftIcon="account-circle-outline"
    //                 maxLength={18}
    //                 customStyle={{ marginBottom: normalize(2),backgroundColor:'white' }}
    //               />
    //             )}
    //           </View>
    //         </View>

    //         {receiptSettings?.pay_mode === "Y" && (
    //           <View
    //             style={{
    //               flexDirection: "row",
    //               justifyContent: "space-between",
    //               alignItems: "center",
    //               backgroundColor:'white',
    //               borderRadius:10,
    //               padding:20,
    //               // marginRight: normalize(18),
    //               // marginLeft: normalize(4),
    //               marginVertical: normalize(5),
    //               marginHorizontal: normalize(25),
    //               flexWrap: "wrap"
    //             }}>
    //             <View style={styles.eachRadioBtn}>
    //               <RadioButton
    //                 value="C"
    //                 status={checked === "C" ? "checked" : "unchecked"}
    //                 color={'#008181'}
    //                 onPress={() => setChecked("C")}

    //               />
    //               <Text
    //                 variant="labelLarge"
    //                 style={
    //                   checked === "C" && {
    //                     color: '#008181',
    //                   }
    //                 }>
    //                 Cash
    //               </Text>
    //             </View>
    //             {/* <View style={styles.eachRadioBtn}>
    //               <RadioButton
    //                 value="D"
    //                 status={checked === "D" ? "checked" : "unchecked"}
    //                 color={'#008181'}
    //                 onPress={() => setChecked("D")}
    //               />
    //               <Text
    //                 variant="labelLarge"
    //                 style={
    //                   checked === "D" && {
    //                     color: '#008181',
    //                   }
    //                 }>
    //                 Card
    //               </Text>
    //             </View> */}

    //             <View style={styles.eachRadioBtn}>
    //               <RadioButton
    //                 value="U"
    //                 status={checked === "U" ? "checked" : "unchecked"}
    //                 color={'#008181'}
    //                 onPress={() => setChecked("U")}
    //               />
    //               <Text
    //                 variant="labelLarge"
    //                 style={
    //                   checked === "U" && {
    //                     color: '#008181',
    //                   }
    //                 }>
    //                 UPI
    //               </Text>
    //             </View>

    //             <View style={styles.eachRadioBtn}>
    //               <RadioButton
    //                 value="R"
    //                 status={checked === "R" ? "checked" : "unchecked"}
    //                 color={'#008181'}
    //                 onPress={() => setChecked("R")}
    //               />
    //               <Text
    //                 variant="labelLarge"
    //                 style={
    //                   checked === "R" && {
    //                     color: '#008181',
    //                   }
    //                 }>
    //                 Credit
    //               </Text>
    //             </View>

    //             {/* <List.Item
    //               style={{ width: "100%" }}
    //               title="Payment Mode"
    //               description={
    //                 checked === "C"
    //                   ? "Cash"
    //                   : checked === "D"
    //                     ? "Card"
    //                     : checked === "U"
    //                       ? "UPI"
    //                       : checked === "R"
    //                         ? "Credit"
    //                         : "Error Occurred"
    //               }
    //               left={props => <List.Icon {...props} icon="contactless-payment-circle-outline" />}
    //               right={props => {
    //                 return <MenuPaperWithoutRestriction menuArrOfObjects={paymentModeOptionsArr} customStyle={{ backgroundColor: theme.colors.surface }} textColor={theme.colors.onSurface} />
    //               }}
    //               descriptionStyle={{
    //                 color: theme.colors.purple,
    //               }}
    //             /> */}
    //           </View>
    //         )}

    //         <View style={{ paddingVertical: normalize(10) }}></View>

    //         {checked === "C" && (
    //           <View>
    //             <View style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(12) }}>
    //               <InputPaper
    //                 selectTextOnFocus
    //                 label="Received"
    //                 value={
    //                   receiptSettings?.rcv_cash_flag === "N"
    //                     ? Math.abs(finalCashAmount)
    //                     : cashAmount
    //                 }
    //                 onChangeText={(cash: number) => setCashAmount(cash)}
    //                 keyboardType="number-pad"
    //                 leftIcon="cash-multiple"
    //                 maxLength={8}
    //                 customStyle={{ marginBottom: normalize(10), backgroundColor: 'white'}}
    //                 disabled={receiptSettings?.rcv_cash_flag === "N"}
    //               />
    //             </View>
    //             {
    //               receiptSettings?.rcv_cash_flag === "Y" &&
    //               <SquircleBox
    //                 backgroundColor={'#ffcd04'}
    //                 textColor={'white'}
    //                 height={SCREEN_HEIGHT / 15}>
    //                Returned Amount: ₹{finalCashAmount}
    //               </SquircleBox>
    //             }
    //           </View>
    //         )}

    //         {checked === "R" && (
    //           <View>
    //             <View style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(12) }}>
    //               <InputPaper
    //                 selectTextOnFocus
    //                 label="Received Amount"
    //                 value={cashAmount}
    //                 onChangeText={(cash: number) => setCashAmount(cash)}
    //                 keyboardType="number-pad"
    //                 leftIcon="cash-multiple"
    //                 maxLength={8}
    //                 customStyle={{ marginBottom: normalize(10) }}
    //               />
    //             </View>
    //             <SquircleBox
    //               backgroundColor={theme.colors.surface}
    //               textColor={theme.colors.onSurface}
    //               height={SCREEN_HEIGHT / 15}>
    //               Due Amount: ₹{Math.abs(finalCashAmount)}
    //             </SquircleBox>
    //           </View>
    //         )}

    //         {
    //           checked === "U" && upiData !== undefined && (
    //             <View>
    //               <View style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(12), alignSelf: "center" }}>
    //                 {
    //                   receiptSettings?.gst_flag === "Y"
    //                     ? <QRCode
    //                       size={150}
    //                       value={`${upiData}&am=${receiptSettings?.gst_type === "E"
    //                         ? grandTotalWithGSTCalculate(
    //                           params?.net_total,
    //                           receiptSettings?.discount_position !== "B"
    //                             ? params?.total_discount
    //                             : receiptSettings?.discount_type === "A"
    //                               ? discountBillwise
    //                               : (params?.net_total * discountBillwise) / 100,
    //                           totalGST,
    //                         )
    //                         : grandTotalWithGSTInclCalculate(
    //                           params?.net_total,
    //                           receiptSettings?.discount_position !== "B"
    //                             ? params?.total_discount
    //                             : receiptSettings?.discount_type === "A"
    //                               ? discountBillwise
    //                               : (params?.net_total * discountBillwise) / 100,
    //                         )
    //                         }`}
    //                       color={theme.colors.onBackground}
    //                       backgroundColor={theme.colors.surfaceVariant}
    //                     />
    //                     : <QRCode
    //                       size={150}
    //                       value={`${upiData}&am=${grandTotalCalculate(
    //                         params?.net_total,
    //                         receiptSettings?.discount_position !== "B"
    //                           ? params?.total_discount
    //                           : receiptSettings?.discount_type === "A"
    //                             ? discountBillwise
    //                             : (params?.net_total * discountBillwise) / 100,
    //                       )}`}
    //                       color={theme.colors.onBackground}
    //                       backgroundColor={theme.colors.surfaceVariant}
    //                     />
    //                 }

    //               </View>
    //             </View>
    //           )
    //         }

    //         <View style={{ padding: normalize(20), flexDirection: "row", gap: 10, alignSelf: "center" }}>
    //           <ButtonPaper
    //             mode="contained"
    //             buttonColor={'#008181'}
    //             textColor={theme.colors.onPrimary}
    //             onPress={() => handlePrintReceipt(true)}
    //             icon="cloud-print-outline"
    //             loading={isLoading}
    //             disabled={isDisabled}>
    //             Save
    //           </ButtonPaper>
    //           {/* <ButtonPaper
    //             mode="contained"
    //             buttonColor={'white'}
    //             textColor={'#008181'}
    //             onPress={() => handlePrintReceipt()}
    //             icon="content-save-outline"
    //             loading={isLoading}
    //             disabled={isDisabled}>
    //             Save
    //           </ButtonPaper> */}
    //         </View>
    //       </View>
    //     </View>
    //   </ScrollView>
    // </SafeAreaView>
    <SafeAreaView style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#000000' : 'white' }}>
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
        <View style={{ alignItems: "center" }}>
          <HeaderImage
            imgLight={productHeader}
            imgDark={productHeaderDark}
            borderRadius={30}
            blur={10}
            isBackEnabled>
            {receiptSettings?.cust_inf === "Y"
              ? "Customer Details & Print"
              : "Print"}
          </HeaderImage>
        </View>

        {/* <View style={{
      backgroundColor: colorScheme === 'dark' ? '#009689' : '#008181',
      borderRadius: 8,
      padding: 16,
      marginVertical: 12,
      elevation: 2,
      shadowColor: '#008181',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }}>
      <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Net Total: ₹{params?.net_total}</Text>
    </View> */}
        {receiptSettings?.discount_flag === "Y" && receiptSettings?.discount_position === "B" && <View style={{
          backgroundColor: '#008181',
          borderRadius: 4,
          width: SCREEN_WIDTH / 1.15,
          alignSelf: "center",
          marginTop: normalize(-8),
          height: "auto",
          paddingVertical: normalize(15)
        }}>
          {receiptSettings?.discount_flag === "Y" && receiptSettings?.discount_position === "B" && (
            <View
              style={{
                paddingHorizontal: SCREEN_WIDTH / 20,
              }}>
              <InputPaper
                selectTextOnFocus
                // backgroundColor= '#008181'
                label={
                  receiptSettings?.discount_type === "A"
                    ? "Discount (₹)"
                    : "Discount (%)"
                }
                onChangeText={handleDiscountBillwise}
                value={discountBillwise}
                keyboardType="numeric"
                mode="flat"
              />
            </View>
          )}

        </View>}
        <NetTotalButton
          width={SCREEN_WIDTH / 1.25}
          disabled
          backgroundColor={'#008181'}
          textColor={theme.colors.surfaceVariant}
          addedProductsList={params?.added_products}
          netTotal={params?.net_total}
          totalDiscount={
            receiptSettings?.discount_position !== "B"
              ? params?.total_discount
              : receiptSettings?.discount_type === "A"
                ? discountBillwise
                : (params?.net_total * discountBillwise) / 100
          }
        />
        <View style={{
          backgroundColor: colorScheme === 'dark' ? '#2e2929ff' : '#f5f9ff',
          borderRadius: 8,
          padding: 16,
          marginVertical: 12,
          borderWidth: 1,
          borderColor: colorScheme === 'dark' ? '#2e2929ff' : '#ececf0ff',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 1,
        }}>
          {receiptSettings?.cust_inf === "Y" || checked == "R" && (<View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colorScheme === 'dark' ? '#009689' : '#008181', marginBottom: 12 }}>Customer Information</Text>
            <InputPaper
              label="Enter Mobile"
              value={customerMobileNumber}
              onChangeText={onChangeCustomerMobileNumber}
              keyboardType="number-pad"
              customStyle={{ backgroundColor: colorScheme === 'dark' ? '#2e2929ff' : '#f5f9ff', borderRadius: 8, marginBottom: 12 }}
            />
            <InputPaper
              label="Enter Name (Optional)"
              value={customerName}
              onChangeText={(name: any) => setCustomerName(name)}
              keyboardType="default"
              customStyle={{ backgroundColor: colorScheme === 'dark' ? '#2e2929ff' : '#f5f9ff', borderRadius: 8 }}
            />
          </View>)}

          <View style={{ marginVertical: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colorScheme === 'dark' ? '#009689' : '#008181', marginBottom: 12 }}>Payment Mode</Text>
            <View style={{
              flexDirection: "row",
              justifyContent: "space-around",
              alignItems: "center",
              backgroundColor: colorScheme === 'dark' ? 'black' : '#f5f9ff',
              borderRadius: 10,
              padding: 12,
              marginVertical: 8,
            }}>
              <View style={{ alignItems: "center" }}>
                <RadioButton value="C" status={checked === "C" ? "checked" : "unchecked"} color={colorScheme === 'dark' ? '#009689' : '#008181'} onPress={() => setChecked("C")} />
                <Text style={{ color: colorScheme === 'dark' ? '#009689' : '#008181' }}>Cash</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <RadioButton value="U" status={checked === "U" ? "checked" : "unchecked"} color={colorScheme === 'dark' ? '#009689' : '#008181'} onPress={() => setChecked("U")} />
                <Text style={{ color: colorScheme === 'dark' ? '#009689' : '#008181' }}>UPI</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <RadioButton value="R" status={checked === "R" ? "checked" : "unchecked"} color={colorScheme === 'dark' ? '#009689' : '#008181'} onPress={() => setChecked("R")} />
                <Text style={{ color: colorScheme === 'dark' ? '#009689' : '#008181' }}>Credit</Text>
              </View>
            </View>
          </View>

          {checked === "C" && (
            <View style={{ marginVertical: 12 }}>
              <InputPaper
                label="Received"
                value={cashAmount}
                onChangeText={(cash: any) => setCashAmount(cash)}
                keyboardType="number-pad"
                customStyle={{ backgroundColor: colorScheme === 'dark' ? '#2e2929ff' : '#f5f9ff', borderRadius: 8 }}
              />
              <View style={{
                backgroundColor: '#FFCD04',
                borderRadius: 8,
                padding: 12,
                marginVertical: 8,
                alignItems: "center",
              }}>
                <Text style={{ color: 'white', fontWeight: '600' }}>Returned Amount: ₹{finalCashAmount}</Text>
              </View>
            </View>
          )}

          {checked === "R" && (
            <View style={{ marginVertical: 12 }}>
              <InputPaper
                label="Received Amount"
                value={cashAmount}
                onChangeText={(cash: any) => setCashAmount(cash)}
                keyboardType="number-pad"
                customStyle={{ backgroundColor: colorScheme === 'dark' ? '#2e2929ff' : '#f5f9ff', borderRadius: 8 }}
              />
              <View style={{
                backgroundColor: '#FFCD04',
                borderRadius: 8,
                padding: 12,
                marginVertical: 8,
                alignItems: "center",
                borderWidth: 0,
                borderColor: '#FFCD04',
              }}>
                <Text style={{ color: colorScheme === 'dark' ? '#2e2929ff' : '#f5f9ff', fontWeight: '600' }}>Due Amount: ₹{Math.abs(finalCashAmount)}</Text>
              </View>
            </View>
          )}

          {checked === "U" && upiData && (
            <View style={{ alignItems: "center", marginVertical: 16 }}>
              <QRCode
                size={150}
                value={`${upiData}&am=${params?.net_total}`}
                color={colorScheme === 'dark' ? '#009689' : '#008181'}
                backgroundColor={colorScheme === 'dark' ? '#2e2929ff' : '#f5f9ff'}
              />
            </View>
          )}

          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 16 }}>
            <ButtonPaper
              mode="contained"
              buttonColor={colorScheme === 'dark' ? '#009689' : '#008181'}
              disabled={isDisabled}
              loading={isLoading}
              textColor="white"
              onPress={() => handlePrintReceipt(true)}
              icon="cloud-print-outline"
              style={{ borderRadius: 8 }}
            >
              Save
            </ButtonPaper>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>


  )
}

export default CustomerDetailsFillScreen

const styles = StyleSheet.create({
  eachRadioBtn: {
    justifyContent: "center",
    alignItems: "center",
    // color:'white'
  }
})
