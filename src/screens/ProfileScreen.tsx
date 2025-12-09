import {
  View,
  ScrollView,
  StyleSheet,
} from "react-native"
import React, { useContext, useState } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { Text, TouchableRipple } from "react-native-paper"
import normalize from "react-native-normalize"
import HeaderImage from "../components/HeaderImage"
import { flowerHome, flowerHomeDark } from "../resources/images"
import { usePaperColorScheme } from "../theme/theme"
import DialogBox from "../components/DialogBox"
import { loginStorage } from "../storage/appStorage"
import { AppStore } from "../context/AppContext"
import { useIsFocused } from "@react-navigation/native"
import ButtonPaper from "../components/ButtonPaper"
import ProfileSection from "../components/ProfileSection"
import { AppStoreContext } from "../models/custom_types"
import { LoginDataMessage } from "../models/api_types"

export default function ProfileScreen() {
  const isFocused = useIsFocused()
  const theme = usePaperColorScheme()

  const loginStore = JSON.parse(loginStorage.getString("login-data")) as LoginDataMessage

  const { handleLogout } = useContext<AppStoreContext>(AppStore)

  const [visible, setVisible] = useState(() => false)

  const [storeOrUser, setStoreOrUser] = useState(() => true)
  const [btnIdentifier, setBtnIdentifier] = useState<"S" | "U">(() => "S")

  const showDialog = () => setVisible(true)
  const hideDialog = () => setVisible(false)

  const loggingOut = () => {
    handleLogout()
    hideDialog()
  }

  const handleStoreOrUserShow = (id: number) => {
    if (id === 1) {
      setStoreOrUser(true)
      setBtnIdentifier("S")
    } else {
      setStoreOrUser(false)
      setBtnIdentifier("U")
    }
  }

  const tabsStore = [
    { left: "Address:", right: loginStore?.address },
    { left: "Location:", right: loginStore?.branch_address },
    { left: "Outlet Name:", right: loginStore?.branch_name },
    { left: "Proprietor Name:", right: loginStore?.contact_person },
    { left: "Email:", right: loginStore?.email_id },
    { left: "Mobile Number:", right: loginStore?.phone_no },
  ]

  const tabsUser = [
    // { left: "User Name:", right: loginStore?.user_name },
    {
      left: "User Type:",
      right:
        loginStore?.user_type === "M"
          ? "Manager"
          : loginStore?.user_type === "U"
            ? "User"
            : "Admin",
    },
    { left: "User ID:", right: loginStore?.user_id },
    { left: "Mode:", right: loginStore?.mode === "C" ? "Calculator Mode" : "Normal Mode" },
  ]

  return (
    <SafeAreaView
      style={[{ backgroundColor:'#dde6f5ff', height: "100%" }]}>
      <ScrollView>
        <View style={{ alignItems: "center" }}>
          <HeaderImage
            isBackEnabled
            imgLight={flowerHome}
            imgDark={flowerHomeDark}
            borderRadius={30}
            blur={10}>
            My Profile
          </HeaderImage>
        </View>

        <DialogBox
          visible={visible}
          hide={hideDialog}
          onFailure={hideDialog}
          onSuccess={loggingOut}
          title="Logging Out"
          btnSuccess="YES">
          <Text variant="bodyMedium">Are you sure you want to log out?</Text>
        </DialogBox>

        {/* <View style={{ padding: 20 }}>
                    <ButtonPaper icon="logout" mode="text" onPress={showDialog}>
                        LOG OUT
                    </ButtonPaper>
                </View> */}
        <View
          style={{
            gap: 15,
          }}>
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
            }}>
            <TouchableRipple
              style={{
                width: "80%",
                height: normalize(50),
                // backgroundColor: theme.colors.vanillaSecondaryContainer,
                backgroundColor: '#404198',
                paddingHorizontal: normalize(6),
                justifyContent: "center",
                borderRadius: normalize(50),
              }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                <ButtonPaper
                  // textColor={theme.colors.onVanillaSecondaryContainer}
                  textColor={btnIdentifier === "S" ? '#404198':"white"}
                  icon={"storefront-outline"}
                  onPress={() => handleStoreOrUserShow(1)}
                  mode="text"
                  // buttonColor={btnIdentifier === "S" && "#191d0825"}>
                  buttonColor={btnIdentifier === "S" && "white"}>
                  Store Profile
                </ButtonPaper>
                <ButtonPaper
                  textColor={btnIdentifier === "U" ? '#404198':"white"}
                  icon={"account-circle-outline"}
                  onPress={() => handleStoreOrUserShow(2)}
                  mode="text"
                  buttonColor={btnIdentifier === "U" && "white"}>
                  User Profile
                </ButtonPaper>
              </View>
            </TouchableRipple>
          </View>

          <View
            style={{
              alignSelf: "center",
              width: "88%",
            }}>
            {storeOrUser ? (<>
             <Text
                  variant="displaySmall"
                  style={{
                    textAlign: "center",
                    padding: normalize(5),
                    color: '#404198',
                  }}>
                  {loginStore?.company_name}
                </Text>
                <Text style={{fontSize:15, marginVertical:10, marginHorizontal:10, color:'gray'}}>
                Store Location
               </Text>
              <ProfileSection bgColor={'white'} >
               

                {/* <View
                  style={{
                    borderWidth: 1,
                    width: "90%",
                    borderColor: 'black',
                    borderStyle: "dashed",
                    alignSelf: "center"
                  }}></View> */}

                <>
                  {tabsStore?.filter((item,index)=>index<=2).map((i, k) => (
                    <View key={k} style={styles.tabular}>
                      <Text style={{ color: '#404198',fontWeight:'bold', fontSize: 15}} variant="bodyMedium">{i.left}</Text>
                      <Text
                        variant="bodyMedium"
                        style={{ flex: 0.6, textAlign: "right", color:'gray',fontSize: 15}}>
                        {i.right}
                      </Text>
                    </View>
                  ))}


                </>

                {/* <View style={{ justifyContent: "center", alignItems: "center", paddingBottom: normalize(5) }}>
                                            <ButtonPaper
                                                textColor={theme.colors.teal} icon="circle-edit-outline" mode="text" onPress={() => console.log("EDITT PRF.")}>Edit</ButtonPaper>
                                        </View> */}
              </ProfileSection>
               <Text style={{fontSize:15, marginTop:10, marginHorizontal:10, color:'gray'}}>
                Store Credentials
               </Text>
              <View style={{marginVertical:10}}>
               <ProfileSection  bgColor={'white'}  >
               
              

                <View>
                  {tabsStore?.filter((item,index)=>index>2).map((i, k) => (
                    <View key={k} style={styles.tabular}>
                      <Text style={{ color: '#404198',fontWeight:'bold', fontSize: 15}} variant="bodyMedium">{i.left}</Text>
                      <Text
                        variant="bodyMedium"
                        style={{ flex: 0.6, textAlign: "right", color:'gray',fontSize: 15}}>
                        {i.right}
                      </Text>
                    </View>
                  ))}

                  
                </View>

                {/* <View style={{ justifyContent: "center", alignItems: "center", paddingBottom: normalize(5) }}>
                                            <ButtonPaper
                                                textColor={theme.colors.teal} icon="circle-edit-outline" mode="text" onPress={() => console.log("EDITT PRF.")}>Edit</ButtonPaper>
                                        </View> */}
              </ProfileSection>
              </View>
              </>
            ) : (<>
              <Text
                    variant="displaySmall"
                    style={{
                      textAlign: "center",
                      padding: normalize(5),
                      color: '#404198',
                    }}>
                    {loginStore?.user_name}
                  </Text>
              <ProfileSection bgColor={'white'}>
              

                <View
                  style={{
                    justifyContent: "space-between",
                  }}>
                  <View>
                    {tabsUser?.map((i, k) => (
                      <View key={k} style={styles.tabular}>
                        <Text style={{ color: '#404198',fontWeight:'bold',fontSize: 15}} variant="bodyMedium">{i.left}</Text>
                        <Text
                          variant="bodyMedium"
                          style={{ flex: 0.6, textAlign: "right", color:'gray',fontSize: 15}}>
                          {i.right}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* <View style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: normalize(5) }}>
                                                <ButtonPaper
                                                    textColor={theme.colors.teal} icon="circle-edit-outline" mode="text" onPress={() => console.log("EDITT PRF.")}>Edit</ButtonPaper>
                                            </View> */}
                </View>
              </ProfileSection>
          </>  )}
          </View>

          <View
            style={{
              alignSelf: "center",
              width: "85%",
              paddingBottom: normalize(10),
            }}>
            <ButtonPaper
              icon="logout"
              mode="elevated"
              // buttonColor={'#A72608'}
              buttonColor={'white'}
              onPress={showDialog}
              textColor={'#A72608'}>
              LOG OUT
            </ButtonPaper>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  tabular: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: normalize(10),
  },
})
