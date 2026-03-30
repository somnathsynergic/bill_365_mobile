import { StyleSheet, ScrollView, SafeAreaView, View } from "react-native"

import { REPORT_SCREEN_DATA, REPORT_SCREEN_DATA_INV_OFF } from "../data/ui/REPORTS_SCREEN"
import HeaderImage from "../components/HeaderImage"
import { blurReport, blurReportDark } from "../resources/images"
import { usePaperColorScheme } from "../theme/theme"
import ReportButton from "../components/ReportButton"
import ReportButtonsWrapper from "../components/ReportButtonsWrapper"
import { CommonActions, useNavigation } from "@react-navigation/native"
import navigationRoutes from "../routes/navigationRoutes"
import { useContext } from "react"
import { AppStore } from "../context/AppContext"
import { AppStoreContext } from "../models/custom_types"
import { useColorScheme } from "react-native"

function ReportsScreen() {
  const navigation = useNavigation()
  const theme = usePaperColorScheme()
  const colorScheme = useColorScheme()

  const { receiptSettings } = useContext<AppStoreContext>(AppStore)

  const filteredReportScreenData = receiptSettings?.stock_flag === "N" ?REPORT_SCREEN_DATA_INV_OFF.filter(item => {
    if (item.route === navigationRoutes.gstStatementReportScreen || item.route === navigationRoutes.gstSummaryReportScreen) {
      return receiptSettings?.gst_flag === "Y"
    }
    return true
  }):REPORT_SCREEN_DATA.filter(item => {if (item.route === navigationRoutes.gstStatementReportScreen || item.route === navigationRoutes.gstSummaryReportScreen) {
      return receiptSettings?.gst_flag === "Y"
    }
    return true
  })

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colorScheme === "dark" ? "#000000" : "#f5f9ff" }]}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: "center" }}>
          <HeaderImage
            imgLight={blurReport}
            imgDark={blurReportDark}
            borderRadius={10}
            blur={10}>
            My Reports
          </HeaderImage>
        </View>
        <ReportButtonsWrapper>
          {
            filteredReportScreenData.map((item, index) => {
              return (
                <ReportButton
                  key={index}
                  text={item?.text}
                  // color={index % 2 === 0 ? "#008181" : "white"}
                  color={ colorScheme === "dark" ? "#2e2929ff" : "white"}
                  // textColor={index % 2 === 0 ? "white" : "#008181"}
                  textColor={"#008181"}
                  icon={item?.icon}
                  onPress={() =>
                    navigation.dispatch(
                      CommonActions.navigate({
                        name: item?.route
                      }),
                    )
                  }
                />
              )
            })
          }
        </ReportButtonsWrapper>
      </ScrollView>
    </SafeAreaView>
  )
}

export default ReportsScreen

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },

  title: {
    textAlign: "center",
  },
})
