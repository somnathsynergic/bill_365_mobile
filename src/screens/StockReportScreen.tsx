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
import ButtonPaper from "../components/ButtonPaper"
import { useContext, useState } from "react"
import normalize from "react-native-normalize"
import { loginStorage } from "../storage/appStorage"
import {
  StockReportCredentials,
  StockReportResponse,
} from "../models/api_types"
import SurfacePaper from "../components/SurfacePaper"
import { useBluetoothPrint } from "../hooks/printables/useBluetoothPrint"
import { useIsFocused } from "@react-navigation/native"
import useStockReport from "../hooks/api/useStockReport"
import { AppStore } from "../context/AppContext"
import { AppStoreContext } from "../models/custom_types"

function StockReportScreen() {
  const isFocused = useIsFocused()
  const theme = usePaperColorScheme()
    const colorScheme = useColorScheme()

  const loginStore = JSON.parse(loginStorage.getString("login-data"))

  const { receiptSettings } = useContext<AppStoreContext>(AppStore)
  const { fetchStockReport } = useStockReport()
  const { printStockReport } = useBluetoothPrint()

  const [stockReport, setStockReport] = useState<StockReportResponse[]>(
    () => [],
  )

  const [isLoading, setIsLoading] = useState(() => false)
  const [isDisabled, setIsDisabled] = useState(() => false)

  const handleGetStockReport = async () => {
    setIsDisabled(true)
    setIsLoading(true)
    let stockReportCredsObject: StockReportCredentials = {
      br_id: loginStore?.br_id,
      comp_id: loginStore?.comp_id,
    }
    await fetchStockReport(stockReportCredsObject)
      .then(res => {
        setStockReport(res)
        console.log("XXXXXXXXXXXXXXXXX", res)
      })
      .catch(err => {
        ToastAndroid.show("Error fetching stock report.", ToastAndroid.SHORT)
      })
    setIsDisabled(false)
    setIsLoading(false)
  }

  const handlePrint = (stockReport: StockReportResponse[]) => {
    if (stockReport.length !== 0) {
      printStockReport(stockReport)
    } else {
      ToastAndroid.show("No Report Found!", ToastAndroid.SHORT)
      return
    }
  }

  let totalGrossStock: number = 0
  let totalQty: number = 0

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
    //         Stock Report
    //       </HeaderImage>
    //     </View>

    //     {receiptSettings?.stock_flag === "Y" ? (
    //       <>
    //         <View
    //           style={{
    //             paddingHorizontal: normalize(20),
    //             paddingBottom: normalize(10),
    //           }}>
    //           <ButtonPaper
    //             onPress={handleGetStockReport}
    //             mode="contained-tonal"
    //             buttonColor={'#008181'}
    //             textColor={'white'}
    //             loading={isLoading}
    //             disabled={isDisabled}>
    //             Generate Report
    //           </ButtonPaper>
    //         </View>

    //         {stockReport.length>0 && <SurfacePaper backgroundColor={theme.colors.surface}>
    //           <DataTable>
    //             <DataTable.Header style={{ backgroundColor: '#008181'}}>
    //               <DataTable.Title textStyle={{color:'white'}}>Product</DataTable.Title>
    //               <DataTable.Title textStyle={{color:'white'}} numeric>Stock</DataTable.Title>
    //             </DataTable.Header>

    //             {stockReport.map((item, i) => {
    //               // totalNetAmount += item?.amount
    //               totalQty += 1
    //               totalGrossStock += item?.stock

    //               return (
    //                 <DataTable.Row key={i}>
    //                   <DataTable.Cell>{item?.item_name}</DataTable.Cell>
    //                   <DataTable.Cell numeric>{item?.stock}</DataTable.Cell>
    //                 </DataTable.Row>
    //               )
    //             })}
    //           </DataTable>
    //           <View style={{ padding: normalize(10) }}>
    //             <Text
    //               variant="labelMedium"
    //               style={{ color: '#008181' }}>
    //               QUANTITY: {totalQty} TOTAL STOCK: {totalGrossStock}
    //             </Text>
    //           </View>
    //         </SurfacePaper>}

    //         {stockReport.length>0 &&<View
    //           style={{
    //             paddingHorizontal: normalize(20),
    //             paddingBottom: normalize(10),
    //           }}>
    //           <ButtonPaper
    //             icon={"cloud-print-outline"}
    //             onPress={() => handlePrint(stockReport)}
    //             mode="contained-tonal"
    //              buttonColor={theme.colors.primaryContainer}
    //         textColor={theme.colors.onPrimaryContainer}
    //             >
    //             PRINT
    //           </ButtonPaper>
    //         </View>}
    //       </>
    //     ) : (
    //       <SurfacePaper
    //         backgroundColor={theme.colors.pinkContainer}
    //         elevation={2}
    //         paddingEnabled
    //         smallWidthEnabled
    //         style={{ padding: 15 }}>
    //         <Text
    //           variant="titleLarge"
    //           style={{
    //             alignSelf: "center",
    //             textAlign: "center",
    //             color: theme.colors.onPinkContainer,
    //           }}>
    //           Inventory is off. Allow Inventory from Settings to use this
    //           feature.
    //         </Text>
    //       </SurfacePaper>
    //     )}
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
        Stock Report
      </HeaderImage>
    </View>

    {receiptSettings?.stock_flag === "Y" ? (
      <>
        <View style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(16) }}>
          <ButtonPaper
            onPress={handleGetStockReport}
            mode="contained-tonal"
                                buttonColor={colorScheme === "dark" ? "#009689" : '#008181'}

            textColor="white"
            loading={isLoading}
            disabled={isDisabled}
            style={{ borderRadius: normalize(8) }}
          >
            Generate Report
          </ButtonPaper>
        </View>

        {stockReport.length > 0 && (
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
              <DataTable.Header style={{ backgroundColor: colorScheme === "dark" ? "#009689" : '#008181', borderRadius: normalize(6) }}>
                <DataTable.Title textStyle={{ color: 'white' }}>Product</DataTable.Title>
                <DataTable.Title textStyle={{ color: 'white' }} numeric>Stock</DataTable.Title>
              </DataTable.Header>
              {stockReport.map((item, i) => {
                totalQty += 1;
                totalGrossStock += item?.stock;
                return (
                  <DataTable.Row key={i}>
                    <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }}>{item?.item_name}</DataTable.Cell>
                    <DataTable.Cell textStyle={{ fontSize: normalize(14), fontWeight: '500' }} numeric>{item?.stock}</DataTable.Cell>
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
                QUANTITY: {totalQty} TOTAL STOCK: {totalGrossStock}
              </Text>
            </View>
          </SurfacePaper>
        )}

        {stockReport.length > 0 && (
          <View style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(16) }}>
            <ButtonPaper
              icon="cloud-print-outline"
              onPress={() => handlePrint(stockReport)}
              mode="contained-tonal"
                                  buttonColor={colorScheme === "dark" ? "#009689" : '#008181'}

              textColor="white"
              style={{ borderRadius: normalize(8) }}
            >
              PRINT
            </ButtonPaper>
          </View>
        )}
      </>
    ) : (
      <SurfacePaper
        backgroundColor={theme.colors.pinkContainer}
        elevation={2}
        paddingEnabled
        smallWidthEnabled
        style={{ padding: 15, marginHorizontal: normalize(16), borderRadius: normalize(8) }}
      >
        <Text
          variant="titleLarge"
          style={{
            alignSelf: "center",
            textAlign: "center",
            color: theme.colors.onPinkContainer,
          }}
        >
          Inventory is off. Allow Inventory from Settings to use this feature.
        </Text>
      </SurfacePaper>
    )}
  </ScrollView>
</SafeAreaView>

  )
}

export default StockReportScreen

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },

  title: {
    textAlign: "center",
  },
})
