import React, { useContext, useState, useEffect } from "react"
import {
  StyleSheet,
  ScrollView,
  SafeAreaView,
  View,
  ToastAndroid,
  Alert,
  useColorScheme,
} from "react-native"
import { Card, List, RadioButton, Searchbar, Text } from "react-native-paper"
import HeaderImage from "../components/HeaderImage"
import {
  textureReport,
  textureReportDark,
} from "../resources/images"
import { usePaperColorScheme } from "../theme/theme"
import { useNavigation } from "@react-navigation/native"
import ButtonPaper from "../components/ButtonPaper"
import normalize from "react-native-normalize"
import useShowBill from "../hooks/api/useShowBill"
import {
  CommonSearchResponseData,
  SearchBillsByCustomerNameCredentials,
  SearchBillsByMobileCredentials,
  SearchBillsByReceiptCredentials,
  ShowBillData,
} from "../models/api_types"
import { loginStorage } from "../storage/appStorage"
import useSearchBillsByMobile from "../hooks/api/useSearchBillsByMobile"
import DialogBoxForReprint from "../components/DialogBoxForReprint"
import { useBluetoothPrint } from "../hooks/printables/useBluetoothPrint"
import useCalculations from "../hooks/useCalculations"
import useCancelBill from "../hooks/api/useCancelBill"
import useSearchBillsByReceipt from "../hooks/api/useSearchBillsByReceipt"
import useSearchBillsByCustomerName from "../hooks/api/useSearchBillsByCustomerName"
import { AppStoreContext } from "../models/custom_types"
import { AppStore } from "../context/AppContext"

function CancelBillsScreen() {
  const theme = usePaperColorScheme()
  const navigation = useNavigation()
  const colorScheme = useColorScheme()

  const loginStore = JSON.parse(loginStorage.getString("login-data") as string)

  const { rePrint, rePrintWithoutGst } = useBluetoothPrint()
  const {
    grandTotalCalculate,
    grandTotalWithGSTCalculate,
    grandTotalWithGSTInclCalculate,
  } = useCalculations()
  const { cancelBill } = useCancelBill()
  const { fetchBill } = useShowBill()
  const { fetchSearchedBills } = useSearchBillsByMobile()
  const { fetchSearchedBillsByReceipt } = useSearchBillsByReceipt()
  const { fetchSearchedBillsByCustomerName } = useSearchBillsByCustomerName()

  const [visible, setVisible] = useState(() => false)
  const hideDialog = () => setVisible(() => false)

  const [currentReceiptNo, setCurrentReceiptNo] = useState<number | undefined>(
    () => undefined,
  )
  const [cancelledBillStatus, setCancelledBillStatus] = useState<"Y" | "N">()
  const [gstFlag, setGstFlag] = useState<"Y" | "N">()
  const [gstType, setGstType] = useState<"I" | "E">()
  const [discountType, setDiscountType] = useState<"P" | "A">()

  const [billedSaleData, setBilledSaleData] = useState<ShowBillData[]>(() => [])
  const [fetchedBillsData, setFetchedBillsData] = useState(() => [])
  const { receiptSettings } = useContext<AppStoreContext>(AppStore)
  const [checked, setChecked] = useState<string>(() => "R")
  const [isLoading, setIsLoading] = useState(() => false)
  const [isDisabled, setIsDisabled] = useState(() => false)

  const [search, setSearch] = useState<string>(() => "")
  const onChangeSearch = (query: string) => {
    if (checked === "R" || checked === "M") {
      if (/^\d*$/.test(query)) {
        setSearch(query)
      }
    } else {
      setSearch(query)
    }
  }

  useEffect(() => {
    setSearch(() => "")
    setBilledSaleData(() => [])
    setFetchedBillsData(() => [])
  }, [checked])

  useEffect(() => {
  if(!search){
     setSearch(() => "")
    setBilledSaleData(() => [])
    setFetchedBillsData(() => [])
  }
  }, [search])

  const handleGetBillsByMobile = async (mobile: string) => {
    setIsDisabled(true)
    setIsLoading(true)
    const reqCreds: SearchBillsByMobileCredentials = {
      comp_id: loginStore?.comp_id,
      br_id: loginStore?.br_id,
      phone_no: mobile,
    }

    console.log(
      "comp_id br_id phone_no",
      loginStore?.comp_id,
      loginStore?.br_id,
      mobile,
    )

    await fetchSearchedBills(reqCreds)
      .then(res => {
        if (res?.data?.length === 0) {
          ToastAndroid.show("No bills found.", ToastAndroid.SHORT)
          setFetchedBillsData([])
          return
        }

        console.log("UUUUUUUUUUUUUUUUUUUUUU=================", res?.data)
        setFetchedBillsData(res?.data)
      })
      .catch(err => {
        ToastAndroid.show("Error during fetching bills...", ToastAndroid.SHORT)
        console.log("EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRR", err)
      })

    setIsDisabled(false)
    setIsLoading(false)
  }

  const handleGetBillsByReceipt = async (rcptNo: string) => {
    setIsDisabled(true)
    setIsLoading(true)
    const reqCreds: SearchBillsByReceiptCredentials = {
      comp_id: loginStore?.comp_id,
      br_id: loginStore?.br_id,
      receipt_no: parseInt(rcptNo)
    }

    console.log(
      "comp_id br_id receipt_no",
      loginStore?.comp_id,
      loginStore?.br_id,
      rcptNo,
    )

    await fetchSearchedBillsByReceipt(reqCreds)
      .then(res => {
        if (res?.data?.length === 0) {
          ToastAndroid.show("No bills found.", ToastAndroid.SHORT)
          setFetchedBillsData([])
          return
        }

        console.log("UUUUUUUUUUUUUUUUUUUUUU=================", res?.data)
        setFetchedBillsData(res?.data)
      })
      .catch(err => {
        ToastAndroid.show("Error during fetching bills...", ToastAndroid.SHORT)
        console.log("EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRR", err)
      })

    setIsDisabled(false)
    setIsLoading(false)
  }

  const handleGetBillsByCustomer = async (name: string) => {
    setIsDisabled(true)
    setIsLoading(true)
    const reqCreds: SearchBillsByCustomerNameCredentials = {
      comp_id: loginStore?.comp_id,
      br_id: loginStore?.br_id,
      cust_name: name
    }

    console.log(
      "comp_id br_id cust_name",
      loginStore?.comp_id,
      loginStore?.br_id,
      name,
    )

    await fetchSearchedBillsByCustomerName(reqCreds)
      .then(res => {
        if (res?.data?.length === 0) {
          ToastAndroid.show("No bills found.", ToastAndroid.SHORT)
          setFetchedBillsData([])
          return
        }

        console.log("UUUUUUUUUUUUUUUUUUUUUU=================", res?.data)
        setFetchedBillsData(res?.data)
      })
      .catch(err => {
        ToastAndroid.show("Error during fetching bills...", ToastAndroid.SHORT)
        console.log("EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRR", err)
      })

    setIsDisabled(false)
    setIsLoading(false)
  }

  const handleSearchClick = (query: string, checkedFlag: string) => {
    if (!search) {
      ToastAndroid.show("Enter valid text.", ToastAndroid.SHORT)
      return
    }

    // if (checked === "R" || checked === "M") {
    if (checked === "M") {
      if (search.length !== 10) {
        ToastAndroid.show("Enter valid number.", ToastAndroid.SHORT)
        return
      }
    }

    if (checkedFlag === "M") {
      handleGetBillsByMobile(query)
    } else if (checkedFlag === "R") {
      handleGetBillsByReceipt(query)
    } else {
      handleGetBillsByCustomer(query)
    }
  }

  const handleGetBill = async (rcptNo: number) => {
    await fetchBill(rcptNo)
      .then(res => {
        setBilledSaleData(res?.data)
        setCancelledBillStatus(res?.cancel_flag)
      })
      .catch(err => {
        ToastAndroid.show("Error during fetching bills.", ToastAndroid.SHORT)
      })
  }

  const handleBillListClick = (rcptNo: number) => {
    setVisible(!visible)
    handleGetBill(rcptNo)
    setCurrentReceiptNo(rcptNo)
    setGstFlag(billedSaleData[0]?.gst_flag)
    setGstType(billedSaleData[0]?.gst_type)
  }

  const onDialogFailure = () => {
    setVisible(!visible)
  }

  const onDialogSuccecss = () => {
    setVisible(!visible)
    // ToastAndroid.showWithGravityAndOffset(
    //   "Printing feature will be added in some days.",
    //   ToastAndroid.SHORT,
    //   ToastAndroid.CENTER,
    //   25,
    //   50,
    // )
    handleRePrintReceipt(false)
  }

  const handleRePrintReceipt = (cancelFlag: boolean) => {
    if (billedSaleData.length > 0) {
      gstFlag === "N"
        ? rePrintWithoutGst(
          billedSaleData,
          // netTotal,
          billedSaleData[0]?.tprice,
          // totalDiscount,
          billedSaleData[0]?.tdiscount_amt,
          billedSaleData[0]?.received_amt,
          billedSaleData[0]?.received_amt !== undefined
            ? billedSaleData[0]?.received_amt -
            grandTotalCalculate(billedSaleData[0]?.tprice, billedSaleData[0]?.tdiscount_amt)
            : 0,
          billedSaleData[0]?.cust_name,
          billedSaleData[0]?.phone_no,
          billedSaleData[0]?.receipt_no,
          billedSaleData[0]?.pay_mode,
          false,
          false,
          cancelFlag,
        )
        : gstType === "E"
          ? rePrint(
            billedSaleData,
            // netTotal,
            billedSaleData[0]?.tprice,
            // totalDiscount,
            billedSaleData[0]?.tdiscount_amt,
            billedSaleData[0]?.received_amt,
            billedSaleData[0]?.received_amt !== undefined
              ? billedSaleData[0]?.received_amt -
              parseFloat(
                grandTotalWithGSTCalculate(
                  billedSaleData[0]?.tprice,
                  billedSaleData[0]?.tdiscount_amt,
                  billedSaleData[0]?.tcgst_amt * 2,
                ),
              )
              : 0,
            billedSaleData[0]?.cust_name,
            billedSaleData[0]?.phone_no,
            billedSaleData[0]?.receipt_no,
            billedSaleData[0]?.pay_mode,
            false,
            false,
            cancelFlag,
          )
          : rePrint(
            billedSaleData,
            // netTotal,
            billedSaleData[0]?.tprice,
            // totalDiscount,
            billedSaleData[0]?.tdiscount_amt,
            billedSaleData[0]?.received_amt,
            billedSaleData[0]?.received_amt !== undefined
              ? billedSaleData[0]?.received_amt -
              parseFloat(
                grandTotalWithGSTInclCalculate(billedSaleData[0]?.tprice, billedSaleData[0]?.tdiscount_amt),
              )
              : 0,
            billedSaleData[0]?.cust_name,
            billedSaleData[0]?.phone_no,
            billedSaleData[0]?.receipt_no,
            billedSaleData[0]?.pay_mode,
            false,
            false,
            cancelFlag,
          )
    } else {
      ToastAndroid.show("Something went wrong!", ToastAndroid.SHORT)
      return
    }
  }

  const handleCancellingBill = async (rcptNo: number) => {
    await cancelBill(rcptNo, loginStore.user_id).then(res => {
      if (res?.status === 1) {
        ToastAndroid.show(res?.data, ToastAndroid.SHORT)
        handleRePrintReceipt(true)
        setVisible(!visible)
      }
    }).catch(err => {
      ToastAndroid.show(`Error occurred during cancelling bill. ${err}`, ToastAndroid.SHORT)
      setVisible(!visible)
    })
  }

  const handleCancelBill = (rcptNo: number) => {
    Alert.alert("Cancelling Bill", `Are you sure you want to cancel this bill?`, [
      { text: "BACK", onPress: () => ToastAndroid.show("Operation cancelled by user.", ToastAndroid.SHORT) },
      { text: "CANCEL BILL", onPress: () => handleCancellingBill(rcptNo) },
    ],
      { cancelable: false },
    )
  }

  let netTotal: number = 0
  let totalDiscount: number = 0

  return (
    // <SafeAreaView
    //   style={[styles.container, { backgroundColor: theme.colors.background }]}>
    //   <ScrollView keyboardShouldPersistTaps="handled">
    //     <View style={{ alignItems: "center" }}>
    //       <HeaderImage
    //         imgLight={textureReport}
    //         imgDark={textureReportDark}
    //         borderRadius={30}
    //         blur={10}
    //         isBackEnabled>
    //         Search By, <Text style={{
    //           textDecorationLine: "underline",
    //           textDecorationStyle: "dashed",
    //           textTransform: "uppercase",
    //         }}>{checked === "R" ? "Receipt" : checked === "M" ? "Mobile" : checked === "C" ? "Customer" : "UI Err"}</Text>
    //       </HeaderImage>
    //     </View>

    //     <View
    //       style={{
    //         paddingHorizontal: normalize(15),
    //         paddingBottom: normalize(10),
    //       }}>
    //       <View
    //         style={{
    //           flexDirection: "row",
    //           justifyContent: "space-between",
    //           alignItems: "center",
    //           // marginRight: normalize(18),
    //           // marginLeft: normalize(4),
    //           marginBottom: normalize(20),
    //           marginHorizontal: normalize(10),
    //           padding: normalize(10),
    //           flexWrap: "wrap",
    //           borderWidth: 3,
    //           borderStyle: "dashed",
    //           borderRadius: normalize(20),
    //           borderColor: theme.colors.vanillaSecondary
    //         }}>
    //         <View style={styles.eachRadioBtn}>
    //           <RadioButton
    //             value="R"
    //             status={checked === "R" ? "checked" : "unchecked"}
    //             color={theme.colors.vanilla}
    //             onPress={() => setChecked("R")}
    //           />
    //           <Text
    //             variant="labelLarge"
    //             style={
    //               checked === "R" && {
    //                 color: theme.colors.vanillaTertiary,
    //                 fontSize: 18,
    //               }
    //             }>
    //             Receipt
    //           </Text>
    //         </View>

    //         <View style={styles.eachRadioBtn}>
    //           <RadioButton
    //             value="M"
    //             status={checked === "M" ? "checked" : "unchecked"}
    //             color={theme.colors.vanilla}
    //             onPress={() => setChecked("M")}
    //           />
    //           <Text
    //             variant="labelLarge"
    //             style={
    //               checked === "M" && {
    //                 color: theme.colors.vanillaTertiary,
    //                 fontSize: 18
    //               }
    //             }>
    //             Mobile
    //           </Text>
    //         </View>

    //         <View style={styles.eachRadioBtn}>
    //           <RadioButton
    //             value="C"
    //             status={checked === "C" ? "checked" : "unchecked"}
    //             color={theme.colors.vanilla}
    //             onPress={() => setChecked("C")}
    //           />
    //           <Text
    //             variant="labelLarge"
    //             style={
    //               checked === "C" && {
    //                 color: theme.colors.vanillaTertiary,
    //                 fontSize: 18
    //               }
    //             }>
    //             Customer
    //           </Text>
    //         </View>
    //       </View>

    //       <View
    //         style={{
    //           paddingHorizontal: normalize(10),
    //           paddingBottom: normalize(10),
    //         }}>
    //         <Searchbar
    //           autoFocus
    //           // placeholder="Search Bills"
    //           placeholder={checked === "R" ? "Receipt Number" : checked === "M" ? "Mobile Number" : checked === "C" ? "Customer Name" : "UI Error"}
    //           onChangeText={onChangeSearch}
    //           value={search}
    //           elevation={search ? 2 : 0}
    //           keyboardType={checked === "R" ? "numeric" : checked === "M" ? "numeric" : "default"}
    //           maxLength={10}
    //           style={{
    //             backgroundColor: theme.colors.vanillaSecondaryContainer,
    //             color: theme.colors.onVanillaSecondaryContainer,
    //           }}
    //         // loading={search ? true : false}
    //         />
    //       </View>
    //       {/* <ButtonPaper onPress={() => handleGetBillsByDate(formattedFromDate, formattedToDate)} mode="contained-tonal">
    //                     SUBMIT
    //                 </ButtonPaper> */}
    //       <View
    //         style={{
    //           paddingHorizontal: normalize(10),
    //         }}>
    //         <ButtonPaper
    //           onPress={() => handleSearchClick(search, checked)}
    //           mode="contained-tonal"
    //           buttonColor={theme.colors.vanillaContainer}
    //           loading={isLoading}
    //           disabled={isDisabled}>
    //           SUBMIT
    //         </ButtonPaper>
    //       </View>
    //     </View>

    //     <View style={{ width: "100%" }}>
    //       {fetchedBillsData?.map((item, i) => (
    //         <List.Item
    //           titleStyle={{
    //             color: theme.colors.vanilla,
    //           }}
    //           descriptionStyle={{
    //             color: theme.colors.vanillaSecondary,
    //           }}
    //           key={i}
    //           title={`${item?.trn_date}`}
    //           description={`${receiptSettings?.custom_sl_flag=='N'?item?.receipt_no:item?.rcpt_sl_no} - ₹${item?.net_amt}`}
    //           onPress={() => handleBillListClick(item?.receipt_no)}
    //           left={props => <List.Icon {...props} icon="basket" />}
    //           right={props => (
    //             <Text
    //               variant="bodyMedium"
    //               {...props}
    //               style={{ color: theme.colors.vanillaTertiary }}>
    //               ₹{item?.net_amt}
    //             </Text>
    //           )}
    //         // right={props => (
    //         //   <List.Icon {...props} icon="download" />
    //         // )}
    //         />
    //       ))}
    //     </View>
    //   </ScrollView>



    //   <DialogBoxForReprint
    //     iconSize={30}
    //     visible={visible}
    //     hide={hideDialog}
    //     titleStyle={styles.title}

    //     currentReceiptNo={currentReceiptNo}
    //     billedSaleData={billedSaleData}
    //     handleCancelBill={handleCancelBill}
    //     cancelledBillStatus={cancelledBillStatus}
    //     netTotalButtonColors={[theme.colors.vanillaContainer, theme.colors.onVanillaContainer]}

    //     onDialogFailure={onDialogFailure}
    //     onDialogSuccecss={onDialogSuccecss}
    //   />



    // </SafeAreaView>
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
  <ScrollView keyboardShouldPersistTaps="handled">
    <View style={{ alignItems: "center" }}>
      <HeaderImage
        imgLight={textureReport}
        imgDark={textureReportDark}
        borderRadius={30}
        blur={10}
        isBackEnabled>
        Search By, <Text style={{
          textDecorationLine: "underline",
          textDecorationStyle: "dashed",
          textTransform: "uppercase",
        }}>{checked === "R" ? "Receipt" : checked === "M" ? "Mobile" : checked === "C" ? "Customer" : "UI Err"}</Text>
      </HeaderImage>
    </View>

    <View style={{ paddingHorizontal: normalize(15), paddingBottom: normalize(10) }}>
      {/* <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: normalize(20),
          marginHorizontal: normalize(10),
          padding: normalize(10),
          flexWrap: "wrap",
          borderWidth: 3,
          borderStyle: "dashed",
          borderRadius: normalize(20),
          borderColor: theme.colors.vanillaSecondary
        }}>
        <View style={styles.eachRadioBtn}>
          <RadioButton
            value="R"
            status={checked === "R" ? "checked" : "unchecked"}
            color={theme.colors.vanilla}
            onPress={() => setChecked("R")}
          />
          <Text
            variant="labelLarge"
            style={checked === "R" && {
              color: theme.colors.vanillaTertiary,
              fontSize: 18,
            }}>
            Receipt
          </Text>
        </View>

        <View style={styles.eachRadioBtn}>
          <RadioButton
            value="M"
            status={checked === "M" ? "checked" : "unchecked"}
            color={theme.colors.vanilla}
            onPress={() => setChecked("M")}
          />
          <Text
            variant="labelLarge"
            style={checked === "M" && {
              color: theme.colors.vanillaTertiary,
              fontSize: 18,
            }}>
            Mobile
          </Text>
        </View>

        <View style={styles.eachRadioBtn}>
          <RadioButton
            value="C"
            status={checked === "C" ? "checked" : "unchecked"}
            color={theme.colors.vanilla}
            onPress={() => setChecked("C")}
          />
          <Text
            variant="labelLarge"
            style={checked === "C" && {
              color: theme.colors.vanillaTertiary,
              fontSize: 18,
            }}>
            Customer
          </Text>
        </View>
      </View> */}
      <View
  style={{
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: normalize(20),
    marginHorizontal: normalize(10),
    padding: normalize(12),
    borderRadius: normalize(12),
                backgroundColor: colorScheme === "dark" ? "#2e2929ff" : "#f5f9ff",
    // backgroundColor: colorScheme === 'dark' ?theme.colors.surface,
    elevation: 1,
    shadowColor: theme.colors.vanilla,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  }}
>
  <View style={styles.eachRadioBtn}>
    <RadioButton
      value="R"
      status={checked === "R" ? "checked" : "unchecked"}
      color={colorScheme === 'dark' ? '#009689' : '#008181'}
      onPress={() => setChecked("R")}
    />
    <Text
      // variant="labelSmall"
      style={[
        styles.radioText,
        checked === "R" && { color: colorScheme === 'dark' ? '#009689' : '#008181', fontWeight: '600' },
      ]}
    >
      Receipt
    </Text>
  </View>

  <View style={styles.eachRadioBtn}>
    <RadioButton
      value="M"
      status={checked === "M" ? "checked" : "unchecked"}
      color={colorScheme === 'dark' ? '#009689' : '#008181'}
      onPress={() => setChecked("M")}
    />
    <Text
      // variant="labelLarge"
      style={[
        styles.radioText,
        checked === "M" && { color: colorScheme === 'dark' ? '#009689' : '#008181', fontWeight: '600' },
      ]}
    >
      Mobile
    </Text>
  </View>

  <View style={styles.eachRadioBtn}>
    <RadioButton
      value="C"
      status={checked === "C" ? "checked" : "unchecked"}
      color={colorScheme === 'dark' ? '#009689' : '#008181'}
      onPress={() => setChecked("C")}
    />
    <Text
      // variant="labelLarge"
      style={[
        styles.radioText,
        checked === "C" && { color: colorScheme === 'dark' ? '#009689' : '#008181', fontWeight: '600' },
      ]}
    >
      Customer
    </Text>
  </View>
</View>


      <View style={{ paddingHorizontal: normalize(10), paddingBottom: normalize(10) }}>
        <Searchbar
          autoFocus
          placeholder={checked === "R" ? "Receipt Number" : checked === "M" ? "Mobile Number" : checked === "C" ? "Customer Name" : "UI Error"}
          onChangeText={onChangeSearch}
          value={search}
          elevation={search ? 2 : 0}
          keyboardType={checked === "R" ? "numeric" : checked === "M" ? "numeric" : "default"}
          maxLength={10}
          style={{
            backgroundColor: colorScheme === 'dark' ? '#2e2929ff' : 'def0ddff',
            color: theme.colors.onVanillaSecondaryContainer,
            borderRadius: normalize(8),
            // borderWidth: 1,
            borderColor: theme.colors.vanillaSecondary,
          }}
        />
      </View>

      <View style={{ paddingHorizontal: normalize(10) }}>
        <ButtonPaper
          onPress={() => handleSearchClick(search, checked)}
          mode="contained-tonal"
          buttonColor={colorScheme === 'dark' ? '#009689' : '#008181'}
          textColor={'white'}
          loading={isLoading}
          disabled={isDisabled}
          style={{ borderRadius: normalize(8) }}
        >
          SUBMIT
        </ButtonPaper>
      </View>
    </View>

    <View style={styles.container1}>
      {fetchedBillsData?.map((item, i) => (
        <Card
          key={i}
          style={colorScheme === 'dark' ? styles.cardDark : styles.card}
          onPress={() => handleBillListClick(item?.receipt_no)}
        >
          <List.Item
           titleStyle={colorScheme === 'dark' ? styles.titleDark : styles.title1}
                    descriptionStyle={styles.description}
            title={`${item?.trn_date}`}
            description={`${receiptSettings?.custom_sl_flag=='N'?item?.receipt_no:item?.rcpt_sl_no} - ₹${item?.net_amt}`}
                                left={props => <List.Icon {...props} icon="receipt" color={colorScheme=== 'dark' ? '#009689' :"#008181"} />}
            
            // right={props => (
            //   <Text
            //     variant="bodyMedium"
            //     {...props}
            //     style={{ color: theme.colors.vanillaTertiary }}>
            //     ₹{item?.net_amt}
            //   </Text>
            // )}
          />
        </Card>
      ))}
    </View>
  </ScrollView>

  <DialogBoxForReprint
    iconSize={30}
    visible={visible}
    hide={hideDialog}
    titleStyle={styles.title}
    currentReceiptNo={currentReceiptNo}
    billedSaleData={billedSaleData}
    handleCancelBill={handleCancelBill}
    cancelledBillStatus={cancelledBillStatus}
    netTotalButtonColors={[theme.colors.vanillaContainer, theme.colors.onVanillaContainer]}
    onDialogFailure={onDialogFailure}
    onDialogSuccecss={onDialogSuccecss}
  />
</SafeAreaView>

  )
}

export default CancelBillsScreen

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },

  title: {
    textAlign: "center",
  },

  eachRadioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: normalize(6),
    color:'#008181'
  },
    eachRadioBtnDark: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: normalize(6),
    color:'#009689'
  },
  radioText: {
    marginLeft: normalize(6),
    fontSize: 14,
    color: '#008181',
  },
  container1: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
   card: {
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,          // for Android shadow
       // for iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    backgroundColor: 'white',
  },
  cardDark:{
     marginBottom: 8,
    borderRadius: 8,
    elevation: 2,          // for Android shadow
       // for iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
                    backgroundColor:  "#2e2929ff",

  },
  title1: {
    color: '#008181',
    fontWeight: '800',
  },
  description: {
    color: '#97979eff',
  },
  titleDark:{
    color: '#009689',
    fontWeight: '800',
  
  },
  descriptionDark:{
    color: '#fff0f0ff',
  },
})
