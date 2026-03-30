import {
    StyleSheet,
    ScrollView,
    SafeAreaView,
    View,
    ToastAndroid,
    useColorScheme,
} from "react-native"

import HeaderImage from "../components/HeaderImage"
import { blurReport, blurReportDark } from "../resources/images"
import { usePaperColorScheme } from "../theme/theme"
import { DataTable, Text } from "react-native-paper"
import useSaleReport from "../hooks/api/useSaleReport"
import DatePicker from "react-native-date-picker"
import ButtonPaper from "../components/ButtonPaper"
import { useContext, useState } from "react"
import normalize from "react-native-normalize"
import { formattedDate } from "../utils/dateFormatter"
import { loginStorage } from "../storage/appStorage"
import { CreditReportResponseData, SaleReport } from "../models/api_types"
import SurfacePaper from "../components/SurfacePaper"
import { useBluetoothPrint } from "../hooks/printables/useBluetoothPrint"
import { AppStore } from "../context/AppContext"
import useCreditReport from "../hooks/api/useCreditReport"
import { AppStoreContext } from "../models/custom_types"

function CreditReportScreen() {
    const theme = usePaperColorScheme()
    const colorScheme = useColorScheme()
    const loginStore = JSON.parse(loginStorage.getString("login-data"))

    const { receiptSettings } = useContext<AppStoreContext>(AppStore)

    const { fetchCreditReport } = useCreditReport()
    const { printCreditReport } = useBluetoothPrint()

    const [creditReport, setCreditReport] = useState<CreditReportResponseData[]>(() => [])

    const [fromDate, setFromDate] = useState(() => new Date())
    const [toDate, setToDate] = useState(() => new Date())
    const [openFromDate, setOpenFromDate] = useState(() => false)
    const [openToDate, setOpenToDate] = useState(() => false)

    const [isLoading, setIsLoading] = useState(() => false)
    const [isDisabled, setIsDisabled] = useState(() => false)

    const formattedFromDate = formattedDate(fromDate)
    const formattedToDate = formattedDate(toDate)

    const handleGetCreditReport = async (
        fromDate: string,
        toDate: string,
        companyId: number,
        branchId: number,
        userId: string,
    ) => {
        if (fromDate > toDate) {
            ToastAndroid.show(
                "From date must be lower than To date.",
                ToastAndroid.SHORT,
            )
            return
        }
        setIsDisabled(true)
        setIsLoading(true)
        await fetchCreditReport(fromDate, toDate, companyId, branchId, userId)
            .then(res => {
                setCreditReport(res?.data)
                console.log("DDDDDDDDDDDDDDD", res?.data)
            })
            .catch(err => {
                ToastAndroid.show("Error fetching sale report.", ToastAndroid.SHORT)
            })
        setIsDisabled(false)
        setIsLoading(false)
    }

    const handlePrint = (
        creditReport: CreditReportResponseData[],
        fromDate: string,
        toDate: string,
    ) => {
        if (creditReport.length !== 0) {
            printCreditReport(creditReport, fromDate, toDate)
        } else {
            ToastAndroid.show("No Credit Report Found!", ToastAndroid.SHORT)
            return
        }
    }

    let totalNetAmount: number = 0
    let totalDue: number = 0

    return (
        // <SafeAreaView
        //     style={[styles.container, { backgroundColor: theme.colors.background }]}>
        //     <ScrollView keyboardShouldPersistTaps="handled">
        //         <View style={{ alignItems: "center" }}>
        //             <HeaderImage
        //                 isBackEnabled
        //                 imgLight={blurReport}
        //                 imgDark={blurReportDark}
        //                 borderRadius={30}
        //                 blur={10}>
        //                 Credit Report
        //             </HeaderImage>
        //         </View>
        //         <View
        //             style={{
        //                 padding: normalize(10),
        //                 flexDirection: "row",
        //                 justifyContent: "space-around",
        //                 alignItems: "center",
        //             }}>
        //             <ButtonPaper
        //                 textColor={'#008181'}
        //                 onPress={() => setOpenFromDate(true)}
        //                 mode="text">
        //                 FROM: {fromDate?.toLocaleDateString("en-GB")}
        //             </ButtonPaper>
        //             <ButtonPaper
        //                 textColor={'#008181'}
        //                 onPress={() => setOpenToDate(true)}
        //                 mode="text">
        //                 TO: {toDate?.toLocaleDateString("en-GB")}
        //             </ButtonPaper>

        //             <DatePicker
        //                 modal
        //                 mode="date"
        //                 // minimumDate={toDate.setMonth(toDate.getMonth() - 1)}
        //                 open={openFromDate}
        //                 date={fromDate}
        //                 onConfirm={date => {
        //                     setOpenFromDate(false)
        //                     setFromDate(date)
        //                 }}
        //                 onCancel={() => {
        //                     setOpenFromDate(false)
        //                 }}
        //             />
        //             <DatePicker
        //                 modal
        //                 mode="date"
        //                 open={openToDate}
        //                 date={toDate}
        //                 onConfirm={date => {
        //                     setOpenToDate(false)
        //                     setToDate(date)
        //                 }}
        //                 onCancel={() => {
        //                     setOpenToDate(false)
        //                 }}
        //             />
        //         </View>

        //         <View
        //             style={{
        //                 paddingHorizontal: normalize(20),
        //                 paddingBottom: normalize(10),
        //             }}>
        //             <ButtonPaper
        //                 onPress={() =>
        //                     handleGetCreditReport(
        //                         formattedFromDate,
        //                         formattedToDate,
        //                         loginStore.comp_id,
        //                         loginStore.br_id,
        //                         loginStore?.user_id,
        //                     )
        //                 }
        //                 mode="contained-tonal"
        //                 buttonColor={'#008181'}
        //                 textColor={'white'}
        //                 loading={isLoading}
        //                 disabled={isDisabled}>
        //                 SUBMIT
        //             </ButtonPaper>
        //         </View>

        //         {creditReport.length >0 &&<SurfacePaper backgroundColor={theme.colors.surface}>
        //             <ScrollView horizontal>
        //                 <DataTable style={{
        //                     width: 400,
        //                 }}>
        //                     <DataTable.Header style={{
        //                         backgroundColor: '#008181',
        //                     }}>
        //                         <DataTable.Title textStyle={{
        //                             color: 'white'
        //                         }}>
        //                             Date
        //                         </DataTable.Title>
        //                         <DataTable.Title textStyle={{
        //                             color: 'white'
        //                         }} numberOfLines={2}>
        //                             Mobile
        //                         </DataTable.Title>
        //                         <DataTable.Title textStyle={{
        //                             color: 'white'
        //                         }}>
        //                             Rcpt No.
        //                         </DataTable.Title>
        //                         <DataTable.Title textStyle={{
        //                             color: 'white'
        //                         }}>
        //                             Amt.
        //                         </DataTable.Title>
        //                         <DataTable.Title textStyle={{
        //                             color: 'white'
        //                         }}>
        //                             Paid Amt.
        //                         </DataTable.Title>
        //                         <DataTable.Title textStyle={{
        //                             color: 'white'
        //                         }}>
        //                             Due Amt.
        //                         </DataTable.Title>
        //                     </DataTable.Header>

        //                     {creditReport.map(item => {
        //                         totalDue += item?.due_amt
        //                         totalNetAmount += item?.net_amt
        //                         return (
        //                             <DataTable.Row key={receiptSettings?.custom_sl_flag === "N" ? item?.receipt_no:item?.rcpt_sl_no}>
        //                                 <DataTable.Cell
        //                                     onPress={() => ToastAndroid.show(`${new Date(item?.trn_date).toLocaleDateString("en-GB")}`, ToastAndroid.SHORT)}>
        //                                     {new Date(item?.trn_date).toLocaleDateString("en-GB")}
        //                                 </DataTable.Cell>
        //                                 <DataTable.Cell
        //                                     onPress={() => ToastAndroid.show(`${item?.phone_no}`, ToastAndroid.SHORT)}>
        //                                     {item?.phone_no}
        //                                 </DataTable.Cell>
        //                                 <DataTable.Cell
        //                                     onPress={() => ToastAndroid.show(`${item?.receipt_no?.toString()}`, ToastAndroid.SHORT)}>
        //                                     {item?.receipt_no
        //                                         ?.toString()
        //                                         ?.substring(item?.receipt_no?.toString()?.length - 4)}
        //                                 </DataTable.Cell>

        //                                 <DataTable.Cell>{item?.net_amt}</DataTable.Cell>

        //                                 <DataTable.Cell>{item?.paid_amt}</DataTable.Cell>
        //                                 <DataTable.Cell>{item?.due_amt}</DataTable.Cell>
        //                             </DataTable.Row>
        //                         )
        //                     })}
        //                 </DataTable>
        //             </ScrollView>
        //             <View style={{ padding: normalize(10) }}>
        //                 <Text variant="labelMedium" style={{ color: '#008181' }}>
        //                     TOTAL NET: ₹{totalNetAmount}  TOTAL DUE: ₹{totalDue?.toFixed(2)}
        //                 </Text>
        //             </View>
        //         </SurfacePaper>}
        //         {creditReport.length >0 &&<View
        //             style={{
        //                 paddingHorizontal: normalize(20),
        //                 paddingBottom: normalize(10),
        //             }}>
        //             <ButtonPaper
        //                 icon={"cloud-print-outline"}
        //                 onPress={() =>
        //                     handlePrint(creditReport, formattedFromDate, formattedToDate)
        //                     // ToastAndroid.show("Printing feature will be added in the future.", ToastAndroid.SHORT)
        //                 }
        //                 mode="contained-tonal"
        //                 buttonColor={theme.colors.primaryContainer}
        //     textColor={theme.colors.onPrimaryContainer}>
        //                 PRINT
        //             </ButtonPaper>
        //         </View>}
        //     </ScrollView>
        // </SafeAreaView>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
  <ScrollView keyboardShouldPersistTaps="handled">
    <View style={{ alignItems: "center", marginBottom: normalize(20) }}>
      <HeaderImage
        isBackEnabled
        imgLight={blurReport}
        imgDark={blurReportDark}
        borderRadius={30}
        blur={10}
      >
        Credit Report
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
                                textColor={colorScheme === "dark" ? "#009689" : "#008181"}

        onPress={() => setOpenFromDate(true)}
        mode="text"
      >
        FROM: {fromDate?.toLocaleDateString("en-GB")}
      </ButtonPaper>
      <ButtonPaper
                                textColor={colorScheme === "dark" ? "#009689" : "#008181"}

        onPress={() => setOpenToDate(true)}
        mode="text"
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
        onPress={() =>
          handleGetCreditReport(
            formattedFromDate,
            formattedToDate,
            loginStore.comp_id,
            loginStore.br_id,
            loginStore?.user_id,
          )
        }
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

    {creditReport.length > 0 && (
      <SurfacePaper
                                backgroundColor={colorScheme === "dark" ? "#2e2929ff" : "#fff"}

        style={{
          marginHorizontal: normalize(16),
          borderRadius: normalize(8),
          elevation: 1,
          borderWidth: 1,
                                        borderColor: colorScheme === "dark" ? "#2e2929ff" : "#ececf0ff",

          marginBottom: normalize(16),
          padding: normalize(12),
        }}
      >
        <ScrollView horizontal>
          <DataTable style={{ width: 400 }}>
            <DataTable.Header style={{ backgroundColor: colorScheme === "dark" ? "#009689" : '#008181', borderRadius: normalize(6) }}>
              <DataTable.Title textStyle={{ color: 'white' }}>Date</DataTable.Title>
              <DataTable.Title textStyle={{ color: 'white' }} numberOfLines={2}>Mobile</DataTable.Title>
              <DataTable.Title textStyle={{ color: 'white' }}>Rcpt No.</DataTable.Title>
              <DataTable.Title textStyle={{ color: 'white' }}>Amt.</DataTable.Title>
              <DataTable.Title textStyle={{ color: 'white' }}>Paid Amt.</DataTable.Title>
              <DataTable.Title textStyle={{ color: 'white' }}>Due Amt.</DataTable.Title>
            </DataTable.Header>
            {creditReport.map(item => {
              totalDue += item?.due_amt;
              totalNetAmount += item?.net_amt;
              return (
                <DataTable.Row key={receiptSettings?.custom_sl_flag === "N" ? item?.receipt_no : item?.rcpt_sl_no}>
                  <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }}>
                    {new Date(item?.trn_date).toLocaleDateString("en-GB")}
                  </DataTable.Cell>
                  <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }}>
                    {item?.phone_no}
                  </DataTable.Cell>
                  <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }}>
                    {item?.receipt_no?.toString()?.substring(item?.receipt_no?.toString()?.length - 4)}
                  </DataTable.Cell>
                  <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }}>{item?.net_amt}</DataTable.Cell>
                  <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }}>{item?.paid_amt}</DataTable.Cell>
                  <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }}>{item?.due_amt}</DataTable.Cell>
                </DataTable.Row>
              );
            })}
          </DataTable>
        </ScrollView>
        <View style={{ padding: normalize(10), borderTopWidth: 1, borderTopColor: '#ececf0ff', marginTop: normalize(10) }}>
          <Text
            variant="labelMedium"
            style={{
                                                        color: colorScheme === "dark" ? "#009689" : '#008181',

              fontWeight: '500',
              fontSize: normalize(14),
            }}
          >
            TOTAL NET: ₹{totalNetAmount}  TOTAL DUE: ₹{totalDue?.toFixed(2)}
          </Text>
        </View>
      </SurfacePaper>
    )}

    {creditReport.length > 0 && (
      <View style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(16) }}>
        <ButtonPaper
          icon="cloud-print-outline"
          onPress={() => handlePrint(creditReport, formattedFromDate, formattedToDate)}
          mode="contained-tonal"
                              buttonColor={colorScheme === "dark" ? "#009689" : '#008181'}

          textColor="white"
          style={{ borderRadius: normalize(8) }}
        >
          PRINT
        </ButtonPaper>
      </View>
    )}
  </ScrollView>
</SafeAreaView>

    )
}

export default CreditReportScreen

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
    },

    title: {
        textAlign: "center",
    },
})
