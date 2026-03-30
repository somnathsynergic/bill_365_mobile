import React, { useContext, useEffect, useState } from "react"
import {
    StyleSheet,
    ScrollView,
    SafeAreaView,
    View,
    ToastAndroid,
    ViewStyle,
    TextStyle,
    Alert,
    useColorScheme,
} from "react-native"
import { Card, RadioButton, Searchbar, Text } from "react-native-paper"
import HeaderImage from "../components/HeaderImage"
import {
    textureReport,
    textureReportDark,
} from "../resources/images"
import { usePaperColorScheme } from "../theme/theme"
import { useNavigation } from "@react-navigation/native"
import ButtonPaper from "../components/ButtonPaper"
import normalize, { SCREEN_HEIGHT, SCREEN_WIDTH } from "react-native-normalize"
import useShowBill from "../hooks/api/useShowBill"
import {
    RecoveryAmountCredentials,
    RecoveryAmountResponseData,
    RecoveryUpdateCredentials,
    ShowBillData,
} from "../models/api_types"
import { loginStorage } from "../storage/appStorage"
import { AppStore } from "../context/AppContext"
import { useBluetoothPrint } from "../hooks/printables/useBluetoothPrint"
import useCalculations from "../hooks/useCalculations"
import SurfacePaper from "../components/SurfacePaper"
import useRecoveryAmount from "../hooks/api/useRecoveryAmount"
import InputPaper from "../components/InputPaper"
import useRecoveryUpdate from "../hooks/api/useRecoveryUpdate"
import { AppStoreContext } from "../models/custom_types"
import useCancelBill from "../hooks/api/useCancelBill"

function RecoveryAmountScreen() {
    const theme = usePaperColorScheme()
    const navigation = useNavigation()
    const colorScheme = useColorScheme()
    const loginStore = JSON.parse(loginStorage.getString("login-data"))

    const { receiptSettings } = useContext<AppStoreContext>(AppStore)
    const { printRecoveryAmount } = useBluetoothPrint()

    const [dueAmount, setDueAmount] = useState<number>()

    const [recoveryDetailsData, setRecoveryDetailsData] = useState<
        RecoveryAmountResponseData[]
    >(() => [])

    const [isLoading, setIsLoading] = useState(() => false)
    const [isDisabled, setIsDisabled] = useState(() => false)

    const [search, setSearch] = useState<string>(() => "")
    const onChangeSearch = (query: string) => {
        if (/^\d*$/.test(query)) {
            setSearch(query)
        }
    }

    const [checked, setChecked] = useState<string>(() => "C")

    const { fetchRecoveryDetails } = useRecoveryAmount()
    const { recoveryUpdate } = useRecoveryUpdate()

    const handleGetDetails = async (mobile: string) => {
        setIsDisabled(true)
        setIsLoading(true)
        const reqCreds: RecoveryAmountCredentials = {
            comp_id: loginStore?.comp_id,
            br_id: loginStore?.br_id,
            phone_no: mobile,
        }

        console.log(
            "comp_id br_id phone_no",
            loginStore?.comp_id,
            loginStore?.br_id,
            mobile,
        )

        await fetchRecoveryDetails(reqCreds)
            .then(res => {
                if (res?.data?.length === 0) {
                    ToastAndroid.show("No Due found.", ToastAndroid.SHORT)
                    return
                }

                console.log("UUUUUUUUUUUUUUUUUUUUUU=================", res?.data)
                setRecoveryDetailsData(res?.data)
            })
            .catch(err => {
                ToastAndroid.show("Error during fetching bills...", ToastAndroid.SHORT)
                console.log("EEEEEEEEEEEERRRRRRRRRRRRRRRRRRRR", err)
            })

        setIsDisabled(false)
        setIsLoading(false)
    }
    useEffect(() => {
        if (!search) {
            setRecoveryDetailsData([])
        }
    }, [search])
    const handleSearchClick = async (mobile: string) => {
        if (!search || search.length !== 10) {
            ToastAndroid.show("Enter valid phone number.", ToastAndroid.SHORT)
            return
        }
        // setVisible(!visible)
        await handleGetDetails(mobile)
        // setCurrentReceiptNo(rcptNo)
        // setGstFlag(billedSaleData[0]?.gst_flag)
    }

    // const handleDueClick = (dueAmt: number, netAmt?: number) => {
    //     setVisibleDue(!visibleDue)
    //     setDueAmount(dueAmt)
    //     setDueAmountMemory(dueAmt)
    //     setNetAmt(netAmt)
    // }

    const getDueAmount = async () => {
        if ((dueAmount > (recoveryDetailsData[0]?.net_amt - recoveryDetailsData[0]?.paid_amt) || dueAmount === 0)) {
            ToastAndroid.show("Please provide valid amount!", ToastAndroid.SHORT)
            return
        }

        const recoverUpdateCreds: RecoveryUpdateCredentials = {
            comp_id: loginStore?.comp_id,
            br_id: loginStore?.br_id,
            phone_no: search,
            received_amt: dueAmount,
            pay_mode: checked,
            user_id: loginStore?.user_id
        }

        await recoveryUpdate(recoverUpdateCreds)
            .then(async res => {
                // console.log("NEWWWW RESPONSE RCPT ID", res.recover_id)
                ToastAndroid.show("Amount Recovered Successfully!", ToastAndroid.SHORT)
                // printRecovery(res.recover_id, netAmt, dueAmount)

                setDueAmount(() => 0)
                await handleSearchClick(search)
            })
            .catch(err => {
                ToastAndroid.show("Something went wrong while recovering amount.", ToastAndroid.SHORT)
                console.log("EERRRRRRR", err)
            })
    }

    const handleGetDueAmount = () => {
        Alert.alert("Recover amount?", `Are you sure you want to recover ${dueAmount} ruppees?`, [
            { text: "Cancel", onPress: () => null },
            { text: "Yes", onPress: async () => await getDueAmount() }
        ])
    }

    const handlePrint = async () => {
        await printRecoveryAmount(recoveryDetailsData)
    }

    const cellTextStyle2: TextStyle = {
        color: theme.colors.vanillaTertiary,
        backgroundColor: theme.colors.vanillaTertiaryContainer,
        minWidth: 50,
        borderRadius: 10,
        textAlign: "center",
        fontWeight: "bold",
        padding: 5
    }

    const cellTextStyle3: TextStyle = {
        color: theme.colors.onErrorContainer,
        backgroundColor: theme.colors.errorContainer,
        minWidth: 50,
        borderRadius: 10,
        textAlign: "center",
        fontWeight: "bold",
        padding: 5
    }

    const cellTextStyle4: TextStyle = {
        color: theme.colors.onPrimaryContainer,
        backgroundColor: theme.colors.primaryContainer,
        minWidth: 50,
        borderRadius: 10,
        textAlign: "center",
        fontWeight: "bold",
        padding: 5
    }

    const ViewTextStyle: ViewStyle = {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        gap: 50,
        padding: 5,
        alignItems: "center",
        borderColor: theme.colors.vanilla,
        borderRadius: 10,
    }

    return (
        // <SafeAreaView
        //     style={[styles.container, { backgroundColor: theme.colors.background }]}>
        //     <ScrollView keyboardShouldPersistTaps="handled">
        //         <View style={{ alignItems: "center" }}>
        //             <HeaderImage
        //                 imgLight={textureReport}
        //                 imgDark={textureReportDark}
        //                 borderRadius={30}
        //                 blur={10}
        //                 isBackEnabled>
        //                 Recovery Amount
        //             </HeaderImage>
        //         </View>

        //         <View
        //             style={{
        //                 paddingHorizontal: normalize(20),
        //                 paddingBottom: normalize(10),
        //             }}>
        //             <View
        //                 style={{
        //                     paddingHorizontal: normalize(10),
        //                     paddingBottom: normalize(10),
        //                 }}>
        //                 <Searchbar
        //                     autoFocus
        //                     // placeholder="Search Bills"
        //                     placeholder="Mobile Number"
        //                     onChangeText={onChangeSearch}
        //                     value={search}
        //                     elevation={search && 2}
        //                     keyboardType="numeric"
        //                     maxLength={10}
        //                     style={{
        //                         backgroundColor: theme.colors.vanillaSecondaryContainer,
        //                         color: theme.colors.onVanillaSecondaryContainer,
        //                     }}
        //                     selectionColor={theme.colors.vanilla}
        //                 // loading={search ? true : false}
        //                 />
        //             </View>
        //             {/* <ButtonPaper onPress={() => handleGetBillsByDate(formattedFromDate, formattedToDate)} mode="contained-tonal">
        //                 SUBMIT
        //             </ButtonPaper> */}
        //             <View
        //                 style={{
        //                     paddingHorizontal: normalize(10),
        //                 }}>
        //                 <ButtonPaper
        //                     onPress={() => handleSearchClick(search)}
        //                     mode="contained-tonal"
        //                     buttonColor={theme.colors.vanillaContainer}
        //                     loading={isLoading}
        //                     disabled={isDisabled}>
        //                     SUBMIT
        //                 </ButtonPaper>
        //             </View>
        //         </View>

        //         {recoveryDetailsData?.length > 0
        //             &&
        //             (recoveryDetailsData[0]?.net_amt > recoveryDetailsData[0]?.paid_amt)
        //             && <SurfacePaper backgroundColor={theme.colors.vanillaSurfaceLow} elevation={1} borderRadiusEnabled smallWidthEnabled style={{
        //                 padding: normalize(15),
        //                 height: "auto",
        //                 minHeight: SCREEN_HEIGHT / 3,
        //                 justifyContent: 'space-evenly',
        //                 gap: 5
        //                 // borderWidth: 2,
        //                 // borderStyle: "dashed",
        //                 // borderColor: theme.colors.vanilla
        //             }}>
        //                 {/* <View style={ViewTextStyle}>
        //                     <Text variant="titleLarge">TOTAL NET</Text>
        //                     <Text variant="titleLarge" style={{ textAlign: "center" }}>:</Text>
        //                     <Text variant="titleLarge" style={cellTextStyle2}>₹{recoveryDetailsData[0]?.net_amt}</Text>
        //                 </View> */}
        //                 <View style={ViewTextStyle}>
        //                     <Text variant="titleLarge">TOTAL PAID</Text>
        //                     <Text variant="titleLarge" style={{ textAlign: "center" }}>:</Text>
        //                     <Text variant="titleLarge" style={cellTextStyle4}>₹{recoveryDetailsData[0]?.paid_amt}</Text>
        //                 </View>
        //                 <View style={ViewTextStyle}>
        //                     <Text variant="titleLarge">TOTAL DUE</Text>
        //                     <Text variant="titleLarge" style={{ textAlign: "center" }}>:</Text>
        //                     <Text variant="titleLarge" style={cellTextStyle3}>₹{recoveryDetailsData[0]?.net_amt - recoveryDetailsData[0]?.paid_amt}</Text>
        //                 </View>

        //                 {receiptSettings?.pay_mode === "Y" && (
        //                     <View
        //                         style={{
        //                             flexDirection: "row",
        //                             justifyContent: "space-around",
        //                             alignItems: "center",
        //                             width: "100%",
        //                             marginRight: normalize(15),
        //                             // marginLeft: normalize(4),
        //                             marginVertical: normalize(10),
        //                             flexWrap: "wrap"
        //                         }}>
        //                         <RadioButton
        //                             value="C"
        //                             status={checked === "C" ? "checked" : "unchecked"}
        //                             color={theme.colors.onTertiaryContainer}
        //                             onPress={() => setChecked("C")}
        //                         />
        //                         <Text
        //                             variant="labelLarge"
        //                             style={
        //                                 checked === "C" && {
        //                                     color: theme.colors.onTertiaryContainer,
        //                                 }
        //                             }>
        //                             Cash
        //                         </Text>
        //                         <RadioButton
        //                             value="D"
        //                             status={checked === "D" ? "checked" : "unchecked"}
        //                             color={theme.colors.onTertiaryContainer}
        //                             onPress={() => setChecked("D")}
        //                         />
        //                         <Text
        //                             variant="labelLarge"
        //                             style={
        //                                 checked === "D" && {
        //                                     color: theme.colors.onTertiaryContainer,
        //                                 }
        //                             }>
        //                             Card
        //                         </Text>
        //                         <RadioButton
        //                             value="U"
        //                             status={checked === "U" ? "checked" : "unchecked"}
        //                             color={theme.colors.onTertiaryContainer}
        //                             onPress={() => setChecked("U")}
        //                         />
        //                         <Text
        //                             variant="labelLarge"
        //                             style={
        //                                 checked === "U" && {
        //                                     color: theme.colors.onTertiaryContainer,
        //                                 }
        //                             }>
        //                             UPI
        //                         </Text>
        //                     </View>
        //                 )}

        //                 <View style={{
        //                     width: "100%",
        //                     marginBottom: normalize(5)
        //                 }}>
        //                     <InputPaper
        //                         label="Received Amount"
        //                         onChangeText={(e: number) => setDueAmount(e)} value={dueAmount} keyboardType="numeric"
        //                         customStyle={{
        //                             backgroundColor: theme.colors.vanillaSurfaceLow
        //                         }}
        //                         selectTextOnFocus
        //                         clearTextOnFocus
        //                     />
        //                 </View>

        //                 <View style={{
        //                     flexDirection: "row",
        //                     justifyContent: "space-between",
        //                     gap: 10
        //                 }}>
        //                     <ButtonPaper
        //                         onPress={handleGetDueAmount}
        //                         mode="elevated"
        //                         textColor={theme.colors.vanilla}
        //                         icon={"arrow-u-down-left"}
        //                         style={{
        //                             backgroundColor: theme.colors.vanillaSurface
        //                         }}
        //                         disabled={!dueAmount}>
        //                         Get Due Amount
        //                     </ButtonPaper>
        //                     <ButtonPaper
        //                         onPress={handlePrint}
        //                         mode="elevated"
        //                         textColor={theme.colors.vanilla}
        //                         icon={"cloud-print-outline"}
        //                         style={{
        //                             backgroundColor: theme.colors.vanillaSurface
        //                         }}>
        //                         Print
        //                     </ButtonPaper>
        //                 </View>

        //             </SurfacePaper>
        //         }
        //     </ScrollView>

        // </SafeAreaView>
        <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? 'black' : '#f5f9ff' }]}>
            <ScrollView keyboardShouldPersistTaps="handled">
                <View style={{ alignItems: "center" }}>
                    <HeaderImage
                        imgLight={textureReport}
                        imgDark={textureReportDark}
                        borderRadius={30}
                        blur={10}
                        isBackEnabled>
                        Recovery Amount
                    </HeaderImage>
                </View>

                <View style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(10) }}>
                    <View style={{ paddingHorizontal: normalize(10), paddingBottom: normalize(10) }}>
                        <Searchbar
                            autoFocus
                            placeholder="Mobile Number"
                            onChangeText={onChangeSearch}
                            value={search}
                            elevation={search ? 2 : 0}
                            keyboardType="numeric"
                            maxLength={10}
                            style={{
                                backgroundColor: colorScheme === 'dark' ? '#2e2929ff' : '#def0ddff',
                                color: '#008181',
                                borderRadius: normalize(8),
                                // borderWidth: 1,
                                borderColor: '#008181',
                            }}
                            selectionColor="#008181"
                        />
                    </View>
                    <View style={{ paddingHorizontal: normalize(10) }}>
                        <ButtonPaper
                            onPress={() => handleSearchClick(search)}
                            mode="contained-tonal"
                            buttonColor={colorScheme === 'dark' ? '#009689' : '#008181'}
                            textColor="white"
                            loading={isLoading}
                            disabled={isDisabled}
                            style={{ borderRadius: normalize(8) }}
                        >
                            SUBMIT
                        </ButtonPaper>
                    </View>
                </View>

                {recoveryDetailsData?.length > 0 && recoveryDetailsData[0]?.net_amt > recoveryDetailsData[0]?.paid_amt && (
                    <SurfacePaper
                        backgroundColor={colorScheme === 'dark' ? '#2e2929ff' : "#f5f9ff"}
                        elevation={1}
                        borderRadiusEnabled
                        smallWidthEnabled
                        style={{
                            padding: normalize(15),
                            minHeight: SCREEN_HEIGHT / 3,
                            flexDirection: 'column',
                            justifyContent: 'space-evenly',
                            gap: 5,
                            borderRadius: normalize(12),
                            //   borderWidth: 1,
                            borderColor: '#008181',
                            elevation: 0
                        }}
                    >
                        <View style={{ flexDirection: 'row', gap: 40, width: SCREEN_WIDTH / 3, marginLeft: -180 }}>
                            <View style={ViewTextStyle}>
                                <Card
                                    style={{
                                        elevation: 4,
                                        borderRadius: normalize(12),
                                        backgroundColor: colorScheme === 'dark' ? 'black' : '#f5f9ff',
                                        paddingHorizontal: normalize(16),
                                        paddingVertical: normalize(12),
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        minWidth: 130,
                                        alignContent: 'center',
                                        flexWrap: 'nowrap',
                                    }}
                                >
                                    <Text
                                        //   variant="titleLarge"
                                        style={{
                                            fontWeight: 'bold',
                                            color: colorScheme === 'dark' ? '#009689' : '#008181',
                                            marginRight: normalize(8),
                                            alignItems: 'center'
                                        }}
                                    >
                                        Total Paid
                                    </Text>
                                    <View
                                        style={{
                                            backgroundColor: colorScheme === 'dark' ? '#009689' : '#008181',
                                            paddingHorizontal: normalize(12),
                                            paddingVertical: normalize(6),
                                            borderRadius: normalize(8),
                                            alignItems: 'center'
                                        }}
                                    >
                                        <Text
                                            // variant="titleLarge"
                                            style={{
                                                color: 'white',
                                                fontWeight: '600',
                                                letterSpacing: 0.5,
                                            }}
                                        >
                                            ₹{recoveryDetailsData[0]?.paid_amt}
                                        </Text>
                                    </View>
                                </Card>
                            </View>
                            <View style={ViewTextStyle}>
                                <Card
                                    style={{
                                        //   elevation: 4,
                                        borderRadius: normalize(12),
                                        backgroundColor: colorScheme === 'dark' ? 'black' : '#f5f9ff',
                                        paddingHorizontal: normalize(16),
                                        paddingVertical: normalize(12),
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        minWidth: 130,
                                        flexWrap: 'nowrap',
                                    }}
                                >
                                    <Text
                                        //   variant="titleLarge"
                                        style={{
                                            fontWeight: 'bold',
                                            color: '#FFCD04',
                                            marginRight: normalize(8),
                                        }}
                                    >
                                        Total Due
                                    </Text>
                                    <View
                                        style={{
                                            backgroundColor: '#FFCD04',
                                            paddingHorizontal: normalize(12),
                                            paddingVertical: normalize(6),
                                            borderRadius: normalize(8),
                                            alignItems: 'center'
                                        }}
                                    >
                                        <Text
                                            // variant="titleLarge"
                                            style={{
                                                color: colorScheme === 'dark' ? '#009689' : '#008181',
                                                fontWeight: '600',
                                                letterSpacing: 0.5,
                                            }}
                                        >
                                            ₹{recoveryDetailsData[0]?.net_amt - recoveryDetailsData[0]?.paid_amt}
                                        </Text>
                                    </View>
                                </Card>
                            </View>
                        </View>




                        {receiptSettings?.pay_mode === "Y" && (
                            <View
                                style={{

                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: normalize(20),
                                    width: SCREEN_WIDTH / 1.25,
                                    marginVertical: normalize(10),


                                    marginHorizontal: normalize(10),
                                    padding: normalize(12),
                                    borderRadius: normalize(12),
                                    backgroundColor: theme.colors.surface,
                                    elevation: 2,
                                    shadowColor: theme.colors.vanilla,
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 2,

                                }}
                            >
                                <RadioButton
                                    value="C"
                                    status={checked === "C" ? "checked" : "unchecked"}
                                    color={colorScheme === 'dark' ? '#009689' : '#008181'}
                                    onPress={() => setChecked("C")}
                                />
                                <Text variant="labelLarge" style={checked === "C" && { color: colorScheme === 'dark' ? '#009689' : '#008181', fontWeight: '600' }}>Cash</Text>
                                <RadioButton
                                    value="D"
                                    status={checked === "D" ? "checked" : "unchecked"}
                                    color={colorScheme === 'dark' ? '#009689' : '#008181'}
                                    onPress={() => setChecked("D")}
                                />
                                <Text variant="labelLarge" style={checked === "D" && { color: colorScheme === 'dark' ? '#009689' : '#008181', fontWeight: '600' }}>Card</Text>
                                <RadioButton
                                    value="U"
                                    status={checked === "U" ? "checked" : "unchecked"}
                                    color={colorScheme === 'dark' ? '#009689' : '#008181'}
                                    onPress={() => setChecked("U")}
                                />
                                <Text variant="labelLarge" style={checked === "U" && { color: '#008181', fontWeight: '600' }}>UPI</Text>
                            </View>
                        )}

                        <View style={{ width: "100%", marginBottom: normalize(5) }}>
                            <InputPaper
                                label="Received Amount"
                                onChangeText={(e: any) => setDueAmount(e)}
                                value={dueAmount}
                                keyboardType="numeric"
                                customStyle={{
                                    backgroundColor: colorScheme === 'dark' ? '#2e2929ff' : '#ececf0ff',
                                    borderRadius: normalize(8),
                                    borderWidth: 1,
                                    borderColor: '#008181',
                                }}
                                selectTextOnFocus
                                clearTextOnFocus
                            />
                        </View>

                        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                            <ButtonPaper
                                onPress={handleGetDueAmount}
                                mode="elevated"
                                textColor={colorScheme === 'dark' ? '#009689' : '#008181'}
                                icon="arrow-u-down-left"
                                style={{
                                    backgroundColor: '#FFCD04',
                                    borderRadius: normalize(8),
                                    flex: 1,
                                }}
                                disabled={!dueAmount}
                            >
                                Get Due Amount
                            </ButtonPaper>
                            <ButtonPaper
                                onPress={handlePrint}
                                mode="elevated"
                                textColor="white"
                                icon="cloud-print-outline"
                                style={{
                                    backgroundColor: colorScheme === 'dark' ? '#009689' : '#008181',
                                    borderRadius: normalize(8),
                                    flex: 1,
                                }}
                            >
                                Print
                            </ButtonPaper>
                        </View>
                    </SurfacePaper>
                )}
            </ScrollView>
        </SafeAreaView>

    )
}

export default RecoveryAmountScreen

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
    },

    title: {
        textAlign: "center",
    },
})
