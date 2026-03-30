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
import { RecoveryReportCredentials, RecoveryReportData } from "../models/api_types"
import SurfacePaper from "../components/SurfacePaper"
import { useBluetoothPrint } from "../hooks/printables/useBluetoothPrint"
import useRecoveryReport from "../hooks/api/useRecoveryReport"

function RecoveryReportScreen() {
    const theme = usePaperColorScheme()

    const loginStore = JSON.parse(loginStorage.getString("login-data"))

    const { fetchRecoveryReport } = useRecoveryReport()
    const { printRecoveryReport } = useBluetoothPrint()

    const [recoveryReport, setRecoveryReport] = useState<RecoveryReportData[]>(
        () => [],
    )

    const [fromDate, setFromDate] = useState(() => new Date())
    const [toDate, setToDate] = useState(() => new Date())
    const [openFromDate, setOpenFromDate] = useState(() => false)
    const [openToDate, setOpenToDate] = useState(() => false)
    const colorScheme = useColorScheme()
    const [isLoading, setIsLoading] = useState(() => false)
    const [isDisabled, setIsDisabled] = useState(() => false)

    const formattedFromDate = formattedDate(fromDate)
    const formattedToDate = formattedDate(toDate)

    const handleGetDueReport = async (
        fromDate: string,
        toDate: string,
        companyId: number,
        branchId: number,
        // userId: string,
    ) => {
        setIsDisabled(true)
        setIsLoading(true)
        let recoveryReportCredObject: RecoveryReportCredentials = {
            comp_id: companyId,
            br_id: branchId,
            from_date: fromDate,
            to_date: toDate,
            // user_id: userId,
        }
        await fetchRecoveryReport(recoveryReportCredObject)
            .then(res => {
                setRecoveryReport(res?.data)
                console.log("XXXXXXXXXXXXXXXXX", res?.data)
            })
            .catch(err => {
                ToastAndroid.show("Error during fetching report.", ToastAndroid.SHORT)
            })
        setIsDisabled(false)
        setIsLoading(false)
    }

    const handlePrint = (
        recReport: RecoveryReportData[],
        fromDate: string,
        toDate: string,
    ) => {
        if (recReport.length !== 0) {
            printRecoveryReport(recReport, fromDate, toDate)
        } else {
            ToastAndroid.show("No Recovery Report Found!", ToastAndroid.SHORT)
            return
        }
    }

    const titleTextStyle: TextStyle = {
        color: 'white'
    }

    const titleStyle: ViewStyle = {
        backgroundColor: '#008181'
    }

    let totalRecoverAmt: number = 0

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
        //                 Recovery Report
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
        //                     handleGetDueReport(
        //                         formattedFromDate,
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

        //         {recoveryReport.length>0 && <SurfacePaper backgroundColor={theme.colors.surface}>
        //             <DataTable>
        //                 <DataTable.Header style={titleStyle}>
        //                     {/* <DataTable.Title textStyle={titleTextStyle}>Created By</DataTable.Title> */}
        //                     <DataTable.Title textStyle={titleTextStyle}>Recover Dt.</DataTable.Title>
        //                     <DataTable.Title textStyle={titleTextStyle}>Customer</DataTable.Title>
        //                     <DataTable.Title textStyle={titleTextStyle}>Phone</DataTable.Title>
        //                     <DataTable.Title textStyle={titleTextStyle} numeric>Recovery Amt.</DataTable.Title>
        //                 </DataTable.Header>

        //                 {recoveryReport?.map((item, i) => {
        //                     // totalSummary += item?.net_amt
        //                     // totalBills += item?.no_of_rcpt
        //                     totalRecoverAmt += item?.recovery_amt

        //                     return (
        //                         <DataTable.Row key={i}>
        //                             <DataTable.Cell>{item?.recover_dt}</DataTable.Cell>
        //                             <DataTable.Cell>
        //                                 {item?.cust_name}
        //                             </DataTable.Cell>
        //                             <DataTable.Cell>{item?.phone_no}</DataTable.Cell>
        //                             <DataTable.Cell numeric>{item?.recovery_amt}</DataTable.Cell>
        //                         </DataTable.Row>
        //                     )
        //                 })}
        //             </DataTable>
        //             <View style={{ padding: normalize(10) }}>
        //                 <Text variant="labelMedium" style={{ color: '#008181' }}>
        //                     TOTAL: {recoveryReport?.length}   RECOVERY AMT: ₹{totalRecoverAmt}
        //                 </Text>
        //             </View>
        //         </SurfacePaper>}
        //         {recoveryReport.length>0 &&<View
        //             style={{
        //                 paddingHorizontal: normalize(20),
        //                 paddingBottom: normalize(10),
        //             }}>
        //             <ButtonPaper
        //                 icon={"cloud-print-outline"}
        //                 onPress={() =>
        //                     handlePrint(recoveryReport, formattedFromDate, formattedToDate)
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
        Recovery Report
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
          handleGetDueReport(
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

    {recoveryReport.length > 0 && (
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
            <DataTable.Title textStyle={[titleTextStyle, { color: '#fff' }]}>Recover Dt.</DataTable.Title>
            <DataTable.Title textStyle={[titleTextStyle, { color: '#fff' }]}>Customer</DataTable.Title>
            <DataTable.Title textStyle={[titleTextStyle, { color: '#fff' }]}>Phone</DataTable.Title>
            <DataTable.Title textStyle={[titleTextStyle, { color: '#fff' }]} numeric>Recovery Amt.</DataTable.Title>
          </DataTable.Header>
          {recoveryReport?.map((item, i) => {
            totalRecoverAmt += item?.recovery_amt;
            return (
              <DataTable.Row key={i}>
                <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }}>{item?.recover_dt}</DataTable.Cell>
                <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }}>{item?.cust_name}</DataTable.Cell>
                <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }}>{item?.phone_no}</DataTable.Cell>
                <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }} numeric>{item?.recovery_amt}</DataTable.Cell>
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
            TOTAL: {recoveryReport?.length}   RECOVERY AMT: ₹{totalRecoverAmt}
          </Text>
        </View>
      </SurfacePaper>
    )}

    {recoveryReport.length > 0 && (
      <View style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(16) }}>
        <ButtonPaper
          icon="cloud-print-outline"
          onPress={() => handlePrint(recoveryReport, formattedFromDate, formattedToDate)}
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

export default RecoveryReportScreen

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
    },

    title: {
        textAlign: "center",
    },
})
