import {
    StyleSheet,
    ScrollView,
    SafeAreaView,
    View,
    ToastAndroid,
    TextStyle,
    ViewStyle,
    useColorScheme,
} from "react-native"

import HeaderImage from "../components/HeaderImage"
import { blurReport, blurReportDark } from "../resources/images"
import { usePaperColorScheme } from "../theme/theme"
import { DataTable, Text } from "react-native-paper"
import useSaleReport from "../hooks/api/useSaleReport"
import useDaybookReport from "../hooks/api/useDaybookReport"
import DatePicker from "react-native-date-picker"
import ButtonPaper from "../components/ButtonPaper"
import { useContext, useState } from "react"
import normalize from "react-native-normalize"
import { formattedDate } from "../utils/dateFormatter"
import { loginStorage } from "../storage/appStorage"
import { BasicReportCredentials, DaybookReportData, SaleReport } from "../models/api_types"
import SurfacePaper from "../components/SurfacePaper"
import { useBluetoothPrint } from "../hooks/printables/useBluetoothPrint"
import { AppStore } from "../context/AppContext"
import { AppStoreContext } from "../models/custom_types"

function DaybookReportScreen() {
    const theme = usePaperColorScheme()
    const colorScheme = useColorScheme()

    const loginStore = JSON.parse(loginStorage.getString("login-data"))

    const { receiptSettings } = useContext<AppStoreContext>(AppStore)

    // const { fetchSaleReport } = useSaleReport()
    const { fetchDaybookReport } = useDaybookReport()
    const { printDaybookReport } = useBluetoothPrint()

    const [daybookReport, setDaybookReportReport] = useState<DaybookReportData[]>(() => [])

    const [fromDate, setFromDate] = useState(() => new Date())
    const [toDate, setToDate] = useState(() => new Date())
    const [openFromDate, setOpenFromDate] = useState(() => false)
    const [openToDate, setOpenToDate] = useState(() => false)

    const [isLoading, setIsLoading] = useState(() => false)
    const [isDisabled, setIsDisabled] = useState(() => false)

    const formattedFromDate = formattedDate(fromDate)
    const formattedToDate = formattedDate(toDate)

    const handleGetDaybookReport = async (
        fromDate: string,
        toDate: string
    ) => {
        console.log("daybook ")
        const creds: BasicReportCredentials = {
            from_date: fromDate,
            to_date: toDate,
            comp_id: loginStore?.comp_id,
            br_id: loginStore?.br_id,
            // user_id: loginStore?.user_id
        }
        if (fromDate > toDate) {
            ToastAndroid.show(
                "From date must be lower than To date.",
                ToastAndroid.SHORT,
            )
            return
        }
        setIsDisabled(true)
        setIsLoading(true)
        await fetchDaybookReport(creds)
            .then(res => {
                setDaybookReportReport(res?.data)
                console.log("DDDDDDDDDDDDDDD", res?.data)
            })
            .catch(err => {
                ToastAndroid.show("Error fetching daybook report.", ToastAndroid.SHORT)
            })
        setIsDisabled(false)
        setIsLoading(false)
    }

    const handlePrint = (
        daybookReport: DaybookReportData[],
        fromDate: string,
        toDate: string,
    ) => {
        if (daybookReport.length !== 0) {
            printDaybookReport(daybookReport, fromDate, toDate)
        } else {
            ToastAndroid.show("No Daybook Report Found!", ToastAndroid.SHORT)
            return
        }
    }

    const titleTextStyle: TextStyle = {
        color: 'white'
    }

    const titleStyle: ViewStyle = {
        backgroundColor: '#008181'
    }

    let totalNetAmount: number = 0
    let totalCancelled: number = 0

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
        //                 Daybook Report
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
        //                 textColor={"#008181"}
        //                 onPress={() => setOpenFromDate(true)}
        //                 mode="text">
        //                 FROM: {fromDate?.toLocaleDateString("en-GB")}
        //             </ButtonPaper>
        //             <ButtonPaper
        //                 textColor={"#008181"}
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
        //                     handleGetDaybookReport(
        //                         formattedFromDate,
        //                         formattedToDate
        //                     )
        //                 }
        //                 mode="contained-tonal"
        //                 buttonColor={"#008181"}
        //                 textColor={theme.colors.onPurple}
        //                 loading={isLoading}
        //                 disabled={isDisabled}>
        //                 SUBMIT
        //             </ButtonPaper>
        //         </View>

        //         {daybookReport.length>0 && <SurfacePaper backgroundColor={theme.colors.surface}>
        //             <ScrollView horizontal>
        //                 <DataTable style={{
        //                     width: 430,
        //                 }}>
        //                     <DataTable.Header style={titleStyle}>
        //                         {/* <DataTable.Title>Name</DataTable.Title>
        //       <DataTable.Title>Phone</DataTable.Title> */}
        //                         <DataTable.Title textStyle={titleTextStyle}>Sl. No.</DataTable.Title>
        //                         <DataTable.Title textStyle={titleTextStyle}>Rcpt. No.</DataTable.Title>
        //                         <DataTable.Title textStyle={titleTextStyle}>Net Amt.</DataTable.Title>
        //                         <DataTable.Title textStyle={titleTextStyle}>Cancel Amt.</DataTable.Title>
        //                     </DataTable.Header>

        //                     {daybookReport.map((item, index) => {
        //                         totalNetAmount += item?.net_amt
        //                         totalCancelled += item?.cancelled_amt

        //                         return (
        //                             <DataTable.Row key={index}>
        //                                 <DataTable.Cell>
        //                                     {index + 1}
        //                                 </DataTable.Cell>
        //                                 <DataTable.Cell>
        //                                     {receiptSettings?.custom_sl_flag === "N" ? item?.receipt_no
        //                                         ?.toString()
        //                                         ?.substring(item?.receipt_no?.toString()?.length - 4):item?.rcpt_sl_no}
        //                                 </DataTable.Cell>
        //                                 <DataTable.Cell>
        //                                     {item?.net_amt}
        //                                 </DataTable.Cell>
        //                                 <DataTable.Cell>{item?.cancelled_amt}</DataTable.Cell>
        //                             </DataTable.Row>
        //                         )
        //                     })}
        //                 </DataTable>
        //             </ScrollView>
        //             <View style={{ padding: normalize(10) }}>
        //                 <Text variant="labelMedium" style={{ color: '#008181' }}>
        //                     TOTAL NET: {(totalNetAmount).toFixed(2)}  CANCELLED: ₹{totalCancelled?.toFixed(2)}
        //                 </Text>
        //             </View>
        //         </SurfacePaper>}
        //         {daybookReport.length>0 && <View
        //             style={{
        //                 paddingHorizontal: normalize(20),
        //                 paddingBottom: normalize(10),
        //             }}>
        //             <ButtonPaper
        //                 icon={"cloud-print-outline"}
        //                 onPress={() =>
        //                     handlePrint(daybookReport, formattedFromDate, formattedToDate)
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
      <View style={{ alignItems: "center" }}>
                     <HeaderImage
                         isBackEnabled
                         imgLight={blurReport}
                         imgDark={blurReportDark}
                         borderRadius={30}
                         blur={10}>
                         Daybook Report
                     </HeaderImage>
                 </View>
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
        onPress={() => handleGetDaybookReport(formattedFromDate, formattedToDate)}
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

    {daybookReport.length > 0 && (
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
          <DataTable style={{ width: 430 }}>
            <DataTable.Header style={[titleStyle, { backgroundColor: colorScheme === "dark" ? "#009689" : '#008181', borderRadius: normalize(6) }]}>
              <DataTable.Title textStyle={[titleTextStyle, { color: '#fff' }]}>Sl. No.</DataTable.Title>
              <DataTable.Title textStyle={[titleTextStyle, { color: '#fff' }]}>Rcpt. No.</DataTable.Title>
              <DataTable.Title textStyle={[titleTextStyle, { color: '#fff' }]}>Net Amt.</DataTable.Title>
              <DataTable.Title textStyle={[titleTextStyle, { color: '#fff' }]}>Cancel Amt.</DataTable.Title>
            </DataTable.Header>
            {daybookReport.map((item, index) => {
              totalNetAmount += item?.net_amt;
              totalCancelled += item?.cancelled_amt;
              return (
                <DataTable.Row key={index}>
                  <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }}>{index + 1}</DataTable.Cell>
                  <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }}>
                    {receiptSettings?.custom_sl_flag === "N"
                      ? item?.receipt_no?.toString()?.substring(item?.receipt_no?.toString()?.length - 4)
                      : item?.rcpt_sl_no}
                  </DataTable.Cell>
                  <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }}>{item?.net_amt}</DataTable.Cell>
                  <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }}>{item?.cancelled_amt}</DataTable.Cell>
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
            TOTAL NET: {(totalNetAmount).toFixed(2)}  CANCELLED: ₹{totalCancelled?.toFixed(2)}
          </Text>
        </View>
      </SurfacePaper>
    )}

    {daybookReport.length > 0 && (
      <View style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(16) }}>
        <ButtonPaper
          icon="cloud-print-outline"
          onPress={() => handlePrint(daybookReport, formattedFromDate, formattedToDate)}
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

export default DaybookReportScreen

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
    },

    title: {
        textAlign: "center",
    },
})
