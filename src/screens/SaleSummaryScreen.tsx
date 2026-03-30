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
import DatePicker from "react-native-date-picker"
import ButtonPaper from "../components/ButtonPaper"
import { useState } from "react"
import normalize from "react-native-normalize"
import { formattedDate } from "../utils/dateFormatter"
import { loginStorage } from "../storage/appStorage"
import {
  CollectionReport,
  CollectionReportCredentials,
} from "../models/api_types"
import SurfacePaper from "../components/SurfacePaper"
import { useBluetoothPrint } from "../hooks/printables/useBluetoothPrint"
import useCollectionReport from "../hooks/api/useCollectionReport"

function SaleSummaryScreen() {
  const theme = usePaperColorScheme()
  const colorScheme = useColorScheme()

  
  const loginStore = JSON.parse(loginStorage.getString("login-data"))

  const { fetchCollectionReport } = useCollectionReport()
  const { printCollectionReport } = useBluetoothPrint()

  const [collectionReport, setCollectionReport] = useState<CollectionReport[]>(
    () => [],
  )

  const [fromDate, setFromDate] = useState(() => new Date())
  const [toDate, setToDate] = useState(() => new Date())
  const [openFromDate, setOpenFromDate] = useState(() => false)
  const [openToDate, setOpenToDate] = useState(() => false)

  const [isLoading, setIsLoading] = useState(() => false)
  const [isDisabled, setIsDisabled] = useState(() => false)

  const formattedFromDate = formattedDate(fromDate)
  const formattedToDate = formattedDate(toDate)

  const handleGetCollectionReport = async (
    fromDate: string,
    toDate: string,
    companyId: number,
    branchId: number,
    // userId: string,
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
    let collectionReportCredObject: CollectionReportCredentials = {
      from_date: fromDate,
      to_date: toDate,
      comp_id: companyId,
      br_id: branchId,
      // user_id: userId,
    }
    await fetchCollectionReport(collectionReportCredObject)
      .then(res => {
        setCollectionReport(res?.data)
        console.log("XXXXXXXXXXXXXXXXX", res?.data)
      })
      .catch(err => {
        ToastAndroid.show("Error during fetching report.", ToastAndroid.SHORT)
      })
    setIsDisabled(false)
    setIsLoading(false)
  }

  const handlePrint = (
    collectionReport: CollectionReport[],
    fromDate: string,
    toDate: string,
  ) => {
    if (collectionReport.length !== 0) {
      printCollectionReport(collectionReport, fromDate, toDate)
    } else {
      ToastAndroid.show("No Sale Summary Found!", ToastAndroid.SHORT)
      return
    }
  }

  const titleTextStyle: TextStyle = {
    color: 'white'
  }

  const titleStyle: ViewStyle = {
    backgroundColor: '#008181'
  }

  let totalSummary: number = 0
  let totalBills: number = 0
  let totalCancelled: number = 0

  return (
    // <SafeAreaView
    //   style={[styles.container, { backgroundColor: theme.colors.background }]}>
    //   <ScrollView keyboardShouldPersistTaps="handled">
    //     <View style={{ alignItems: "center" }}>
    //       <HeaderImage
    //         isBackEnabled
    //         imgLight={blurReport}
    //         imgDark={blurReportDark}
    //         borderRadius={30}
    //         blur={10}>
    //         Sale Summary
    //       </HeaderImage>
    //     </View>
    //     <View
    //       style={{
    //         padding: normalize(10),
    //         flexDirection: "row",
    //         justifyContent: "space-around",
    //         alignItems: "center",
    //       }}>
    //       <ButtonPaper
    //         textColor={'#008181'}
    //         onPress={() => setOpenFromDate(true)}
    //         mode="text">
    //         FROM: {fromDate?.toLocaleDateString("en-GB")}
    //       </ButtonPaper>
    //       <ButtonPaper
    //         textColor={'#008181'}
    //         onPress={() => setOpenToDate(true)}
    //         mode="text">
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
    //           handleGetCollectionReport(
    //             formattedFromDate,
    //             formattedToDate,
    //             loginStore.comp_id,
    //             loginStore.br_id,
    //             // loginStore?.user_id,
    //           )
    //         }
    //         mode="contained-tonal"
    //         buttonColor={'#008181'}
    //         textColor={theme.colors.onPrimary}
    //         loading={isLoading}
    //         disabled={isDisabled}>
    //         SUBMIT
    //       </ButtonPaper>
    //     </View>

    //     {collectionReport.length>0 && <SurfacePaper backgroundColor={theme.colors.surface}>
    //       <DataTable>
    //         <DataTable.Header style={titleStyle}>
    //           {/* <DataTable.Title textStyle={titleTextStyle}>Created By</DataTable.Title> */}
    //           <DataTable.Title textStyle={titleTextStyle}>Sl. No.</DataTable.Title>
    //           <DataTable.Title textStyle={titleTextStyle}>Pay Mode</DataTable.Title>
    //           <DataTable.Title textStyle={titleTextStyle} numeric>RCPTs</DataTable.Title>
    //           <DataTable.Title textStyle={titleTextStyle} numeric>Net Amt.</DataTable.Title>
    //           <DataTable.Title textStyle={titleTextStyle} numeric>Cncl Amt.</DataTable.Title>
    //         </DataTable.Header>

    //         {collectionReport?.map((item, i) => {
    //           totalSummary += item?.net_amt
    //           totalBills += item?.no_of_rcpt
    //           totalCancelled += item?.can_amt

    //           return (
    //             <DataTable.Row key={i}>
    //               {/* <DataTable.Cell>{item?.user_name}</DataTable.Cell> */}
    //               <DataTable.Cell>{i + 1}</DataTable.Cell>
    //               <DataTable.Cell>
    //                 {item?.pay_mode === "C"
    //                   ? "Cash"
    //                   : item?.pay_mode === "U"
    //                     ? "UPI"
    //                     : item?.pay_mode === "D"
    //                       ? "Card"
    //                       : item?.pay_mode === "R"
    //                         ? "Credit"
    //                         : ""}
    //               </DataTable.Cell>
    //               <DataTable.Cell numeric>{item?.no_of_rcpt}</DataTable.Cell>
    //               <DataTable.Cell numeric>{item?.net_amt}</DataTable.Cell>
    //               <DataTable.Cell numeric>{item?.can_amt}</DataTable.Cell>
    //             </DataTable.Row>
    //           )
    //         })}
    //       </DataTable>
    //       <View style={{ padding: normalize(10) }}>
    //         <Text variant="labelMedium" style={{ color: '#008181' }}>
    //           TOTAL: {totalBills} Bills ₹{totalSummary?.toFixed(2)} CANCELLED: ₹{totalCancelled}
    //         </Text>
    //       </View>
    //     </SurfacePaper>}
    //     {collectionReport.length>0 &&<View
    //       style={{
    //         paddingHorizontal: normalize(20),
    //         paddingBottom: normalize(10),
    //       }}>
    //       <ButtonPaper
    //         icon={"cloud-print-outline"}
    //         onPress={() =>
    //           handlePrint(collectionReport, formattedFromDate, formattedToDate)
    //         }
    //         mode="contained-tonal"
    //         buttonColor={theme.colors.primaryContainer}
    //         textColor={theme.colors.onPrimaryContainer}>
    //         PRINT
    //       </ButtonPaper>
    //     </View>}
    //   </ScrollView>
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
        Sale Summary
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
          handleGetCollectionReport(
            formattedFromDate,
            formattedToDate,
            loginStore.comp_id,
            loginStore.br_id,
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

    {collectionReport.length > 0 && (
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
        <DataTable>
          <DataTable.Header style={[titleStyle, { backgroundColor: colorScheme === "dark" ? "#009689" : '#008181', borderRadius: normalize(6) }]}>
            <DataTable.Title textStyle={[titleTextStyle, { color: '#fff' }]}>Sl. No.</DataTable.Title>
            <DataTable.Title textStyle={[titleTextStyle, { color: '#fff' }]}>Pay Mode</DataTable.Title>
            <DataTable.Title textStyle={[titleTextStyle, { color: '#fff' }]} numeric>RCPTs</DataTable.Title>
            <DataTable.Title textStyle={[titleTextStyle, { color: '#fff' }]} numeric>Net Amt.</DataTable.Title>
            <DataTable.Title textStyle={[titleTextStyle, { color: '#fff' }]} numeric>Cncl Amt.</DataTable.Title>
          </DataTable.Header>
          {collectionReport?.map((item, i) => {
            totalSummary += item?.net_amt;
            totalBills += item?.no_of_rcpt;
            totalCancelled += item?.can_amt;
            return (
              <DataTable.Row key={i}>
                <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }}>{i + 1}</DataTable.Cell>
                <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }}>
                  {item?.pay_mode === "C"
                    ? "Cash"
                    : item?.pay_mode === "U"
                      ? "UPI"
                      : item?.pay_mode === "D"
                        ? "Card"
                        : item?.pay_mode === "R"
                          ? "Credit"
                          : ""}
                </DataTable.Cell>
                <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }} numeric>{item?.no_of_rcpt}</DataTable.Cell>
                <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }} numeric>{item?.net_amt}</DataTable.Cell>
                <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }} numeric>{item?.can_amt}</DataTable.Cell>
              </DataTable.Row>
            );
          })}
        </DataTable>
        <View style={{ padding: normalize(10), borderTopWidth: 1, borderTopColor: '#ececf0ff', marginTop: normalize(10) }}>
          <Text
            variant="labelMedium"
            style={{
                                                        color: colorScheme === "dark" ? "#009689" : '#008181',

              fontWeight: '500',
              fontSize: normalize(14),
            }}
          >
            TOTAL: {totalBills} Bills ₹{totalSummary?.toFixed(2)} CANCELLED: ₹{totalCancelled}
          </Text>
        </View>
      </SurfacePaper>
    )}

    {collectionReport.length > 0 && (
      <View style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(16) }}>
        <ButtonPaper
          icon="cloud-print-outline"
          onPress={() => handlePrint(collectionReport, formattedFromDate, formattedToDate)}
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

export default SaleSummaryScreen

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },

  title: {
    textAlign: "center",
  },
})
