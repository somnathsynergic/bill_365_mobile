import { StyleSheet, ScrollView, SafeAreaView, View, Linking, useColorScheme } from "react-native"
import { SETTINGS_SCREEN_DATA } from "../data/ui/SETTINGS_SCREEN"
import HeaderImage from "../components/HeaderImage"
import { flowerSetting, flowerSettingDark } from "../resources/images"
import normalize from "react-native-normalize"
import ReportButtonsWrapper from "../components/ReportButtonsWrapper"
import ReportButton from "../components/ReportButton"
import { usePaperColorScheme } from "../theme/theme"
import { CommonActions, useNavigation } from "@react-navigation/native"

function SettingsScreen() {
  const navigation = useNavigation()
  const theme = usePaperColorScheme()
  const colorScheme = useColorScheme()

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colorScheme === "dark" ? "#000000" : "#f5f9ff" }]}>
      <ScrollView>
        <View style={{ alignItems: "center" }}>
          <HeaderImage
            imgLight={flowerSetting}
            imgDark={flowerSettingDark}
            borderRadius={30}
            blur={10}>
            Settings
          </HeaderImage>
        </View>
        <ReportButtonsWrapper>
          {
            SETTINGS_SCREEN_DATA.map((item, index) => (
              <ReportButton
                key={index}
                text={item.text}
                color={colorScheme === "dark" ? "#2e2929ff" : "#ffffff"}
                textColor={"#008181"}
                icon={item.icon}
                onPress={() => navigation.dispatch(
                  CommonActions.navigate({
                    name: item.route
                  })
                )}
              />
            ))
          }
        </ReportButtonsWrapper>
      </ScrollView>
    </SafeAreaView>
  )
}

export default SettingsScreen

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  title: {
    textAlign: "center",
  },
  fabStyle: {
    bottom: normalize(16),
    right: normalize(16),
    position: "absolute",
  },
})
