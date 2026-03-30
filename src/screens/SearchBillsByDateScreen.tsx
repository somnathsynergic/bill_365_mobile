import React, { useContext, useEffect, useState } from "react"
import {
  StyleSheet,
  ScrollView,
  SafeAreaView,
  View,
  ToastAndroid,
  useColorScheme,
} from "react-native"
import { Card, List, Text } from "react-native-paper"
import HeaderImage from "../components/HeaderImage"
import {
  textureBill,
  textureBillDark,
  textureReport,
  textureReportDark,
} from "../resources/images"
import { usePaperColorScheme } from "../theme/theme"
import { useNavigation } from "@react-navigation/native"
import DialogBox from "../components/DialogBox"
import AddedProductList from "../components/AddedProductList"
import ScrollableListContainer from "../components/ScrollableListContainer"
import ButtonPaper from "../components/ButtonPaper"
import DatePicker from "react-native-date-picker"
import normalize from "react-native-normalize"
import useSearchBills from "../hooks/api/useSearchBills"
import { loginStorage } from "../storage/appStorage"
import { SearchedBills, ShowBillData } from "../models/api_types"
import { formattedDate } from "../utils/dateFormatter"
import useShowBill from "../hooks/api/useShowBill"
import { useBluetoothPrint } from "../hooks/printables/useBluetoothPrint"
import { AppStore } from "../context/AppContext"
import NetTotalForRePrints from "../components/NetTotalForRePrints"
import { Alert } from "react-native"
// import useCancelBill from "../hooks/api/useCancelBill"
import useCalculations from "../hooks/useCalculations"
import DialogBoxForReprint from "../components/DialogBoxForReprint"
import { AppStoreContext } from "../models/custom_types"
import useCancelBill from "../hooks/api/useCancelBill"
import SurfacePaper from "../components/SurfacePaper"

function SearchBillsByDateScreen() {
  const theme = usePaperColorScheme()
  const navigation = useNavigation()
  const colorScheme = useColorScheme()
  const loginStore = JSON.parse(loginStorage.getString("login-data"))

  const { receiptSettings } = useContext<AppStoreContext>(AppStore)

  const [visible, setVisible] = useState(() => false)
  const hideDialog = () => setVisible(() => false)

  const [fromDate, setFromDate] = useState(() => new Date())
  const [toDate, setToDate] = useState(() => new Date())
  const [openFromDate, setOpenFromDate] = useState(() => false)
  const [openToDate, setOpenToDate] = useState(() => false)
  const [currentReceiptNo, setCurrentReceiptNo] = useState<number | undefined>(
    () => undefined,
  )
  const [cancelledBillStatus, setCancelledBillStatus] = useState<"Y" | "N">()
  const [gstFlag, setGstFlag] = useState<"Y" | "N">()
  const [gstType, setGstType] = useState<"I" | "E">()
  const [discountType, setDiscountType] = useState<"P" | "A">()

  const formattedFromDate = formattedDate(fromDate)
  const formattedToDate = formattedDate(toDate)

  const [isLoading, setIsLoading] = useState(() => false)
  const [isDisabled, setIsDisabled] = useState(() => false)

  const [billsArray, setBillsArray] = useState<SearchedBills[]>(() => [])
  const [billedSaleData, setBilledSaleData] = useState<ShowBillData[]>(() => [])

  const { fetchSearchedBills } = useSearchBills()
  const { fetchBill } = useShowBill()
  const { cancelBill } = useCancelBill()
  const {
    grandTotalCalculate,
    grandTotalWithGSTCalculate,
    grandTotalWithGSTInclCalculate,
  } = useCalculations()

  const { rePrint, rePrintWithoutGst } = useBluetoothPrint()

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

  useEffect(() => {
    if (receiptSettings) {
      // setGstFlag(receiptSettings.gst_flag)
      console.log(receiptSettings, 'ffff')
    }
  }, [receiptSettings])

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
            grandTotalCalculate(netTotal, totalDiscount)
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
                  netTotal,
                  totalDiscount,
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

  const handleGetBillsByDate = async (fromDate: string, toDate: string) => {
    if (fromDate <= toDate) {
      setIsDisabled(true)
      setIsLoading(true)
      let billResponseData = await fetchSearchedBills(
        fromDate,
        toDate,
        loginStore.comp_id,
        loginStore.br_id,
        loginStore.user_id,
      )
      console.log("$$$$$$$$$########", billResponseData)
      if (!billResponseData?.data || billResponseData?.data.length === 0) {
        ToastAndroid.show("No result!", ToastAndroid.SHORT)
        setBillsArray([]) // Clear previous results if any


      }
      // console.log("$$$$$$$$$######## loginStore.comp_id", loginStore.comp_id)
      // console.log("$$$$$$$$$######## loginStore.br_id", loginStore.br_id)
      // console.log("$$$$$$$$$######## loginStore.user_id", loginStore.user_id)
      setBillsArray(billResponseData?.data)
      setIsDisabled(false)
      setIsLoading(false)
    } else {
      ToastAndroid.show("From date should be less than or equal to To date", ToastAndroid.SHORT)
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
    Alert.alert(
      "Cancelling Bill",
      `Are you sure you want to cancel this bill?`,
      [
        { text: "BACK", onPress: () => null },
        { text: "CANCEL BILL", onPress: () => handleCancellingBill(rcptNo) },
      ],
      { cancelable: false },
    )
  }

  let netTotal = 0
  let totalDiscount = 0

  return (
    // <SafeAreaView
    //   style={[styles.container, { backgroundColor: theme.colors.background }]}>
    //   <ScrollView>
    //     <View style={{ alignItems: "center" }}>
    //       <HeaderImage
    //         imgLight={textureReport}
    //         imgDark={textureReportDark}
    //         borderRadius={30}
    //         blur={10}
    //         isBackEnabled>
    //         Search By Date
    //       </HeaderImage>
    //     </View>

    //     <View
    //       style={{
    //         padding: 10,
    //         flexDirection: "row",
    //         justifyContent: "space-around",
    //         alignItems: "center",
    //       }}>
    //       <ButtonPaper
    //         onPress={() => setOpenFromDate(true)}
    //         mode="text"
    //         textColor={theme.colors.vanilla}>
    //         FROM: {fromDate?.toLocaleDateString("en-GB")}
    //       </ButtonPaper>
    //       <ButtonPaper
    //         onPress={() => setOpenToDate(true)}
    //         mode="text"
    //         textColor={theme.colors.vanilla}>
    //         TO: {toDate?.toLocaleDateString("en-GB")}
    //       </ButtonPaper>

    //       <DatePicker
    //         modal
    //         mode="date"
    //         // minimumDate={toDate.setMonth(toDate.getMonth() - 1)}
    //         open={openFromDate}
    //         date={fromDate}
    //         onConfirm={date => {
    //           setOpenFromDate(false)
    //           setFromDate(date)
    //         }}
    //         onCancel={() => {
    //           setOpenFromDate(false)
    //         }}
    //       />
    //       <DatePicker
    //         modal
    //         mode="date"
    //         open={openToDate}
    //         date={toDate}
    //         onConfirm={date => {
    //           setOpenToDate(false)
    //           setToDate(date)
    //         }}
    //         onCancel={() => {
    //           setOpenToDate(false)
    //         }}
    //       />
    //     </View>

    //     <View
    //       style={{
    //         paddingHorizontal: normalize(20),
    //         paddingBottom: normalize(10),
    //       }}>
    //       <ButtonPaper
    //         onPress={() =>

    //           handleGetBillsByDate(formattedFromDate, formattedToDate)

    //         }
    //         mode="contained-tonal"
    //         buttonColor={theme.colors.vanillaTertiaryContainer}
    //         textColor={theme.colors.onVanillaTertiaryContainer}
    //         loading={isLoading}
    //         disabled={isDisabled}>
    //         SUBMIT
    //       </ButtonPaper>
    //     </View>

    //     <View style={{ width: "100%" }}>
    //       {billsArray?.map((item, i) => (
    //         <List.Item
    //           titleStyle={{
    //             color: theme.colors.vanilla,
    //           }}
    //           descriptionStyle={{
    //             color: theme.colors.vanillaSecondary,
    //           }}
    //           key={i}
    //           title={`Bill ${receiptSettings?.custom_sl_flag=='N'?item?.receipt_no:item?.rcpt_sl_no}`}
    //           description={`₹${item?.net_amt}`}
    //           onPress={() => handleBillListClick(item?.receipt_no)}
    //           left={props => <List.Icon {...props} icon="basket" />}
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

    //     onDialogFailure={onDialogFailure}
    //     onDialogSuccecss={onDialogSuccecss}
    //     netTotalButtonColors={[theme.colors.vanillaContainer, theme.colors.onVanillaContainer]}
    //   />
    // </SafeAreaView>
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
        <View style={{ alignItems: "center", marginBottom: normalize(20) }}>
          <HeaderImage
            imgLight={textureReport}
            imgDark={textureReportDark}
            borderRadius={30}
            blur={10}
            isBackEnabled
          >
            Search By Date
          </HeaderImage>
        </View>

        <View
          style={{
            padding: normalize(10),
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
            backgroundColor: colorScheme === "dark" ? "#2e2929ff" : "#f5f9ff",

            borderRadius: normalize(8),
            marginHorizontal: normalize(16),
            marginBottom: normalize(16),
            elevation: 1,
          }}
        >
          <ButtonPaper
            onPress={() => setOpenFromDate(true)}
            mode="text"
            textColor={colorScheme === "dark" ? "#009689" : "#008181"}

          >
            FROM: {fromDate?.toLocaleDateString("en-GB")}
          </ButtonPaper>
          <ButtonPaper
            onPress={() => setOpenToDate(true)}
            mode="text"
            textColor={colorScheme === "dark" ? "#009689" : "#008181"}

          >
            TO: {toDate?.toLocaleDateString("en-GB")}
          </ButtonPaper>
        </View>

        <DatePicker
          modal
          mode="date"
          open={openFromDate}
          date={fromDate}
          onConfirm={date => {
            setOpenFromDate(false);
            setFromDate(date);
          }}
          onCancel={() => setOpenFromDate(false)}
        />
        <DatePicker
          modal
          mode="date"
          open={openToDate}
          date={toDate}
          onConfirm={date => {
            setOpenToDate(false);
            setToDate(date);
          }}
          onCancel={() => setOpenToDate(false)}
        />

        <View style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(16) }}>
          <ButtonPaper
            onPress={() => handleGetBillsByDate(formattedFromDate, formattedToDate)}
            mode="contained-tonal"
            buttonColor={colorScheme === "dark" ? "#009689" : "#008181"}

            textColor="white"
            loading={isLoading}
            disabled={isDisabled}
            style={{ borderRadius: normalize(8) }}
          >
            SUBMIT
          </ButtonPaper>
        </View>

        <View
          // backgroundColor="#fff"
          style={styles.container1}
        >
          {billsArray?.map((item, i) => {
            const billNo = receiptSettings?.custom_sl_flag === 'N' ? item?.receipt_no : item?.rcpt_sl_no;
            return (
              <Card
                key={i}
                style={colorScheme === "dark" ? styles.cardDark : styles.card}

                onPress={() => handleBillListClick(item?.receipt_no)}
              >
                <List.Item
                  titleStyle={colorScheme === "dark" ? styles.title1Dark : styles.title1}
                  descriptionStyle={colorScheme === "dark" ? styles.descriptionDark : styles.description}
                  title={`Bill ${billNo}`}
                  description={`₹${item?.net_amt}`}
                  left={props => <List.Icon {...props} icon="receipt" color={colorScheme === "dark" ? "#009689" : "#008181"} />}
                />
              </Card>
            );
          })}
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
        onDialogFailure={onDialogFailure}
        onDialogSuccecss={onDialogSuccecss}
        netTotalButtonColors={[theme.colors.vanillaContainer, theme.colors.onVanillaContainer]}
      />
    </SafeAreaView>



  )
}

export default SearchBillsByDateScreen

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },

  title: {
    textAlign: "center",
  },
  card: {
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,          // for Android shadow
    shadowColor: '#000',   // for iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    backgroundColor: 'white',
  },
  cardDark: {
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,          // for Android shadow
    shadowColor: '#000',   // for iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    backgroundColor: '#2e2929ff',

  },
  title1: {
    color: '#008181',
    fontWeight: '800',
  },
  title1Dark: {
    color: '#009689',
    fontWeight: '800',
  },
  description: {
    color: '#97979eff',
  },
  descriptionDark: {
    color: '#ffffff',
  },
  container1: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
})
