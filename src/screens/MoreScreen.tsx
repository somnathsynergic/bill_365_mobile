import { StyleSheet, ScrollView, SafeAreaView, View, useColorScheme } from "react-native"

import { MORE_SCREEN_DATA } from "../data/ui/MORE_SCREEN"
import HeaderImage from "../components/HeaderImage"
import { textureBill, textureBillDark } from "../resources/images"
import { usePaperColorScheme } from "../theme/theme"
import ReportButton from "../components/ReportButton"
import ReportButtonsWrapper from "../components/ReportButtonsWrapper"
import { CommonActions, useNavigation } from "@react-navigation/native"

function MoreScreen() {
  const navigation = useNavigation()
  const theme = usePaperColorScheme()
  const colorScheme = useColorScheme()

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colorScheme === "dark" ? "#000000" : "#f5f9ff" }]}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: "center" }}>
          <HeaderImage
            imgLight={textureBill}
            imgDark={textureBillDark}
            borderRadius={30}
            blur={10}>
            Essentials
          </HeaderImage>
        </View>
        <ReportButtonsWrapper>
          {
            MORE_SCREEN_DATA.map((item, index) => (
              <ReportButton
                key={index}
                text={item.text}
                color={"white"}
                textColor={"#008181"}
                icon={item.icon}
                onPress={() => navigation.dispatch(
                  CommonActions.navigate({
                    name: item.route
                  })
                )
                }
              />
            ))
          }
        </ReportButtonsWrapper>
      </ScrollView>
    </SafeAreaView>
  )
}

export default MoreScreen

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },

  title: {
    textAlign: "center",
  },
})
