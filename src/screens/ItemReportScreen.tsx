import {
  StyleSheet,
  ScrollView,
  SafeAreaView,
  View,
  ToastAndroid,
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
import { ItemReportCredentials, ItemReportData } from "../models/api_types"
import SurfacePaper from "../components/SurfacePaper"
import { useBluetoothPrint } from "../hooks/printables/useBluetoothPrint"
import useItemReport from "../hooks/api/useItemReport"
import { useIsFocused } from "@react-navigation/native"

function ItemReportScreen() {
  const isFocused = useIsFocused()
  const theme = usePaperColorScheme()

  const loginStore = JSON.parse(loginStorage.getString("login-data"))

  const { fetchItemReport } = useItemReport()
  const { printItemReport } = useBluetoothPrint()

  const [itemReport, setItemReport] = useState<ItemReportData[]>(() => [])

  const [fromDate, setFromDate] = useState(() => new Date())
  const [toDate, setToDate] = useState(() => new Date())
  const [openFromDate, setOpenFromDate] = useState(() => false)
  const [openToDate, setOpenToDate] = useState(() => false)

  const [isLoading, setIsLoading] = useState(() => false)
  const [isDisabled, setIsDisabled] = useState(() => false)

  const formattedFromDate = formattedDate(fromDate)
  const formattedToDate = formattedDate(toDate)

  const handleGetItemReport = async () => {
    const creds: ItemReportCredentials = {
      comp_id: loginStore.comp_id,
      br_id: loginStore.br_id,
      from_date: formattedFromDate,
      to_date: formattedToDate,
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
    await fetchItemReport(creds)
      .then(res => {
        setItemReport(res?.data)
        console.log("XXXXXXXXXXXXXXXXX", res?.data)
      })
      .catch(err => {
        ToastAndroid.show("Error fetching item report.", ToastAndroid.SHORT)
      })
    setIsDisabled(false)
    setIsLoading(false)
  }

  const handlePrint = (itemReport: ItemReportData[]) => {
    if (itemReport.length !== 0) {
      printItemReport(itemReport, formattedFromDate, formattedToDate)
    } else {
      ToastAndroid.show("No Report Found!", ToastAndroid.SHORT)
      return
    }
  }

  let totalNetAmount: number = 0
  let totalQty: number = 0

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: "center" }}>
          <HeaderImage
            isBackEnabled
            imgLight={blurReport}
            imgDark={blurReportDark}
            borderRadius={30}
            blur={10}>
            Item Report
          </HeaderImage>
        </View>
        <View
          style={{
            padding: normalize(10),
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
          }}>
          <ButtonPaper
            textColor={'#404198'}
            onPress={() => setOpenFromDate(true)}
            mode="text">
            FROM: {fromDate?.toLocaleDateString("en-GB")}
          </ButtonPaper>
          <ButtonPaper
            textColor={'#404198'}
            onPress={() => setOpenToDate(true)}
            mode="text">
            TO: {toDate?.toLocaleDateString("en-GB")}
          </ButtonPaper>

          <DatePicker
            modal
            mode="date"
            // minimumDate={toDate.setMonth(toDate.getMonth() - 1)}
            open={openFromDate}
            date={fromDate}
            onConfirm={date => {
              setOpenFromDate(false)
              setFromDate(date)
            }}
            onCancel={() => {
              setOpenFromDate(false)
            }}
          />
          <DatePicker
            modal
            mode="date"
            open={openToDate}
            date={toDate}
            onConfirm={date => {
              setOpenToDate(false)
              setToDate(date)
            }}
            onCancel={() => {
              setOpenToDate(false)
            }}
          />
        </View>

        <View
          style={{
            paddingHorizontal: normalize(20),
            paddingBottom: normalize(10),
          }}>
          <ButtonPaper
            onPress={() =>
              handleGetItemReport()
            }
            mode="contained-tonal"
            buttonColor={'#404198'}
            textColor={theme.colors.onPurple}
            loading={isLoading}
            disabled={isDisabled}>
            SUBMIT
          </ButtonPaper>
        </View>

        {itemReport.length>0 && <SurfacePaper backgroundColor={theme.colors.surface}>
          <DataTable>
            <DataTable.Header style={{backgroundColor:
              '#404198'
            }}>
              <DataTable.Title textStyle={{color:'white'}}>Sl. No.</DataTable.Title>
              {/* <DataTable.Title>ID</DataTable.Title> */}
              <DataTable.Title textStyle={{color:'white'}}>Item</DataTable.Title>
              <DataTable.Title textStyle={{color:'white'}} numeric>Qty.</DataTable.Title>
              <DataTable.Title textStyle={{color:'white'}} numeric>Price</DataTable.Title>
            </DataTable.Header>

            {itemReport.map((item, i) => {
              totalNetAmount += item?.price
              totalQty += item?.qty

              return (
                <DataTable.Row key={i} >
                  <DataTable.Cell >
                    {i + 1}
                  </DataTable.Cell>
                  {/* <DataTable.Cell>
                    {item?.item_id}
                  </DataTable.Cell> */}
                  <DataTable.Cell>
                    {item?.item_name}
                  </DataTable.Cell>
                  <DataTable.Cell numeric>{item?.qty}</DataTable.Cell>
                  <DataTable.Cell numeric>{item?.price}</DataTable.Cell>
                </DataTable.Row>
              )
            })}
          </DataTable>
          <View style={{ padding: normalize(10) }}>
            <Text variant="labelMedium" style={{ color: '#401298' }}>
              QUANTITY: {totalQty} TOTAL: ₹{totalNetAmount?.toFixed(2)}
            </Text>
          </View>
        </SurfacePaper>}


         {itemReport.length>0 &&<View
          style={{
            paddingHorizontal: normalize(20),
            paddingBottom: normalize(10),
          }}>
          <ButtonPaper
          buttonColor={theme.colors.primaryContainer}
            textColor={theme.colors.onPrimaryContainer}
            icon={"cloud-print-outline"}
            onPress={() => handlePrint(itemReport)}
            mode="contained-tonal">
            PRINT
          </ButtonPaper>
        </View>}
      </ScrollView>
    </SafeAreaView>
  )
}

export default ItemReportScreen

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },

  title: {
    textAlign: "center",
  },
})
