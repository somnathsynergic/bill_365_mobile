import React, { useContext, useEffect, useRef, useState } from 'react'
import { StyleSheet, View, PixelRatio } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { Text, Searchbar } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import HeaderImage from '../components/HeaderImage'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { usePaperColorScheme } from '../theme/theme'
import normalize from 'react-native-normalize'
import { flowerSetting, flowerSettingDark } from "../resources/images"
import {
    CommonActions,

} from "@react-navigation/native"
import navigationRoutes from "../routes/navigationRoutes"
import { ItemsData, StockSearchCredentials } from '../models/api_types'
import { AppStoreContext } from '../models/custom_types'
import { AppStore } from '../context/AppContext'
import ProductListSuggestion from '../components/ProductListSuggestion'
import ScrollableListContainer from '../components/ScrollableListContainer'
import { loginStorage } from '../storage/appStorage'
import useStockSearch from '../hooks/api/useStockSearch'
import InputPaper from '../components/InputPaper'
import DatePicker from 'react-native-date-picker'
import ButtonPaper from '../components/ButtonPaper'
import axios from 'axios'
import { BASE_URL } from '../config/config'

function StockOpenScreen() {
    const navigation = useNavigation()
    const { fetchStock } = useStockSearch()

    const theme = usePaperColorScheme()
    const searchProductRef = useRef(null)
    const [filteredItems, setFilteredItems] = useState<ItemsData[]>(() => [])
    const [search, setSearch] = useState<string>(() => "")
    const { receiptSettings, items, handleGetItems } = useContext<AppStoreContext>(AppStore)
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const [qty, setQty] = useState<number>()
    const [product, setProduct] = useState<ItemsData>()
    const [quantity, setQuantity] = useState<number>()
    const [discountState, setDiscountState] = useState<number>(() => 0)
    const [price, setPrice] = useState<number>(() => product?.price)
    const [stock, setStock] = useState<number>()
    const [updatedStock, setUpdatedStock] = useState<number>()
    const [discountBillwise, setDiscountBillwise] = useState<number>(() => 0)
    const [tableNo, setTableNo] = useState<number>(() => 0)
    const [visible, setVisible] = useState(() => false)
    const isFocused = useIsFocused()
    const [toDate, setToDate] = useState(() => new Date())
    const [openFromDate, setOpenFromDate] = useState(() => false)
    const [openToDate, setOpenToDate] = useState(() => false)
    const productDetails = (item: ItemsData) => {
        setProduct(item)
        setSearch(item?.item_name)
        setDiscountState(item?.discount)
        setPrice(item?.price)
        handleFetchStock(item?.item_id)
        setVisible(!visible)
    }
    const handleFetchStock = async (itemId: number) => {
        let fetchedStockObject: StockSearchCredentials = {
            comp_id: loginStore?.comp_id,
            br_id: loginStore?.br_id,
            // user_id: loginStore?.user_id,
            item_id: itemId,
        }

        console.log(
            "BRRRRRRRRRR IDDDDDDDDDDDDD loginStore?.br_id",
            loginStore?.br_id,
        )

        await fetchStock(fetchedStockObject)
            .then(res => {
                console.log("handleFetchStock fetchStock", res)
                setStock(res?.stock)
            })
            .catch(err => {
                console.log("Something went wrong in handleFetchStock!", err)
            })
    }
    useEffect(() => {
        handleGetItems()
    }, [isFocused])

    const onSaveStockOpen = () => {
        console.log("onSaveStockOpen called")
        console.log(
             loginStore?.comp_id,
           loginStore?.br_id,
           product?.item_id,
           qty,
           toDate.toLocaleDateString("en-GB"),
           loginStore?.user_id,
        )

        const payload = {
            comp_id: loginStore?.comp_id,
            br_id: loginStore?.br_id,
            item_id: product?.item_id,
            stock: +qty,
            date: toDate,
            user_id: loginStore?.user_id
        }
        axios.post(BASE_URL + '/api/stock_open', payload).then(res=>console.log(res.data)).catch(err=>console.log(err))
    }

    const onChangeSearch = (query: string) => {
        setSearch(query)
        setVisible(true)
        console.log(query)
        console.log(items)
        // Convert the query to lowercase (or uppercase) for case-insensitive comparison
        const lowerCaseQuery = query.toLowerCase()

        const filtered = items.filter(
            (item: ItemsData) =>
                item?.item_name?.toLowerCase().includes(lowerCaseQuery) || // Check if item_name contains the query
                item?.item_id?.toString().toLowerCase().includes(lowerCaseQuery), // Check if item_id contains the query
        )
        setFilteredItems(filtered)

        // Clear the filtered items if the query is empty
        if (query === "") setFilteredItems(() => [])
    }

    return (
        // <SafeAreaView
        //       style={[styles.container, { backgroundColor: theme.colors.background }]}>
        //   <ScrollView keyboardShouldPersistTaps="handled">

        <View style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: "center" }}>
            <View style={{ alignItems: "center" }}>
                <HeaderImage
                    isBackEnabled
                    imgLight={flowerSetting}
                    imgDark={flowerSettingDark}
                    borderRadius={30}
                    blur={10}>
                    Stock Open
                </HeaderImage>
            </View>
            <View>
                <View
                    style={{
                        paddingHorizontal: normalize(25),
                        paddingBottom: normalize(10),
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                        width: "100%",
                    }}>
                    {/* <View style={{ width: "85%" }}> */}
                    <Searchbar
                        ref={searchProductRef}
                        placeholder="Search Items or ID"
                        onChangeText={onChangeSearch}
                        value={search}
                        elevation={search && 2}
                        // loading={search ? true : false}
                        autoFocus
                        style={{
                            // backgroundColor: theme.colors.vanillaSecondaryContainer,
                            color: theme.colors.onSecondaryContainer,
                        }}
                    // traileringIcon={"barcode-scan"}
                    // traileringIconColor={theme.colors.purple}
                    // onTraileringIconPress={
                    //     () => navigation.dispatch(
                    //         CommonActions.navigate(navigationRoutes.cameraScreen)
                    //     )
                    // }
                    />
                    {/* </View> */}

                    {/* <View style={{ width: "15%" }}>
            <IconButton
              icon="barcode-scan"
              onPress={() => navigation.dispatch(
                CommonActions.navigate(navigationRoutes.cameraScreen)
              )}
              size={30}
              iconColor={theme.colors.purple}
            />
          </View> */}

                </View>
                <View style={{ paddingBottom: PixelRatio.roundToNearestPixel(10) }}>
                    {search && visible && (
                        <ScrollableListContainer
                            backgroundColor={theme.colors.surfaceVariant}>
                            {filteredItems.map(item => (
                                <ProductListSuggestion
                                    key={item?.id}
                                    itemName={item?.item_name}
                                    onPress={() => productDetails(item)}
                                    unitPrice={item?.price}
                                />
                            ))}
                        </ScrollableListContainer>
                    )}
                    <View style={{
                        alignItems: "center", marginHorizontal: 20, flexDirection: "column",
                        justifyContent: "center",
                        gap: 5,
                    }}>
                        <View
                            style={
                                // receiptSettings?.unit_flag === "Y"
                                //     ? { width: "50%" }
                                //     : { width: "100%" }
                                { width: "45%", marginVertical:10 }
                            }>
                            <InputPaper
                                selectTextOnFocus
                                label="Quantity"
                                onChangeText={(txt: string) => setQty(+txt)}
                                value={qty}
                                keyboardType="numeric"
                                mode="outlined"
                            />
                        </View>
                        <View
                            style={
                                // receiptSettings?.unit_flag === "Y"
                                //     ? { width: "50%" }
                                //     : { width: "100%" }
                                { width: "45%", marginVertical:10,  }
                            }>
                            <ButtonPaper onPress={() => setOpenToDate(true)} mode="text">
                                TO: {toDate?.toLocaleDateString("en-GB")}
                            </ButtonPaper>
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

                    </View>
                    <ButtonPaper
                        mode="contained"
                        onPress={() => onSaveStockOpen()}
                        buttonColor={theme.colors.purple}
                        textColor={theme.colors.onPurple}  >
                        Submit
                    </ButtonPaper>
                </View>
            </View>
        </View>
        // </ScrollView>   
        // </SafeAreaView>
    )
}

export default StockOpenScreen


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