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
import { DueReportCredentials, DueReportData } from "../models/api_types"
import SurfacePaper from "../components/SurfacePaper"
import { useBluetoothPrint } from "../hooks/printables/useBluetoothPrint"
import useCollectionReport from "../hooks/api/useCollectionReport"
import useDueReport from "../hooks/api/useDueReport"

function DueReportScreen() {
    const theme = usePaperColorScheme()
    const colorScheme = useColorScheme()
    const loginStore = JSON.parse(loginStorage.getString("login-data"))

    const { fetchDueReport } = useDueReport()
    const { printDueReport } = useBluetoothPrint()

    const [dueReport, setDueReport] = useState<DueReportData[]>(
        () => [],
    )

    // const [fromDate, setFromDate] = useState(() => new Date())
    const [toDate, setToDate] = useState(() => new Date())
    const [openFromDate, setOpenFromDate] = useState(() => false)
    const [openToDate, setOpenToDate] = useState(() => false)

    const [isLoading, setIsLoading] = useState(() => false)
    const [isDisabled, setIsDisabled] = useState(() => false)

    // const formattedFromDate = formattedDate(fromDate)
    const formattedToDate = formattedDate(toDate)

    const handleGetDueReport = async (
        // fromDate: string,
        toDate: string,
        companyId: number,
        branchId: number,
        // userId: string,
    ) => {
        setIsDisabled(true)
        setIsLoading(true)
        let dueReportCredObject: DueReportCredentials = {
            comp_id: companyId,
            br_id: branchId,
            date: toDate,
            // user_id: userId,
        }
        await fetchDueReport(dueReportCredObject)
            .then(res => {
                setDueReport(res?.data)
                console.log("XXXXXXXXXXXXXXXXX", res?.data)
            })
            .catch(err => {
                ToastAndroid.show("Error during fetching report.", ToastAndroid.SHORT)
            })
        setIsDisabled(false)
        setIsLoading(false)
    }

    const handlePrint = (
        dueRep: DueReportData[],
        date: string,
    ) => {
        if (dueRep.length !== 0) {
            printDueReport(dueRep, date)
        } else {
            ToastAndroid.show("No Due Report Found!", ToastAndroid.SHORT)
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
        //                 Due Report
        //             </HeaderImage>
        //         </View>
        //         <View
        //             style={{
        //                 padding: normalize(10),
        //                 flexDirection: "row",
        //                 justifyContent: "space-around",
        //                 alignItems: "center",
        //             }}>
        //             {/* <ButtonPaper
        //                 textColor={theme.colors.primary}
        //                 onPress={() => setOpenFromDate(true)}
        //                 mode="text">
        //                 FROM: {fromDate?.toLocaleDateString("en-GB")}
        //             </ButtonPaper> */}
        //             <ButtonPaper
        //                 textColor={'#008181'}
        //                 onPress={() => setOpenToDate(true)}
        //                 mode="text">
        //                 DATE: {toDate?.toLocaleDateString("en-GB")}
        //             </ButtonPaper>

        //             {/* <DatePicker
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
        //             /> */}
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
        //                     handleGetDueReport(
        //                         formattedToDate,
        //                         loginStore.comp_id,
        //                         loginStore.br_id,
        //                         // loginStore?.user_id,
        //                     )
        //                 }
        //                 mode="contained-tonal"
        //                 buttonColor={'#008181'}
        //                 textColor={theme.colors.onPrimary}
        //                 loading={isLoading}
        //                 disabled={isDisabled}>
        //                 SUBMIT
        //             </ButtonPaper>
        //         </View>

        //         {dueReport?.length>0 &&<SurfacePaper backgroundColor={theme.colors.surface}>
        //             <DataTable>
        //                 <DataTable.Header style={titleStyle}>
        //                     {/* <DataTable.Title textStyle={titleTextStyle}>Created By</DataTable.Title> */}
        //                     <DataTable.Title textStyle={titleTextStyle}>Sl. No.</DataTable.Title>
        //                     <DataTable.Title textStyle={titleTextStyle}>Customer</DataTable.Title>
        //                     <DataTable.Title textStyle={titleTextStyle}>Phone</DataTable.Title>
        //                     <DataTable.Title textStyle={titleTextStyle} numeric>Due Amt.</DataTable.Title>
        //                 </DataTable.Header>

        //                 {dueReport?.map((item, i) => {
        //                     // totalSummary += item?.net_amt
        //                     // totalBills += item?.no_of_rcpt
        //                     totalDue += item?.due_amt

        //                     return (
        //                         <DataTable.Row key={i}>
        //                             <DataTable.Cell>{i + 1}</DataTable.Cell>
        //                             <DataTable.Cell>
        //                                 {item?.cust_name}
        //                             </DataTable.Cell>
        //                             <DataTable.Cell>{item?.phone_no}</DataTable.Cell>
        //                             <DataTable.Cell numeric>{item?.due_amt}</DataTable.Cell>
        //                         </DataTable.Row>
        //                     )
        //                 })}
        //             </DataTable>
        //             <View style={{ padding: normalize(10) }}>
        //                 <Text variant="labelMedium" style={{ color: '#008181' }}>
        //                     TOTAL: {dueReport?.length}   DUE: ₹{totalDue}
        //                 </Text>
        //             </View>
        //         </SurfacePaper>}
        //         {dueReport?.length>0 &&<View
        //             style={{
        //                 paddingHorizontal: normalize(20),
        //                 paddingBottom: normalize(10),
        //             }}>
        //             <ButtonPaper
        //                 icon={"cloud-print-outline"}
        //                 onPress={() =>
        //                     handlePrint(dueReport, formattedToDate)
        //                 }
        //                 mode="contained-tonal"
        //                 buttonColor={theme.colors.primaryContainer}
        //                 textColor={theme.colors.onPrimaryContainer}>
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
        Due Report
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

        onPress={() => setOpenToDate(true)}
        mode="text"
      >
        DATE: {toDate?.toLocaleDateString("en-GB")}
      </ButtonPaper>
    </View>

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
          handleGetDueReport(
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

    {dueReport?.length > 0 && (
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
            <DataTable.Title textStyle={[titleTextStyle, { color: '#fff' }]}>Customer</DataTable.Title>
            <DataTable.Title textStyle={[titleTextStyle, { color: '#fff' }]}>Phone</DataTable.Title>
            <DataTable.Title textStyle={[titleTextStyle, { color: '#fff' }]} numeric>Due Amt.</DataTable.Title>
          </DataTable.Header>
          {dueReport?.map((item, i) => {
            totalDue += item?.due_amt;
            return (
              <DataTable.Row key={i}>
                <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }}>{i + 1}</DataTable.Cell>
                <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }}>{item?.cust_name}</DataTable.Cell>
                <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }}>{item?.phone_no}</DataTable.Cell>
                <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }} numeric>{item?.due_amt}</DataTable.Cell>
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
            TOTAL: {dueReport?.length}   DUE: ₹{totalDue}
          </Text>
        </View>
      </SurfacePaper>
    )}

    {dueReport?.length > 0 && (
      <View style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(16) }}>
        <ButtonPaper
          icon="cloud-print-outline"
          onPress={() => handlePrint(dueReport, formattedToDate)}
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

export default DueReportScreen

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
    },

    title: {
        textAlign: "center",
    },
})
