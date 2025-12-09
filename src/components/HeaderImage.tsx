import { PropsWithChildren, useContext, useEffect } from "react"
import {
  ImageBackground,
  useColorScheme,
  StyleSheet,
  PixelRatio,
  View,
  Alert,
} from "react-native"
import normalize, { SCREEN_HEIGHT, SCREEN_WIDTH } from "react-native-normalize"
import { IconButton, Text } from "react-native-paper"
import { usePaperColorScheme } from "../theme/theme"
import { CommonActions, useNavigation } from "@react-navigation/native"
import { getMessaging, onMessage, requestPermission } from '@react-native-firebase/messaging';
import messaging from '@react-native-firebase/messaging';
import { AppStoreContext } from "../models/custom_types"
import { AppStore } from "../context/AppContext"
import { logo, logoDark, flower2, flower2Dark } from "../resources/images"
import { Image } from "react-native"

type HeaderImageProps = {
  imgLight: { uri: string }
  imgDark?: { uri: string }
  borderRadius?: number
  blur?: number
  isBackEnabled?: boolean
  isBackCustom?: boolean
  backPressed?: () => void
}

export default function HeaderImage({
  imgLight,
  imgDark,
  borderRadius,
  blur,
  children,
  isBackEnabled,
  isBackCustom = false,
  backPressed,
}: PropsWithChildren<HeaderImageProps>) {
  const colorScheme = useColorScheme()
  const theme = usePaperColorScheme()
    const { handleLogout } = useContext<AppStoreContext>(AppStore)
  
  const navigation = useNavigation()
  useEffect(() => {
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
    Alert.alert('You are logged out due to a new login')
    setTimeout(() => {
    handleLogout()
    }, 1000);
    });
    return unsubscribe;
  }, [navigation]);
 
  return (
    <>
      {isBackEnabled && (
        <View >
          <IconButton
            icon="arrow-left"
            iconColor={'#404198'}
            size={20}
            onPress={
              !isBackCustom
                ? () => navigation.dispatch(CommonActions.goBack())
                : () => backPressed()
            }
            style={{
              position: "absolute",
              top: SCREEN_HEIGHT / 100,
              left: SCREEN_WIDTH / 2.8,
              zIndex: 10,
            }}
          />
        </View>)
}
      {/* )} */}
     
        <View style={styles.surface}>
           <Image
                          source={colorScheme === "dark" ? logoDark : logo}
                          style={{ height: 33, width: 33, marginLeft:8, resizeMode: 'contain' }}
                        />
        <Text
          variant="displaySmall"
          style={{ fontFamily: "ProductSans-small", marginHorizontal: normalize(10),fontWeight:"800", textAlign: "center",fontSize: normalize(18), color: '#404198' }}>
          {children}
        </Text>
        </View>
    </>
  )
}

const styles = StyleSheet.create({
  surface: {
    margin: normalize(2),
    height: SCREEN_HEIGHT / 15,
    marginBottom: normalize(20),
    // borderRadius: normalize(30),
    width: SCREEN_WIDTH / 1.0003,
    // backgroundColor:'#404198',
    backgroundColor:'#ffffff',
    flexDirection: "row",
    alignItems: "center",
     shadowColor: '#000',
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity:  0.4,
        shadowRadius: 3,
        elevation: 5,
  },
})
