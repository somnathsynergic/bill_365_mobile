import {
  StyleSheet,
  ScrollView,
  SafeAreaView,
  View,
  ToastAndroid,
  RefreshControl,
  Alert,
  Linking,
  Animated,
  Image,
  TouchableOpacity,
  useColorScheme
} from "react-native"
import React, { useCallback, useContext, useEffect, useState } from "react"
import SplashScreen from "react-native-splash-screen"
import AnimatedFABPaper from "../components/AnimatedFABPaper"
import {
  ActivityIndicator,
  Button,
  Dialog,
  List,
  MD2Colors,
  Portal,
  SegmentedButtons,
  Text,
  TouchableRipple,
} from "react-native-paper"
import { usePaperColorScheme } from "../theme/theme"
import HeaderImage from "../components/HeaderImage"
import { logo, logoDark, flower2, flower2Dark } from "../resources/images"

import {
  flowerGlass,
  flowerGlassDark,
  flowerHome,
  flowerHomeDark,
  hills,
  hillsDark,
} from "../resources/images"
import navigationRoutes from "../routes/navigationRoutes"
import {
  CommonActions,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native"
import SurfacePaper from "../components/SurfacePaper"
import DialogBox from "../components/DialogBox"
import normalize, { SCREEN_HEIGHT, SCREEN_WIDTH } from "react-native-normalize"
import ScrollableListContainer from "../components/ScrollableListContainer"
import { fileStorage, loginStorage } from "../storage/appStorage"
import { CalculatorShowBillData, LoginData, LoginDataMessage, ReceiptSettingsData, RecentBillsData, ShowBillData } from "../models/api_types"
import { AppStore } from "../context/AppContext"
import useBillSummary from "../hooks/api/useBillSummary"
import useRecentBills from "../hooks/api/useRecentBills"
import useShowBill from "../hooks/api/useShowBill"
import useCalculatorShowBill from "../hooks/api/useCalculatorShowBill"
import AddedProductList from "../components/AddedProductList"
import NetTotalForRePrints from "../components/NetTotalForRePrints"
import { useBluetoothPrint } from "../hooks/printables/useBluetoothPrint"
import useVersionCheck from "../hooks/api/useVersionCheck"
import DeviceInfo from "react-native-device-info"
import ButtonPaper from "../components/ButtonPaper"
import useCancelBill from "../hooks/api/useCancelBill"
import useCalculations from "../hooks/useCalculations"
import DialogBoxForReprint from "../components/DialogBoxForReprint"
import DialogForBillsInCalculatorMode from "../components/DialogForBillsInCalculatorMode"
import { AppStoreContext } from "../models/custom_types"
import useReceiptSettings from "../hooks/api/useReceiptSettings"
import { Card } from 'react-native-paper';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { BASE_URL_CATEGORY_IMG } from "../config/config"

function HomeScreen() {
  const theme = usePaperColorScheme()
  const navigation = useNavigation()
  const isFocused = useIsFocused()
  const colorScheme = useColorScheme()
  let version = DeviceInfo.getVersion()

  const { handleGetReceiptSettings } = useContext<AppStoreContext>(AppStore)
  const { fetchReceiptSettings } = useReceiptSettings()

  const { fetchBillSummary } = useBillSummary()
  const { fetchRecentBills } = useRecentBills()
  const { fetchBill } = useShowBill()
  const { fetchVersionInfo } = useVersionCheck()
  const { rePrint, rePrintWithoutGst, printDuplicateBillCalculateMode } = useBluetoothPrint()
  const { cancelBill } = useCancelBill()
  const { fetchCalcBill } = useCalculatorShowBill()
  const {
    grandTotalCalculate,
    grandTotalWithGSTCalculate,
    grandTotalWithGSTInclCalculate,
  } = useCalculations()

  const loginStore = JSON.parse(loginStorage.getString("login-data")) as LoginDataMessage
  // let loginStore

  // try {
  //   const loginData = loginStorage.getString("login-data")

  //   loginStore = loginData ? JSON.parse(loginData) : {}
  // } catch (error) {
  //   console.error("Failed to parse login-data:", error)
  //   loginStore = {}
  // }
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettingsData>()
  // ]
  const [isExtended, setIsExtended] = useState<boolean>(() => true)

  const [totalBills, setTotalBills] = useState<number | undefined>(
    () => undefined,
  )
  const [amountCollected, setAmountCollected] = useState<number | undefined>(
    () => undefined,
  )
  const [recentBills, setRecentBills] = useState<RecentBillsData[]>(() => [])
  const [billedSaleData, setBilledSaleData] = useState<ShowBillData[]>(() => [])
  const [currentReceiptNo, setCurrentReceiptNo] = useState<number | undefined>(
    () => undefined,
  )
  const [cust_sl_flag, setCust_sl_flag] = useState<"Y" | "N">()
  const [cancelledBillStatus, setCancelledBillStatus] = useState<"Y" | "N">()
  const [gstFlag, setGstFlag] = useState<"Y" | "N">()
  const [gstType, setGstType] = useState<"I" | "E">()
  const [loading, setLoading] = useState<boolean>(() => false)
  const [refreshing, setRefreshing] = useState<boolean>(() => false)
  const [updateUrl, setUpdateUrl] = useState<string>()

  const [visible, setVisible] = useState<boolean>(() => false)
  const hideDialog = () => setVisible(() => false)

  const [visible2, setVisible2] = useState<boolean>(() => false)
  const hideDialog2 = () => setVisible2(() => false)

  const [visibleUpdatePortal, setVisibleUpdatePortal] = useState<boolean>(
    () => false,
  )
  const [versionNumber, setVersionNumber] = useState<string>(() => "")
  const [calculatorModeBillArray, setCalculatorModeBillArray] = useState<CalculatorShowBillData[]>(() => [])

  const showDialogForAppUpdate = () => setVisibleUpdatePortal(true)
  const hideDialogForAppUpdate = () => setVisibleUpdatePortal(false)

  let today = new Date()
  let year = today.getFullYear()
  let month = ("0" + (today.getMonth() + 1)).slice(-2)
  let day = ("0" + today.getDate()).slice(-2)
  let formattedDate = year + "-" + month + "-" + day

  // let netTotal = 0
  // let totalDiscount = 0

  useEffect(() => {
    SplashScreen.hide()

    return () => SplashScreen.hide()
  }, [])

    const urlToBase64 = async (url) => {
      const response = await fetch(url);
      const blob = await response.blob();
  
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  
   
    
  const handleGetReceiptSettingsForHome = async () => {
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    console.log(loginStore,'loginstore')
    fileStorage.set('logo',loginStore.logo)
     urlToBase64(BASE_URL_CATEGORY_IMG+loginStore.comp_picture)
        .then(base64 => {
          console.log('base64=====', base64);
        fileStorage.set('comp_picture',base64.toString())

           // "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
        });
    const companyId = loginStore.comp_id
    await fetchReceiptSettings(companyId)
      .then(res => {
        setReceiptSettings(res[0])
        console.log("receiptSettingsData", res[0])
      })
      .catch(err => {
        ToastAndroid.show(
          "Error fetching Receipt Settings.",
          ToastAndroid.SHORT,
        )
      })
  }
  useEffect(() => {
    handleGetReceiptSettingsForHome()

  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    handleGetReceiptSettings()
    handleGetBillSummary()
    handleGetRecentBills()
    setTimeout(() => {
      setRefreshing(false)
    }, 2000)
  }, [])

  const onScroll = ({ nativeEvent }) => {
    const currentScrollPosition = Math.floor(nativeEvent?.contentOffset?.y) ?? 0

    setIsExtended(currentScrollPosition <= 0)
  }

  const onDialogFailure = () => {
    setVisible(false)
  }

  const onDialogSuccecss = (calculatorMode = false) => {
    setVisible(false)

    if (!calculatorMode) {
      handleRePrintReceipt(false)
    } else {
      handleRePrintReceiptForCalculatorMode()
    }
  }

  const handleRePrintReceipt = (cancelFlag: boolean) => {
    if (billedSaleData.length > 0) {
      gstFlag === "N"
        ? rePrintWithoutGst(
          billedSaleData,
          // netTotal,
          billedSaleData[0]?.tprice,
          // totalDiscount,
          billedSaleData[0]?.tdiscount_amt,
          billedSaleData[0]?.received_amt,
          billedSaleData[0]?.received_amt !== undefined
            ? billedSaleData[0]?.received_amt -
            grandTotalCalculate(billedSaleData[0]?.tprice, billedSaleData[0]?.tdiscount_amt)
            : 0,
          billedSaleData[0]?.cust_name,
          billedSaleData[0]?.phone_no,
          receiptSettings?.custom_sl_flag == 'N' ? billedSaleData[0]?.receipt_no : billedSaleData[0]?.rcpt_sl_no,
          billedSaleData[0]?.pay_mode,
          false,
          false,
          cancelFlag,
        )
        : gstType === "E"
          ? rePrint(
            billedSaleData,
            // netTotal,
            billedSaleData[0]?.tprice,
            // totalDiscount,
            billedSaleData[0]?.tdiscount_amt,
            billedSaleData[0]?.received_amt,
            billedSaleData[0]?.received_amt !== undefined
              ? billedSaleData[0]?.received_amt -
              parseFloat(
                grandTotalWithGSTCalculate(
                  billedSaleData[0]?.tprice,
                  billedSaleData[0]?.tdiscount_amt,
                  billedSaleData[0]?.tcgst_amt * 2,
                ),
              )
              : 0,
            billedSaleData[0]?.cust_name,
            billedSaleData[0]?.phone_no,
            receiptSettings?.custom_sl_flag == 'N' ? billedSaleData[0]?.receipt_no : billedSaleData[0]?.rcpt_sl_no,

            billedSaleData[0]?.pay_mode,
            false,
            false,
            cancelFlag,
          )
          : rePrint(
            billedSaleData,
            // netTotal,
            billedSaleData[0]?.tprice,
            // totalDiscount,
            billedSaleData[0]?.tdiscount_amt,
            billedSaleData[0]?.received_amt,
            billedSaleData[0]?.received_amt !== undefined
              ? billedSaleData[0]?.received_amt -
              parseFloat(
                grandTotalWithGSTInclCalculate(billedSaleData[0]?.tprice, billedSaleData[0]?.tdiscount_amt),
              )
              : 0,
            billedSaleData[0]?.cust_name,
            billedSaleData[0]?.phone_no,
            receiptSettings?.custom_sl_flag == 'N' ? billedSaleData[0]?.receipt_no : billedSaleData[0]?.rcpt_sl_no,

            billedSaleData[0]?.pay_mode,
            false,
            false,
            cancelFlag,
          )
    } else {
      ToastAndroid.show("Something went wrong!", ToastAndroid.SHORT)
      return
    }
  }

  const handleRePrintReceiptForCalculatorMode = () => {
    printDuplicateBillCalculateMode(calculatorModeBillArray).then(() => {
      hideDialog2()
    }).catch(err => {
      ToastAndroid.show("Some error while re-printing in Calculate mode.", ToastAndroid.SHORT)
    })
  }
  useEffect(() => {
    console.log("CALLED GST FLAG HOME SCREEN:", loginStore)
    // fileStorage.set('comp_picture',loginStore.comp_picture)
  }, [])
  const handleGetBillSummary = async () => {
    setLoading(true)
    await fetchBillSummary(
      formattedDate,
      loginStore.comp_id,
      loginStore.br_id,
      loginStore.user_id,
    )
      .then(res => {
        setTotalBills(res?.data[0]?.total_bills)
        setAmountCollected(res?.data[0]?.amount_collected)
        setLoading(false)
      })
      .catch(err => {
        ToastAndroid.show(
          "Check your internet connection or something went wrong in the server.",
          ToastAndroid.SHORT,
        )
        console.log("handleGetBillSummary - HomeScreen", err, formattedDate)
        setLoading(false)

      })
  }

  const handleGetRecentBills = async () => {
    await fetchRecentBills(
      formattedDate,
      loginStore.comp_id,
      loginStore.br_id,
      loginStore.user_id,
    )
      .then(res => {
        console.log(res)
        if (loginStore?.mode == 'N')
          setRecentBills(res.slice(0, 2))
        else {
          setRecentBills(res.slice(0, 2))
        }
      })
      .catch(err => {
        ToastAndroid.show(
          "Error during fetching recent bills.",
          ToastAndroid.SHORT,
        )
      })
  }

  const handleGetVersion = async () => {
    await fetchVersionInfo()
      .then(res => {
        console.log("VERSION INFO:", res?.data[0]?.version_no, version)
        if (parseFloat(res?.data[0]?.version_no) > parseFloat(version)) {
          showDialogForAppUpdate()
          setVersionNumber(version)
          // Alert.alert("UPDATE FOUND!", "Please update your app.")
        }
        setUpdateUrl(res?.data[0]?.url)
      })
      .catch(err => {
        ToastAndroid.show(
          "Error during getting version info.",
          ToastAndroid.SHORT,
        )
      })
  }

  useEffect(() => {
    handleGetBillSummary()
    handleGetRecentBills()
    handleGetVersion()
  }, [isFocused])

  const updateApp = () => {
    Linking.openURL(updateUrl)
  }

  const handleGetBill = async (rcptNo: number) => {
    await fetchBill(rcptNo)
      .then(res => {
        setBilledSaleData(res?.data)
        setCancelledBillStatus(res?.cancel_flag)
        console.log("handleGetBill - HOMESCREEN - fetchBill", res?.data)
      })
      .catch(err => {
        ToastAndroid.show("Error during fetching old bill", ToastAndroid.SHORT)
      })
  }

  const handleGetBillCalculatorMode = async (rcptNo: number) => {
    console.log(rcptNo)
    await fetchCalcBill(rcptNo).then(res => {
      console.log("handleGetBillCalculatorMode - HOMESCREEN - fetchCalcBill", res?.data)
      setCalculatorModeBillArray(res?.data)
    })
  }

  const handleRecentBillListClick = (rcptNo: number) => {
    setVisible(true)
    console.log(rcptNo, 'rcpt_no=======================================')
    handleGetBill(rcptNo)
    setCurrentReceiptNo(rcptNo)
    setGstFlag(billedSaleData[0]?.gst_flag)
    setGstType(billedSaleData[0]?.gst_type)
  }

  const handleBillListClickCalculatorMode = (rcptNo: number) => {
    setVisible2(true)
    console.log(rcptNo, 'rcpt_no=======================================')

    setCurrentReceiptNo(rcptNo)
    handleGetBillCalculatorMode(rcptNo)
  }

  const handleCancellingBill = async (rcptNo: number) => {
    await cancelBill(rcptNo, loginStore.user_id).then(res => {
      if (res?.status === 1) {
        ToastAndroid.show(res?.data, ToastAndroid.SHORT)
        handleRePrintReceipt(true)
        setVisible(false)
      }
    }).catch(err => {
      ToastAndroid.show(`Error occurred during cancelling bill. ${err}`, ToastAndroid.SHORT)
      setVisible(false)
    })

    handleGetBillSummary()
    handleGetRecentBills()
  }

  const handleCancelBill = (rcptNo: number) => {
    Alert.alert(
      "Cancelling Bill",
      `Are you sure you want to cancel this bill?`,
      [
        { text: "BACK", onPress: () => null },
        { text: "CANCEL BILL", onPress: () => handleCancellingBill(rcptNo) },
      ],
      { cancelable: false },
    )
  }

  let totalQty: number = 0

  return (
    //     <SafeAreaView
    //       style={[styles.container, { backgroundColor: "#f5f9ff" }]}>
    //       <ScrollView
    //         onScroll={onScroll}
    //         keyboardShouldPersistTaps="handled"
    //         refreshControl={
    //           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
    //         }>
    //         <View style={{ alignItems: "center", }}>
    //           <HeaderImage
    //             imgLight={hills}
    //             imgDark={hillsDark}
    //             // borderRadius={30}
    //             blur={10}>


    //             {loginStore.company_name}
    //           </HeaderImage>
    //         </View>

    //         <Portal>
    //           <Dialog visible={visibleUpdatePortal} dismissable={false}>
    //             <Dialog.Title>UPDATE FOUND!</Dialog.Title>
    //             <Dialog.Content>
    //               <Text variant="bodyMedium">Please update your app.</Text>
    //             </Dialog.Content>
    //             <Dialog.Actions>
    //               {/* <Button onPress={hideDialog}>Cancel</Button> */}
    //               <Button onPress={updateApp}>Download</Button>
    //             </Dialog.Actions>
    //           </Dialog>
    //         </Portal>
    //         <View style={{ alignItems: "center", marginTop: -10 }}>
    //           <SurfacePaper
    //             borderRadiusEnabled={false}
    //             paddingEnabled
    //             elevation={1}
    //             backgroundColor={theme.colors.peachContainer}
    //             style={{
    //               borderTopRightRadius: normalize(10),
    //               borderBottomRightRadius: normalize(10),
    //               borderTopLeftRadius: normalize(10),
    //               borderBottomLeftRadius: normalize(10),
    //             }}
    //           >
    //             {!loading ? <View style={{ width: "100%", padding: normalize(15) }}>
    //               <View
    //                 style={{
    //                   flexDirection: "row",
    //                   justifyContent: "space-between",
    //                 }}>

    //                 <View style={{ flexDirection: 'column' }}>
    //                   <View
    //                     style={{
    //                       flexDirection: "row",
    //                       justifyContent: "space-between",
    //                     }}>
    //                     <View>
    //                       <Text variant="titleLarge" style={{
    //                         // color: theme.colors.onPeachContainer
    //                         color: "white",
    //                         fontSize: normalize(14)
    //                       }}>Amount Collected</Text>
    //                     </View>

    //                   </View>

    //                   <Text style={{
    //                     color: "white",
    //                     fontSize: 30
    //                   }}>₹{amountCollected || 0}</Text>
    //                 </View>


    //               </View>
    //               {loginStore?.mode == 'N' ? <View
    //                 style={{
    //                   flexDirection: "row",
    //                   justifyContent: "center",
    //                 }}
    //               >

    //                 <View style={{
    //                  marginVertical: 20,  marginHorizontal: 10, flexDirection: 'row', justifyContent: 'center', gap: 20
    //                 }}>

    //                   <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
    //                     <View style={{
    //                       backgroundColor: "white",
    //                       borderRadius: normalize(50),
    //                       height: normalize(45),
    //                       width: normalize(45),
    //                       flexDirection: "column",
    //                       alignItems: "center",

    //                       justifyContent: "center",
    //                     }}>
    //                       <Text style={{
    //                         // color: "#008181",
    //                         color: "#ffcd04",
    //                         textAlign: "center",
    //                         fontSize: normalize(26)

    //                       }}>
    //                         {totalBills || 0}
    //                       </Text>


    //                     </View>
    //                     <Text style={{ color: 'white', fontWeight: 'bold', marginTop: 5 }}>Total Bills</Text>
    //                   </View>
    //                    <TouchableOpacity onPress={() =>  navigation.dispatch(
    //                     CommonActions.navigate({
    //                       name: navigationRoutes.cancelBillScreen,
    //                     }),
    //                   )}>
    //                   <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
    //                     <View style={{
    //                       backgroundColor: "white",
    //                       borderRadius: normalize(50),
    //                       height: normalize(45),
    //                       width: normalize(45),
    //                       flexDirection: "column",
    //                       alignItems: "center",

    //                       justifyContent: "center",
    //                     }}>
    //                       <Text style={{
    //                         color: "#008181",
    //                         textAlign: "center",
    //                         fontSize: normalize(26)

    //                       }}>
    //                         {/* {totalBills || 0} */}
    //                         <MaterialCommunityIcons
    //                           name="cancel"
    //                           // color={'#008181'}
    //                           color={'red'}
    //                           size={26}
    //                         />
    //                       </Text>


    //                     </View>
    //                     <Text style={{ color: 'white', fontWeight: 'bold', marginTop: 5 }}>Cancel Bills</Text>
    //                   </View>
    //                   </TouchableOpacity>
    //                   <TouchableOpacity onPress={() =>  navigation.dispatch(
    //                     CommonActions.navigate({
    //                       name: navigationRoutes.moreScreen,
    //                       params:{}
    //                     }),
    //                   )}>
    //                   <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
    //                     <View style={{
    //                       backgroundColor: "white",
    //                       borderRadius: normalize(50),
    //                       height: normalize(45),
    //                       width: normalize(45),
    //                       flexDirection: "column",
    //                       alignItems: "center",

    //                       justifyContent: "center",
    //                     }}>
    //                       <Text style={{
    //                         color: "#008181",
    //                         textAlign: "center",
    //                         fontSize: normalize(26)

    //                       }}>
    //                         <MaterialCommunityIcons
    //                           name="magnify"
    //                           // color={'#008181'}
    //                           color={'green'}
    //                           size={26}
    //                         />
    //                       </Text>


    //                     </View>
    //                     <Text style={{ color: 'white', fontWeight: 'bold', marginTop: 5 }}>Search Bills</Text>
    //                   </View>
    //                 </TouchableOpacity>

    //                   {/* <View style={{flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
    //                   <View style={{
    //                     backgroundColor: "white",
    //                     borderRadius: normalize(50),
    //                     height: normalize(45),
    //                     width: normalize(45),
    //                     flexDirection: "column",
    //                     alignItems: "center",

    //                     justifyContent: "center",
    //                   }}>
    //                     <Text style={{
    //                     color: "#008181",
    //                     textAlign: "center",
    //                     fontSize: normalize(26)

    //                     }}>
    //                       {totalBills || 0}
    //                     </Text>


    //                     </View>
    //                     <Text style={{color:'white',fontWeight:'bold',marginTop:5}}>Total Bills</Text>
    //                     </View> */}

    //                 </View>

    //               </View>:''}

    //               {/* <View
    //                 style={{
    //                   flexDirection: "row",
    //                   justifyContent: "space-between",
    //                 }}>
    //                 <View>
    //                   <Text variant="titleLarge" style={{
    //                     // color: theme.colors.onPeachContainer
    //                     color: "white",
    //                     fontSize: normalize(16)
    //                   }}>Amount Collected</Text>
    //                 </View>
    //                 <View>
    //                   <Text variant="titleLarge" style={{
    //                     // color: theme.colors.onPeachContainer
    //                     color: "white",
    //                     fontSize: normalize(16)

    //                   }}>₹{amountCollected || 0}</Text>
    //                 </View>
    //               </View> */}
    //             </View> : <ActivityIndicator animating={true} color={MD2Colors.white} style={{ marginTop: 20, marginBottom: 20 }} size={'large'} />}
    //           </SurfacePaper>
    //         </View>
    //         {/* <View style={{ alignItems: "center", marginTop: -10 }}>
    //           <SurfacePaper
    //             // smallWidthEnabled
    //             borderRadiusEnabled={false}
    //             paddingEnabled
    //             // heading="Summary"
    //             elevation={1}
    //             backgroundColor={theme.colors.peachContainer}
    //             style={{
    //               borderTopRightRadius: normalize(10),
    //               borderBottomRightRadius: normalize(10),
    //               borderTopLeftRadius: normalize(10),
    //               borderBottomLeftRadius: normalize(10),
    //             }}
    //             >
    //             {!loading?<View style={{ width: "100%", padding: normalize(15) }}>
    //               <View
    //                 style={{
    //                   flexDirection: "row",
    //                   justifyContent: "space-between",
    //                 }}>
    //                 <View>
    //                   <Text variant="titleLarge" style={{
    //                     // color: theme.colors.onPeachContainer
    //                     color: "white"
    //                   }}>Total Bills</Text>
    //                 </View>
    //                 <View>
    //                   <Text variant="titleLarge" style={{
    //                     color: "#008181",
    //                     backgroundColor: "white",
    //                     borderRadius: normalize(50),
    //                     height: normalize(25),
    //                     width: normalize(25),
    //                     flexDirection: "row",
    //                     alignItems: "center",

    //                     textAlign: "center",
    //                     justifyContent: "center",
    //                     fontSize: normalize(16)
    //                   }}>{totalBills || 0}</Text>
    //                 </View>
    //               </View>
    //               <View
    //                 style={{
    //                   flexDirection: "row",
    //                   justifyContent: "space-between",
    //                 }}>
    //                 <View>
    //                   <Text variant="titleLarge" style={{
    //                     // color: theme.colors.onPeachContainer
    //                     color: "white",
    //                     fontSize: normalize(16)
    //                   }}>Amount Collected</Text>
    //                 </View>
    //                 <View>
    //                   <Text variant="titleLarge" style={{
    //                     // color: theme.colors.onPeachContainer
    //                     color: "white",
    //                     fontSize: normalize(16)

    //                   }}>₹{amountCollected || 0}</Text>
    //                 </View>
    //               </View>
    //             </View>:<ActivityIndicator animating={true} color={MD2Colors.white} style={{ marginTop: 20, marginBottom: 20 }} size={'large'} />}
    //           </SurfacePaper>

    //           {!loading?<SurfacePaper
    //             // smallWidthEnabled
    //             borderRadiusEnabled={false}
    //             paddingEnabled
    //             isBorderEnabled
    //             heading="Recent Bills"
    //             elevation={1}
    //             // backgroundColor={theme.colors.tertiaryContainer}
    //             backgroundColor={"white"}
    //             style={{
    //               borderTopRightRadius: normalize(10),
    //               borderBottomRightRadius: normalize(10),
    //               borderTopLeftRadius: normalize(10),
    //               borderBottomLeftRadius: normalize(10),
    //               color: "#008181",
    //               backgroundColor: "#ffffff",
    //             }}>
    //             <View style={{ width: "100%"}}>
    //               {recentBills?.map((item, i) => (
    //                 <List.Item
    //                   key={i}
    //                   titleStyle={{ color: "#008181", fontWeight: "800" }}
    //                   descriptionStyle={{ color: "black", }}

    //                   title={`Bill  ${receiptSettings?.custom_sl_flag=='N'?item?.receipt_no:item?.rcpt_sl_no}`}
    //                   description={`₹${item?.net_amt}`}
    //                   onPress={() => {
    //                     loginStore?.mode !== "C"
    //                       ? handleRecentBillListClick(item?.receipt_no)
    //                       : handleBillListClickCalculatorMode(item?.receipt_no)
    //                   }
    //                   }
    //                   left={props => <List.Icon style={{ color: "#008181" }} {...props} icon="basket" />}
    //                 // right={props => (
    //                 //   <List.Icon {...props} icon="download" />
    //                 // )}
    //                 />
    //               ))}
    //             </View>
    //             <View>
    //               <Button
    //                 textColor={'#008181'}
    //                 // buttonColor={'#008181'}

    //                 onPress={() =>
    //                   navigation.dispatch(
    //                     CommonActions.navigate({
    //                       name: navigationRoutes.allBillsScreen,
    //                     }),
    //                   )
    //                 }>
    //                 ALL BILLS
    //               </Button>
    //             </View>
    //           </SurfacePaper>:<ActivityIndicator animating={true} color={"#008181"} style={{ marginTop: 20, marginBottom: 20 }} size={'large'} />}
    //         </View> */}
    //         {recentBills.length>0 ?<>
    //         <Text style={{marginHorizontal:15,fontSize:15,color:'#97979eff'}}>Recent Bills</Text>
    //         <View style={styles.container1}>
    //           {recentBills?.map((item, i) => {
    //             const billNo = receiptSettings?.custom_sl_flag === 'N'
    //               ? item?.receipt_no
    //               : item?.rcpt_sl_no;
    //             const dt = new Date(item.trn_date).toLocaleDateString();

    //             return (
    //               <Card
    //                 key={i}
    //                 style={styles.card}
    //                 onPress={() =>
    //                   loginStore?.mode !== 'C'
    //                     ? handleRecentBillListClick(item.receipt_no)
    //                     : handleBillListClickCalculatorMode(item.receipt_no)
    //                 }
    //               >
    //                 <List.Item
    //                   titleStyle={styles.title1}
    //                   descriptionStyle={styles.description}
    //                   title={` ${billNo} `}
    //                   description={`₹ ${item.net_amt} (${dt})`}
    //                   left={props => <List.Icon {...props} icon="receipt" color="#008181" />}
    //                 />
    //               </Card>
    //             );
    //           })}
    //         </View>
    //          {/* {loginStore?.mode == "C" && */}
    //               <Button
    //                 textColor={'#008181'}
    //                 // buttonColor={'#008181'}

    //                 onPress={() =>
    //                   navigation.dispatch(
    //                     CommonActions.navigate({
    //                       name: navigationRoutes.allBillsScreen,
    //                     }),
    //                   )
    //                 }>
    //                 More
    //               </Button>
    //               {/* } */}
    //         </>:
    //         <View style={{marginHorizontal:'auto',flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
    //           <Text style={{color:'#97979eff',margin:'auto'}}>Your recent bills will appear here!</Text>
    //           </View>
    // }

    //       </ScrollView>

    //       <DialogBoxForReprint
    //         iconSize={30}
    //         visible={visible}
    //         hide={hideDialog}
    //         titleStyle={styles.title}

    //         currentReceiptNo={currentReceiptNo}
    //         billedSaleData={billedSaleData}
    //         handleCancelBill={handleCancelBill}
    //         cancelledBillStatus={cancelledBillStatus}

    //         onDialogFailure={onDialogFailure}
    //         onDialogSuccecss={() => onDialogSuccecss()}
    //       />

    //       <DialogForBillsInCalculatorMode
    //         visible={visible2}
    //         hide={hideDialog2}

    //         currentReceiptNumber={currentReceiptNo}
    //         showCalculatedBillData={calculatorModeBillArray}

    //         onDialogFailure={hideDialog2}
    //         onDialogSuccecss={() => onDialogSuccecss(true)}
    //       />

    //       {
    //         loginStore?.mode === "N"
    //           ? <AnimatedFABPaper
    //             icon="plus"
    //             color={"white"}
    //             label="Bill"
    //             onPress={() =>
    //               navigation.dispatch(
    //                 CommonActions.navigate({
    //                   name: navigationRoutes.productsScreen,
    //                 }),
    //               )
    //             }
    //             extended={isExtended}
    //             animateFrom="right"
    //             iconMode="dynamic"

    //             customStyle={styles.fabStyle}
    //           />
    //           : <AnimatedFABPaper
    //             icon="pencil-plus-outline"
    //             color="white"
    //             label="Bill"
    //             onPress={() =>
    //               navigation.dispatch(
    //                 CommonActions.navigate({
    //                   name: navigationRoutes.calculateModeBillScreen,
    //                 }),
    //               )
    //             }
    //             extended={isExtended}
    //             animateFrom="right"
    //             iconMode="dynamic"
    //             customStyle={styles.fabStyle}
    //           />
    //       }


    //       {
    //         loginStore?.mode !== "C" && <>
    //           <AnimatedFABPaper
    //             color={"white"}
    //             variant="tertiary"
    //             icon="apps"
    //             label="Categories"
    //             onPress={() =>
    //               navigation.dispatch(
    //                 CommonActions.navigate({
    //                   name: navigationRoutes.categoriesScreen,
    //                 }),
    //               )
    //             }
    //             extended={isExtended}
    //             animateFrom="left"
    //             iconMode="dynamic"
    //             customStyle={[styles.fabStyle2, { backgroundColor: theme.colors.peachContainer }]}
    //           />
    //         </>
    //       }

    //     </SafeAreaView>
    <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === "dark" ? "#000000" : "#f5f9ff" }]}>
      <ScrollView
        onScroll={onScroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={{ alignItems: "center", marginBottom: normalize(20) }}>
          <View style={{ alignItems: "center", }}>
            <HeaderImage
              imgLight={hills}
              imgDark={hillsDark}
              borderRadius={30}
              blur={10}>


              {loginStore.company_name}
            </HeaderImage>
          </View>
        </View>

        <Portal>
          <Dialog visible={visibleUpdatePortal} dismissable={false}>
            <Dialog.Title>UPDATE FOUND!</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">Please update your app.</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={updateApp}>Download</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: -20, marginRight: normalize(20) }}>
           <Text style={{ color: colorScheme === "dark" ? "#5e5d5dff" : "#000000" }}>V:{version}</Text>
        </View>
        <View style={{ alignItems: "center", paddingHorizontal: normalize(16) }}>
       
          <SurfacePaper
            borderRadiusEnabled={false}
            paddingEnabled
            elevation={1}
            backgroundColor={colorScheme === "dark" ? "#009689" : "#008181"}
            style={{
              borderRadius: normalize(10),
              padding: normalize(15),
              width: '100%',
              marginBottom: normalize(20),
            }}
          >
            {!loading ? (
              <View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View>
                    <Text variant="titleLarge" style={{ color: "white", fontSize: normalize(14) }}>
                      Amount Collected  
                    </Text>
                    <Text style={{ color: "white", fontSize: 30 }}>₹{amountCollected || 0}</Text>
                  </View>
                </View>
                {loginStore?.mode == 'N' && (
                  <View style={{ flexDirection: "row", justifyContent: "center", gap: 20, marginVertical: 20 }}>
                    <View style={{ alignItems: 'center' }}>
                      <View style={{
                        backgroundColor: "white",
                        borderRadius: normalize(50),
                        height: normalize(45),
                        width: normalize(45),
                        justifyContent: "center",
                        alignItems: "center",
                      }}>
                        <Text style={{ color: "#ffcd04", fontSize: normalize(26) }}>
                          {totalBills || 0}
                        </Text>
                      </View>
                      <Text style={{ color: 'white', fontWeight: 'bold', marginTop: 5 }}>Total Bills</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.dispatch(
  CommonActions.navigate({
    name: 'More',
    params: { screen: 'MoreScreen' },
  })
)
                    }>
                      <View style={{ alignItems: 'center' }}>
                        <View style={{
                          backgroundColor: "white",
                          borderRadius: normalize(50),
                          height: normalize(45),
                          width: normalize(45),
                          justifyContent: "center",
                          alignItems: "center",
                        }}>
                          <MaterialCommunityIcons name="cancel" color="red" size={26} />
                        </View>
                        <Text style={{ color: 'white', fontWeight: 'bold', marginTop: 5 }}>Cancel Bills</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity  onPress={() => navigation.dispatch(
  CommonActions.navigate({
    name: 'More',
    params: { screen: 'MoreScreen' },
  })
)

                    }>
                      <View style={{ alignItems: 'center' }}>
                        <View style={{
                          backgroundColor: "white",
                          borderRadius: normalize(50),
                          height: normalize(45),
                          width: normalize(45),
                          justifyContent: "center",
                          alignItems: "center",
                        }}>
                          <MaterialCommunityIcons name="magnify" color="green" size={26} />
                        </View>
                        <Text style={{ color: 'white', fontWeight: 'bold', marginTop: 5 }}>Search Bills</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <ActivityIndicator animating={true} color="white" size="large" style={{ margin: 20 }} />
            )}
          </SurfacePaper>

          {recentBills.length > 0 ? (
            <>
              <Text style={{ marginHorizontal: 15, fontSize: 15, color: colorScheme != "dark" ? '#97979eff':'#ffffff' }}>Recent Bills</Text>
              <View style={styles.container1}>
                {recentBills?.map((item, i) => {
                  const billNo = receiptSettings?.custom_sl_flag === 'N' ? item?.receipt_no : item?.rcpt_sl_no;
                  const dt = new Date(item.trn_date).toLocaleDateString();
                  return (
                    <Card
                      key={i}
                      style={colorScheme === "dark" ? styles.cardDark : styles.card}
                      // backgroundColor={colorScheme === "dark" ? "#1c1c1c" : "white"}
                      onPress={() =>
                        loginStore?.mode !== 'C'
                          ? handleRecentBillListClick(item.receipt_no)
                          : handleBillListClickCalculatorMode(item.receipt_no)
                      }
                    >
                      <List.Item
                        titleStyle={colorScheme === "dark" ? styles.title1Dark : styles.title1}
                        descriptionStyle={colorScheme === "dark" ? styles.descriptionDark : styles.description}
                        title={` ${billNo} `}
                        description={`₹ ${item.net_amt} (${dt})`}
                        left={props => <List.Icon {...props} icon="receipt" color={colorScheme === "dark" ? "#009689" : "#008181"} />}
                      />
                    </Card>
                  );
                })}
              </View>
              <Button
                textColor={colorScheme === "dark" ? "#009689" : "#008181"}
                onPress={() =>
                  navigation.dispatch(
                    CommonActions.navigate({
                      name: navigationRoutes.allBillsScreen,
                    }),
                  )
                }
              >
                More
              </Button>
            </>
          ) : (
            <View style={{ marginHorizontal: 'auto', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: colorScheme !== "dark" ? '#97979eff' : '#ffffff', margin: 'auto' }}>Your recent bills will appear here!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <DialogBoxForReprint
        iconSize={30}
        visible={visible}
        hide={hideDialog}
        titleStyle={styles.title}
        currentReceiptNo={currentReceiptNo}
        billedSaleData={billedSaleData}
        handleCancelBill={handleCancelBill}
        cancelledBillStatus={cancelledBillStatus}
        onDialogFailure={onDialogFailure}
        onDialogSuccecss={() => onDialogSuccecss()}
      />

      <DialogForBillsInCalculatorMode
        visible={visible2}
        hide={hideDialog2}
        currentReceiptNumber={currentReceiptNo}
        showCalculatedBillData={calculatorModeBillArray}
        onDialogFailure={hideDialog2}
        onDialogSuccecss={() => onDialogSuccecss(true)}
      />

      {loginStore?.mode === "N" ? (
        <AnimatedFABPaper
          icon="plus"
          color="white"
          label="Bill"
          onPress={() =>
            navigation.dispatch(
              CommonActions.navigate({
                name: navigationRoutes.productsScreen,
              }),
            )
          }
          extended={isExtended}
          animateFrom="right"
          iconMode="dynamic"
          customStyle={styles.fabStyle}
        />
      ) : (
        <AnimatedFABPaper
          icon="pencil-plus-outline"
          color="white"
          label="Bill"
          onPress={() =>
            navigation.dispatch(
              CommonActions.navigate({
                name: navigationRoutes.calculateModeBillScreen,
              }),
            )
          }
          extended={isExtended}
          animateFrom="right"
          iconMode="dynamic"
          customStyle={styles.fabStyle}
        />
      )}

      {loginStore?.mode !== "C" && (
        <AnimatedFABPaper
          color="white"
          variant="tertiary"
          icon="apps"
          label="Categories"
          onPress={() =>
            navigation.dispatch(
              CommonActions.navigate({
                name: navigationRoutes.categoriesScreen,
              }),
            )
          }
          extended={isExtended}
          animateFrom="left"
          iconMode="dynamic"
          customStyle={[styles.fabStyle2, { backgroundColor: colorScheme === "dark" ? "#009689" : "#008181" }]}
        />
      )}
    </SafeAreaView>
  )
}

export default HomeScreen

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },

  title: {
    textAlign: "center",
  },

  bill: {
    margin: normalize(20),
    padding: normalize(10),
    // minHeight: 200,
    height: "auto",
    maxHeight: "auto",
    borderRadius: normalize(30),
    width: normalize(320),
    alignItems: "center",
    color: "#008181"
  },

  fabStyle: {
    bottom: normalize(16),
    right: normalize(16),
    position: "absolute",
    color: "white",

    backgroundColor: "#ffcd04"
    //#BF211E 
    //#138A36
    //#4DAA57
  },

  fabStyle2: {
    bottom: normalize(16),
    left: normalize(16),
    position: "absolute",
    color: "#008181"

  },
  container1: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  card: {
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,          // for Android shadow
    shadowColor: '#000',   // for iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    backgroundColor: 'white',
  },
  cardDark:{
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,          // for Android shadow
    shadowColor: '#000',   // for iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    backgroundColor: '#2e2929ff',

  },
  title1: {
    color: '#008181',
    fontWeight: '800',
  },
  title1Dark: {
    color: '#009689',
    fontWeight: '800',
  },
  description: {
    color: '#97979eff',
  },
  descriptionDark: {
    color: '#ffffff',
  },
})
