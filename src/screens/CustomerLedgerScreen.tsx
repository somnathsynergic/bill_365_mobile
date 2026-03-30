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
import { DataTable, Searchbar, Text } from "react-native-paper"
import ButtonPaper from "../components/ButtonPaper"
import { useState } from "react"
import normalize from "react-native-normalize"
import { loginStorage } from "../storage/appStorage"
import {
    CustomerLedgerCredentials,
    CustomerLedgerData,
} from "../models/api_types"
import SurfacePaper from "../components/SurfacePaper"
import { useIsFocused } from "@react-navigation/native"
import useCustomerLedger from "../hooks/api/useCustomerLedger"
import { useBluetoothPrint } from "../hooks/printables/useBluetoothPrint"

function CustomerLedgerScreen() {
    const isFocused = useIsFocused()
    const theme = usePaperColorScheme()
    const colorScheme = useColorScheme()
    const loginStore = JSON.parse(loginStorage.getString("login-data"))

    const { fetchCustomerLedger } = useCustomerLedger()
    const { printCustomerLedger } = useBluetoothPrint()

    const [search, setSearch] = useState<string>(() => "")
    const [custLedgerData, setCustLedgerData] = useState<CustomerLedgerData[]>(() => [])


    const [isLoading, setIsLoading] = useState(() => false)
    const [isDisabled, setIsDisabled] = useState(() => false)

    const onChangeSearch = (query: string) => {
        setSearch(query)
    }

    const handleGetCustomerLedger = async () => {
        const fetchCustomerLedgerCreds: CustomerLedgerCredentials = {
            comp_id: loginStore?.comp_id,
            br_id: loginStore?.br_id,
            phone_no: search
        }

        setIsDisabled(true)
        setIsLoading(true)
        await fetchCustomerLedger(fetchCustomerLedgerCreds)
            .then(res => {
                setCustLedgerData(res?.data)
                console.log("XXXXXXXXXXXXXXXXX", res?.data)

                if (res?.data?.length === 0) {
                    ToastAndroid.show("No Data.", ToastAndroid.SHORT)
                    return
                }
            })
            .catch(err => {
                ToastAndroid.show("Error fetching customer ledger.", ToastAndroid.SHORT)
            })
        setIsDisabled(false)
        setIsLoading(false)
    }


    const handlePrint = (
        cusLed: CustomerLedgerData[],
    ) => {
        if (cusLed.length !== 0) {
            printCustomerLedger(cusLed)
        } else {
            ToastAndroid.show("No Due Report Found!", ToastAndroid.SHORT)
            return
        }
    }

    let totalPaid: number = 0
    let totalDue = 0
    let totalBalance = 0

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
        //                 Customer Ledger
        //             </HeaderImage>
        //         </View>

        //         <View
        //             style={{
        //                 paddingHorizontal: normalize(25),
        //                 paddingBottom: normalize(10),
        //             }}>
        //             <Searchbar
        //                 style={{
        //                     backgroundColor: '#e2e2e2',
        //                     color: theme.colors.purple,
        //                 }}
        //                 placeholder="Mobile Number"
        //                 onChangeText={onChangeSearch}
        //                 value={search}
        //                 elevation={search && 2}
        //                 // loading={search ? true : false}
        //                 autoFocus
        //                 keyboardType="phone-pad"
        //                 maxLength={10}
        //             />
        //         </View>

        //         <View
        //             style={{
        //                 paddingHorizontal: normalize(20),
        //                 paddingBottom: normalize(10),
        //             }}>
        //             <ButtonPaper
        //                 onPress={handleGetCustomerLedger}
        //                 mode="contained-tonal"
        //                 buttonColor={'#008181'}
        //                 textColor={theme.colors.onPurple}
        //                 loading={isLoading}
        //                 disabled={isDisabled || !search}>
        //                 SUBMIT
        //             </ButtonPaper>
        //         </View>

        //         <SurfacePaper backgroundColor={theme.colors.surface}>
        //             <View style={{ padding: normalize(10) }}>
        //                 <Text variant="bodyMedium">{custLedgerData[0]?.cust_name}</Text>
        //             </View>
        //             {custLedgerData.length>0 && <DataTable>
        //                 <DataTable.Header>
        //                     <DataTable.Title>Recover Date</DataTable.Title>
        //                     <DataTable.Title numeric>Paid</DataTable.Title>
        //                     <DataTable.Title numeric>Due</DataTable.Title>
        //                     <DataTable.Title numeric>Balance</DataTable.Title>
        //                 </DataTable.Header>

        //                 {custLedgerData.map((item, i) => {
        //                     totalPaid += item?.paid_amt
        //                     totalDue += item?.due_amt
        //                     totalBalance += item?.balance

        //                     return (
        //                         <DataTable.Row key={i}>
        //                             <DataTable.Cell>
        //                                 {item?.recover_dt?.toString()}
        //                             </DataTable.Cell>
        //                             <DataTable.Cell numeric>{item?.paid_amt}</DataTable.Cell>
        //                             <DataTable.Cell numeric>{item?.due_amt}</DataTable.Cell>
        //                             <DataTable.Cell numeric>{item?.balance}</DataTable.Cell>
        //                         </DataTable.Row>
        //                     )
        //                 })}
        //             </DataTable>}
        //             {custLedgerData.length>0 &&<View style={{ padding: normalize(10) }}>
        //                 <Text variant="labelMedium" style={{ color: '#008181' }}>
        //                     PAID: {totalPaid} DUE: {totalDue} BAL: {totalBalance}
        //                 </Text>
        //             </View>}
        //         </SurfacePaper>

        //         {custLedgerData.length>0 &&<View
        //             style={{
        //                 paddingHorizontal: normalize(20),
        //                 paddingBottom: normalize(10),
        //             }}>
        //             <ButtonPaper
        //                 icon={"cloud-print-outline"}
        //                 onPress={() =>
        //                     handlePrint(custLedgerData)
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
        Customer Ledger
      </HeaderImage>
    </View>

    <View style={{ paddingHorizontal: normalize(25), paddingBottom: normalize(10) }}>
      <Searchbar
        style={{
          backgroundColor: colorScheme === "dark" ? "#2e2929ff" : "#def0ddff",
          color: theme.colors.purple,
        }}
        placeholder="Mobile Number"
        onChangeText={onChangeSearch}
        value={search}
        elevation={search ? 2 : 0}
        autoFocus
        keyboardType="phone-pad"
        maxLength={10}
      />
    </View>

    <View style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(16) }}>
      <ButtonPaper
        onPress={handleGetCustomerLedger}
        mode="contained-tonal"
                                buttonColor={colorScheme === "dark" ? "#009689" : "#008181"}

        textColor="white"
        loading={isLoading}
        disabled={isDisabled || !search}
        style={{ borderRadius: normalize(8) }}
      >
        SUBMIT
      </ButtonPaper>
    </View>

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
      <View style={{ padding: normalize(10) }}>
        <Text variant="bodyMedium">{custLedgerData[0]?.cust_name}</Text>
      </View>
      {custLedgerData.length > 0 && (
        <DataTable>
          <DataTable.Header style={{ backgroundColor: colorScheme === "dark" ? "#009689" : '#008181', borderRadius: normalize(6) }}>
            <DataTable.Title textStyle={{ color: 'white' }}>Recover Date</DataTable.Title>
            <DataTable.Title textStyle={{ color: 'white' }} numeric>Paid</DataTable.Title>
            <DataTable.Title textStyle={{ color: 'white' }} numeric>Due</DataTable.Title>
            <DataTable.Title textStyle={{ color: 'white' }} numeric>Balance</DataTable.Title>
          </DataTable.Header>
          {custLedgerData.map((item, i) => {
            totalPaid += item?.paid_amt;
            totalDue += item?.due_amt;
            totalBalance += item?.balance;
            return (
              <DataTable.Row key={i}>
                <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }}>
                  {item?.recover_dt?.toString()}
                </DataTable.Cell>
                <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }} numeric>{item?.paid_amt}</DataTable.Cell>
                <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }} numeric>{item?.due_amt}</DataTable.Cell>
                <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }} numeric>{item?.balance}</DataTable.Cell>
              </DataTable.Row>
            );
          })}
        </DataTable>
      )}
      {custLedgerData.length > 0 && (
        <View style={{ padding: normalize(10), borderTopWidth: 1, borderTopColor: '#ececf0ff', marginTop: normalize(10) }}>
          <Text
            variant="labelMedium"
            style={{
                                                        color: colorScheme === "dark" ? "#009689" : '#008181',

              fontWeight: '500',
              fontSize: normalize(14),
            }}
          >
            PAID: {totalPaid} DUE: {totalDue} BAL: {totalBalance}
          </Text>
        </View>
      )}
    </SurfacePaper>

    {custLedgerData.length > 0 && (
      <View style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(16) }}>
        <ButtonPaper
          icon="cloud-print-outline"
          onPress={() => handlePrint(custLedgerData)}
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

export default CustomerLedgerScreen

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
    },

    title: {
        textAlign: "center",
    },
})
