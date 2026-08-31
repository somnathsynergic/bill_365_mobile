import {
  StyleSheet,
  ScrollView,
  SafeAreaView,
  View,
  PixelRatio,
  ToastAndroid,
  Alert,
  useColorScheme,
} from "react-native"
import { IconButton, Searchbar, Text } from "react-native-paper"
import HeaderImage from "../components/HeaderImage"
import { productHeader, productHeaderDark } from "../resources/images"
import { usePaperColorScheme } from "../theme/theme"
import { useCallback, useContext, useEffect, useRef, useState } from "react"
import DialogBox from "../components/DialogBox"
import {
  CommonActions,
  useIsFocused,
  useNavigation,
  useNavigationState,
  useRoute,
} from "@react-navigation/native"
import InputPaper from "../components/InputPaper"
import normalize, { SCREEN_HEIGHT, SCREEN_WIDTH } from "react-native-normalize"
// import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet'
import ProductListSuggestion from "../components/ProductListSuggestion"
import AddedProductList from "../components/AddedProductList"
import ScrollableListContainer from "../components/ScrollableListContainer"
import NetTotalButton from "../components/NetTotalButton"
import { clearStates } from "../utils/clearStates"
import {
  ItemsData,
  SearchByBarcodeCredentials,
  StockSearchCredentials,
  StockUpdateCredentials,
} from "../models/api_types"
import ButtonPaper from "../components/ButtonPaper"
import navigationRoutes from "../routes/navigationRoutes"
import { AppStore } from "../context/AppContext"
import { loginStorage, productStorage } from "../storage/appStorage"
import useStockSearch from "../hooks/api/useStockSearch"
import useStockUpdate from "../hooks/api/useStockUpdate"
import AnimatedFABPaper from "../components/AnimatedFABPaper"
import { CameraScreenRouteProp } from "../models/route_types"
import useSearchProductByBarcode from "../hooks/api/useSearchProductByBarcode"
import { AppStoreContext } from "../models/custom_types"

function ProductsScreen() {
  const navigation = useNavigation()
  const { params } = useRoute<CameraScreenRouteProp>()
  const isFocused = useIsFocused()

  const theme = usePaperColorScheme()

  // const bottomSheetRef = useRef<BottomSheet>(null)

  const { receiptSettings, items, handleGetItems } = useContext<AppStoreContext>(AppStore)

  const loginStore = JSON.parse(loginStorage.getString("login-data"))

  const searchProductRef = useRef(null)

  const { fetchStock } = useStockSearch()
  const { fetchProductByBarcode } = useSearchProductByBarcode()

  const [visible, setVisible] = useState(() => false)
  const hideDialog = () => setVisible(() => false)
  const [editState, setEditState] = useState<boolean>(() => false)

  const [isDataAvailable, setIsDataAvailable] = useState<boolean>(false)

  const [search, setSearch] = useState<string>(() => "")
  const [filteredItems, setFilteredItems] = useState<ItemsData[]>(() => [])
  const colorScheme = useColorScheme()
  const [product, setProduct] = useState<ItemsData>()
  const [quantity, setQuantity] = useState<number>()
  const [discountState, setDiscountState] = useState<number>(() => 0)
  const [price, setPrice] = useState<number>(() => product?.price)
  const [stock, setStock] = useState<number>()
  const [updatedStock, setUpdatedStock] = useState<number>()
  const [discountBillwise, setDiscountBillwise] = useState<number>(() => 0)
  const [tableNo, setTableNo] = useState<number>(() => 0)
  const [low_stock_qty, setLow_stock_qty] = useState<number>(() => 0)

  const [addedProductsList, setAddedProductsList] = useState<ItemsData[]>(
    () => [],
  )

  let totalPrice = 0
  let totalDiscountedAmount = 0
  let discountWithQtyMultiplier = 0

  useEffect(() => {
    checkDataAvailability()
  }, [])

  const checkDataAvailability = () => {
    const hasKeys = productStorage.getAllKeys().length !== 0
    setIsDataAvailable(hasKeys)
  }

  useEffect(() => {
    handleGetItems()
  }, [isFocused])

  // const onChangeSearch = (query: string) => {
  //   setSearch(query)

  //   const filtered = items.filter((item: ItemsData) => item?.item_name?.includes(query))
  //   setFilteredItems(filtered)
  //   if (query === "") setFilteredItems(() => [])
  // }

  const onChangeSearch = (query: string) => {
    setSearch(query)

    // Convert the query to lowercase (or uppercase) for case-insensitive comparison
    const lowerCaseQuery = query.toLowerCase()
    // console.log(items)
    const filtered = items.filter(
      (item: ItemsData) =>
        item?.item_name?.toLowerCase().includes(lowerCaseQuery) || // Check if item_name contains the query
        item?.bar_code?.toString()?.toLowerCase().includes(lowerCaseQuery) || // Check if item_name contains the query
        item?.item_id?.toString().toLowerCase().includes(lowerCaseQuery), // Check if item_id contains the query
    )
    setFilteredItems(filtered)
    console.log(filtered)

    // Clear the filtered items if the query is empty
    if (query === "") setFilteredItems(() => [])
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

  const productDetails = (item: ItemsData) => {
    console.log(item)
    setProduct(item)
    setLow_stock_qty(item?.low_stock_qty)
    setDiscountState(item?.discount)
    setPrice(item?.price)
    handleFetchStock(item?.item_id)
    setVisible(!visible)
  }

  const productEditAndDelete = async (item: ItemsData) => {
    setEditState(true)

    let fetchedStockObject: StockSearchCredentials = {
      comp_id: loginStore?.comp_id,
      br_id: loginStore?.br_id,
      // user_id: loginStore?.user_id,
      item_id: item?.item_id,
    }

    await fetchStock(fetchedStockObject)
      .then(res => {
        console.log("handleFetchStock fetchStock", res)
        setStock(res?.stock)
      })
      .catch(err => {
        console.log("Something went wrong in handleFetchStock!", err)
      })
    setProduct(item)
    setQuantity(item?.quantity)
    setDiscountState(item?.discount)
    setPrice(item?.price)
    setVisible(!visible)
  }

  const handleOnDelete = (product: ItemsData) => {
    setAddedProductsList(prevData =>
      prevData?.filter((item, index) => item.id !== product.id),
    )

    setVisible(!visible)
    setEditState(false)
  }

  const onDialogFailure = () => {
    setEditState(false)
    setSearch(() => "")
    clearStates([setQuantity, setStock, setUpdatedStock], () => undefined)

    setVisible(!visible)
  }

  const onDialogSuccecss = () => {
    let isFoundDuplicate = false
    setEditState(false)

    console.log("OK PRODUCT: ", product?.item_name)

    for (let item of addedProductsList) {
      if (item?.id === product?.id) {
        ToastAndroid.show(
          "Item already exists. Please edit from the list.",
          ToastAndroid.LONG,
        )
        isFoundDuplicate = true
        break
      }
    }

    if (!isFoundDuplicate) {
      addProducts()

      discountState > 0
        ? setDiscountState(() => discountState)
        : setDiscountState(() => product?.discount)
      price > 0 ? setPrice(() => price) : setPrice(() => product?.price)

      clearStates([setSearch], () => "")
      setQuantity(() => undefined)
      clearStates(
        [setPrice, setDiscountState, setStock, setUpdatedStock],
        () => undefined,
      )
      setVisible(!visible)
      setFilteredItems(() => [])
    }
    console.log("asiurweagsaygeutseygfsdytfgsydtfse", quantity)

    if (searchProductRef.current) {
      searchProductRef.current.focus()
    }
  }

  const onDialogSuccessChange = () => {
    if (receiptSettings?.stock_flag === "Y") {
      if (
        quantity <= 0 ||
        typeof quantity === "undefined" ||
        Number.isNaN(quantity) ||
        updatedStock < 0
      ) {
        ToastAndroid.show("Try adding valid numbers!", ToastAndroid.SHORT)
        return
      }
    } else {
      if (
        quantity <= 0 ||
        typeof quantity === "undefined" ||
        Number.isNaN(quantity)
      ) {
        ToastAndroid.show("Try adding valid numbers!", ToastAndroid.SHORT)
        return
      }
    }

    if (receiptSettings?.discount_type === "P") {
      if (discountState > 100) {
        ToastAndroid.show(
          "Discount cannot be greater than 100%.",
          ToastAndroid.SHORT,
        )
        return
      }
    } else if (product.price * quantity < discountState) {
      ToastAndroid.show("Give valid Discount Amount.", ToastAndroid.SHORT)
      return
    }

    if (receiptSettings?.stock_flag === "Y") {
      if (stock === undefined || stock === null) {
        ToastAndroid.show(
          "No stock available. Add stock for this product.",
          ToastAndroid.SHORT,
        )
        return
      }
    }

    onDialogSuccecss()
  }

  const onDialogUpdate = (product: ItemsData) => {
    setEditState(false)
    console.log("OK PRODUCT UPDATE: ", product?.item_name)

    let filteredSingleProductArray = addedProductsList?.filter(
      (item, index) => item?.id === product?.id,
    )

    filteredSingleProductArray[0]["quantity"] = quantity
    filteredSingleProductArray[0]["discount"] = discountState
    filteredSingleProductArray[0]["price"] = price

    discountState > 0
      ? setDiscountState(() => discountState)
      : setDiscountState(() => product?.discount)
    price > 0 ? setPrice(() => price) : setPrice(() => product?.price)

    setProduct(filteredSingleProductArray[0])

    clearStates([setSearch], () => "")
    setQuantity(() => undefined)
    clearStates([setPrice, setDiscountState], () => 0)
    setVisible(!visible)
    setFilteredItems(() => [])
  }

  const onDialogUpdateChange = (product: ItemsData) => {
    if (receiptSettings?.stock_flag === "Y") {
      if (
        quantity <= 0 ||
        typeof quantity === "undefined" ||
        Number.isNaN(quantity) ||
        updatedStock < 0
      ) {
        ToastAndroid.show("Try adding valid numbers!", ToastAndroid.SHORT)
        return
      }
    } else {
      if (
        quantity <= 0 ||
        typeof quantity === "undefined" ||
        Number.isNaN(quantity)
      ) {
        ToastAndroid.show("Try adding valid numbers!", ToastAndroid.SHORT)
        return
      }
    }

    if (
      price <= 0 ||
      typeof price === "undefined" ||
      price.toString() === "NaN"
    ) {
      ToastAndroid.show("Try adding valid price.", ToastAndroid.SHORT)
      return
    }

    if (receiptSettings?.discount_type === "P" && discountState > 100) {
      ToastAndroid.show(
        "Discount cannot be greater than 100%.",
        ToastAndroid.SHORT,
      )
      return
    }

    if (
      receiptSettings?.discount_type === "P" ||
      product.price * quantity >= discountState
    ) {
      onDialogUpdate(product)
      return
    }

    ToastAndroid.show("Give valid Discount Amount.", ToastAndroid.SHORT)
  }

  const addProducts = () => {
    setAddedProductsList(prevProducts => [
      ...prevProducts,
      {
        ...product,
        quantity: quantity,
        discount: discountState > 0 ? discountState : product?.discount,
        price: price > 0 ? price : product?.price,
      },

    ])
  }

  useEffect(() => {
    //@ts-ignore
    setUpdatedStock(parseInt(stock) - parseInt(quantity))
  }, [quantity])
  const handleNextScreen = () => {
    if (receiptSettings?.kot_flag === "Y") {
      if (tableNo <= 0 || isNaN(tableNo)) {
        ToastAndroid.show("Enter valid Table Number.", ToastAndroid.SHORT)
        return
      }
    }
    navigation.dispatch(
      CommonActions.navigate({
        name: navigationRoutes.customerDetailsFillScreen,
        params: {
          added_products: addedProductsList,
          net_total: totalPrice,
          total_discount: totalDiscountedAmount,
          table_no: tableNo || 0,
        },
      }),
    )
  }

  // const [memorizationArray, setMemorizationArray] = useState(() => [])
  // const userToProductsMap = new Map<number, ItemsData[]>()

  // const handleClosePress = () => bottomSheetRef.current.close()
  // const handleOpenPress = () => bottomSheetRef.current.expand()

  const handleMemorize = () => {
    // setIsMem(true)
    // userToProductsMap.set(1, addedProductsList)
    // console.log("MMMAAAAAPPPPPPPPPPPPPPPPP", userToProductsMap)
    if (productStorage.getAllKeys().length === 0) {
      productStorage.set("products-data", JSON.stringify([...addedProductsList]))
      setAddedProductsList(() => [])
      setIsDataAvailable(true)
      console.log("Memorization success...")
    } else {
      Alert.alert("Maximum Limit Exceed!", "You can't hold more than 1.", [
        { text: "Close", onPress: () => null }
      ])
    }

    console.log("ADDED PRODUCTS LIST==============>>", addedProductsList)
    // setMemorizationArray([...addedProductsList])

  }

  const onHoldClick = () => {
    Alert.alert("Hold Bill", "Are you sure you want to hold this bill?", [
      { text: "No", onPress: () => null },
      { text: "Yes", onPress: handleMemorize }
    ])
  }

  const handleMemOut = () => {
    if (productStorage.getAllKeys().length !== 0) {
      // setIsMem(false)
      const productsStore = JSON.parse(productStorage.getString("products-data"))
      console.log("Mem Out=============>>>", productsStore)
      setAddedProductsList(productsStore)
      productStorage.clearAll()
      setIsDataAvailable(false)
    } else {
      ToastAndroid.show("There's no data available.", ToastAndroid.SHORT)
      return
    }

    console.log("ADDED PRODUCTS LIST==============>>", addedProductsList)
  }

  const onGetHoldBillOut = () => {
    Alert.alert("Get Bill", "Are you sure you want to get this bill?", [
      { text: "No", onPress: () => null },
      { text: "Yes", onPress: handleMemOut }
    ])
  }

  const openModalWithHelpOfBarcodeScan = async (barcode: string) => {
    const creds: SearchByBarcodeCredentials = {
      comp_id: loginStore?.comp_id,
      bar_code: barcode
    }
    // setSearch(barcode)
    const filtered = items.filter(
      (item: ItemsData) =>
        item?.item_name?.toLowerCase().includes(barcode) || // Check if item_name contains the query
        item?.bar_code?.toString()?.toLowerCase().includes(barcode.toLowerCase()) || // Check if item_name contains the query
        item?.item_id?.toString().toLowerCase().includes(barcode), // Check if item_id contains the query
    )
    console.log(filtered, 'filtered==============================')
    setFilteredItems(filtered)
    if (filtered.length === 0) {
      ToastAndroid.show("No product found.", ToastAndroid.SHORT)
      return
    } else {
      console.log(filtered[0], 'filtered==============================')
      // productDetails(filtered[0])
      setQuantity(1)
      setPrice(filtered[0]?.sale_price)
      setDiscountState(filtered[0]?.discount)
      setStock(filtered[0]?.stock)
      console.log(filtered[0]?.sale_price, filtered[0]?.discount, filtered[0]?.stock)

      for (let item of addedProductsList) {
        if (item?.id === product?.id) {
          ToastAndroid.show(
            "Item already exists. Please edit from the list.",
            ToastAndroid.LONG,
          )
          return
        }
      }

      setAddedProductsList(prevProducts => [
        {
          ...filtered[0],
          quantity: 1,
          price: filtered[0]?.sale_price,
          discount: filtered[0]?.discount,
          stock: filtered[0]?.stock
        },
        ...prevProducts
      ])


    }

    // await fetchProductByBarcode(creds).then(res => {
    //   if (res?.msg?.length === 0) {
    //     ToastAndroid.show("No product found.", ToastAndroid.SHORT)
    //     return
    //   } else {
    //     productDetails(res?.msg[0])
    //   }
    // }).catch(err => {
    //   ToastAndroid.show("Some error while fetching product by barcode..." + err, ToastAndroid.SHORT)
    // })
  }

  useEffect(() => {
    if (isFocused) {
      if (params?.navigatedFromCamera === true) {
        openModalWithHelpOfBarcodeScan(params?.barcode).then(() => {
          navigation.dispatch(CommonActions.setParams({ navigatedFromCamera: false }))
        })
      }
    }
  }, [isFocused])

  return (
    // <SafeAreaView
    //   style={[styles.container, { backgroundColor: theme.colors.background }]}>
    //   <DialogBox
    //     iconSize={40}
    //     visible={visible}
    //     hide={hideDialog}
    //     titleStyle={styles.title}
    //     btnSuccess={!editState ? "ADD" : "UPDATE"}
    //     onFailure={onDialogFailure}
    //     onSuccess={
    //       !editState
    //         ? onDialogSuccessChange
    //         : () => onDialogUpdateChange(product)
    //     }>
    //     <View style={styles.modalContainer}>
    //       <View style={{ alignItems: "center" }}>
    //         <View>
    //           <Text
    //             variant="titleLarge"
    //             style={{ color: '#008181' }}>
    //             {product?.item_name}
    //           </Text>

    //         </View>
    //       <Text variant="labelMedium" style={{ color: "red",backgroundColor:"pink" }}>{updatedStock< product?.low_stock_qty && receiptSettings.stock_alert_flag === "Y"? "Low stock!":""}</Text>
    //       {/* <Text variant="labelMedium" style={{ color: "red",backgroundColor:"pink" }}>{updatedStock},{low_stock_qty}</Text> */}

    //       </View>

    //       <View
    //         style={{
    //           borderBottomWidth: 0.3,
    //           borderColor: theme.colors.primary,
    //           margin: 10,

    //           borderStyle: "dashed",
    //         }}>
    //         <View
    //           style={{
    //             flexDirection: "row",
    //             justifyContent: "space-between",
    //             alignItems: "center",
    //             padding: 5,
    //             // borderBottomWidth: 1,
    //             borderColor: theme.colors.primary,
    //           }}>
    //           <Text variant="labelMedium" style={{color:'gray'}}>PRODUCT ID</Text>
    //           <Text variant="labelMedium" style={{color:'gray'}}>{product?.id}</Text>
    //         </View>

    //         {receiptSettings?.unit_flag === "Y" && (
    //           <View
    //             style={{
    //               flexDirection: "row",
    //               justifyContent: "space-between",
    //               alignItems: "center",
    //               padding: 5,
    //             }}>
    //             <Text variant="labelMedium" style={{color:'gray'}}>UNIT</Text>
    //             <Text variant="labelMedium" style={{color:'gray'}}>{product?.unit_name || ""}</Text>
    //           </View>
    //         )}
    //       </View>

    //       <View
    //         style={
    //           receiptSettings?.price_type === "A" && {
    //             borderBottomWidth: 0.3,
    //             borderColor: theme.colors.primary,
    //             margin: 10,

    //             borderStyle: "dashed",
    //           }
    //         }>
    //         <View
    //           style={{
    //             flexDirection: "row",
    //             justifyContent: "space-between",
    //             alignItems: "center",
    //             padding: 5,
    //           }}>
    //           {receiptSettings?.price_type === "A" ? (
    //             <>
    //               <Text variant="labelMedium" style={{color:'gray'}}>UNIT PRICE</Text>
    //               <Text variant="labelMedium" style={{color:'gray'}}>₹{product?.price}</Text>
    //             </>
    //           ) : (
    //             <View
    //               style={{
    //                 flex: 1,
    //                 justifyContent: "center",
    //                 paddingHorizontal: 5,
    //               }}>
    //               <InputPaper
    //                 label="Unit Price"
    //                 onChangeText={(txt: number) => setPrice(txt)}
    //                 value={price}
    //                 keyboardType="numeric"
    //                 autoFocus={true}
    //                 mode="outlined"
    //               />
    //             </View>
    //           )}
    //         </View>
    //       </View>

    //       {receiptSettings?.stock_flag === "Y" && (
    //         <View
    //           style={{
    //             borderBottomWidth: 0.3,
    //             borderColor: theme.colors.primary,
    //             margin: 10,

    //             borderStyle: "dashed",
    //           }}>
    //           <View
    //             style={{
    //               flexDirection: "row",
    //               justifyContent: "space-between",
    //               alignItems: "center",
    //               padding: 5,
    //             }}>
    //             <Text variant="labelMedium" style={{color:'gray'}}>STOCK AVAILABLE</Text>
    //             <Text variant="labelMedium" style={{color:'gray'}}>{updatedStock || stock}</Text>

    //           </View>
    //         </View>
    //       )}

    //       {receiptSettings?.gst_flag === "Y" && (
    //         <View
    //           style={{
    //             borderBottomWidth: 0.3,
    //             borderColor: theme.colors.primary,
    //             margin: 10,
    //             marginBottom:10,
    //             borderStyle: "dashed",
    //           }}>
    //           <View style={{ flexDirection: "column", width: "100%" }}>
    //             <View
    //               style={{
    //                 flexDirection: "row",
    //                 justifyContent: "space-between",
    //                 alignItems: "center",
    //                 padding: 5,
    //                 borderColor: theme.colors.primary,
    //                 borderStyle: "dashed",
    //               }}>
    //               <Text variant="labelMedium" style={{color:'gray'}}>CGST</Text>
    //               <Text variant="labelMedium" style={{color:'gray'}}>{product?.cgst || ""}%</Text>
    //             </View>
    //             <View
    //               style={{
    //                 flexDirection: "row",
    //                 justifyContent: "space-between",
    //                 alignItems: "center",
    //                 padding: 5,
    //               }}>
    //               <Text variant="labelMedium" style={{color:'gray'}}>SGST</Text>
    //               <Text variant="labelMedium" style={{color:'gray'}}>{product?.sgst || ""}%</Text>
    //             </View>
    //           </View>
    //         </View>
    //       )}

    //       <View
    //         style={{
    //           flexDirection: "row",
    //           justifyContent: "space-between",
    //           alignItems: "center",
    //           marginHorizontal: 7,
    //           gap: 5,
    //         }}>
    //         <View
    //           style={
    //             receiptSettings?.discount_flag === "Y" &&
    //               receiptSettings?.discount_position !== "B"
    //               ? { width: "50%" }
    //               : { width: "100%" }
    //           }>
    //           <InputPaper
    //             label={`Quantity (${(receiptSettings?.unit_flag === "Y" && product?.unit_name) ||
    //               ""
    //               })`}
    //             onChangeText={(txt: number) => setQuantity(txt)}
    //             value={quantity}
    //             keyboardType="numeric"
    //             autoFocus={true}
    //             mode="outlined"
    //           />
    //         </View>
    //         {receiptSettings?.discount_flag === "Y" &&
    //           receiptSettings?.discount_position !== "B" && (
    //             <View style={{ width: "50%" }}>
    //               <InputPaper
    //                 selectTextOnFocus
    //                 label={
    //                   receiptSettings?.discount_type === "A"
    //                     ? "Discount (₹)"
    //                     : "Discount (%)"
    //                 }
    //                 onChangeText={(dis: number) => setDiscountState(dis)}
    //                 value={discountState}
    //                 keyboardType="numeric"
    //                 mode="outlined"
    //               />
    //             </View>
    //           )}
    //       </View>
    //       {editState && (
    //         <View
    //           style={{
    //             marginBottom: normalize(-15),
    //             marginTop: normalize(10),
    //             paddingHorizontal: normalize(10),
    //           }}>
    //           <ButtonPaper
    //             mode="text"
    //             textColor={theme.colors.onPurple}
    //             buttonColor={theme.colors.purple}
    //             icon="trash-can-outline"
    //             onPress={() => handleOnDelete(product)}>
    //             DELETE ITEM
    //           </ButtonPaper>
    //         </View>
    //       )}
    //     </View>
    //   </DialogBox>
    //   <ScrollView keyboardShouldPersistTaps="handled">
    //     <View style={{ alignItems: "center" }}>
    //       <HeaderImage
    //         imgLight={productHeader}
    //         imgDark={productHeaderDark}
    //         borderRadius={30}
    //         blur={10}
    //         isBackEnabled>
    //         My Products
    //       </HeaderImage>
    //     </View>

    //     <View
    //       style={{
    //         paddingHorizontal: normalize(25),
    //         paddingBottom: normalize(10),
    //         flexDirection: "row",
    //         justifyContent: "center",
    //         alignItems: "center",
    //         width: "100%",
    //       }}>
    //       {/* <View style={{ width: "85%" }}> */}
    //       <Searchbar
    //         ref={searchProductRef}
    //         placeholder="Search Items or ID"
    //         onChangeText={onChangeSearch}
    //         value={search}
    //         elevation={search && 2}
    //         // loading={search ? true : false}
    //         autoFocus
    //         style={{
    //           // backgroundColor: theme.colors.vanillaSecondaryContainer,
    //           backgroundColor: '#fbf1cb',
    //           color: '#fbf1cb',
    //         }}
    //         traileringIcon={"barcode-scan"}
    //         traileringIconColor={theme.colors.purple}
    //         onTraileringIconPress={
    //           () => navigation.dispatch(
    //             CommonActions.navigate(navigationRoutes.cameraScreen)
    //           )
    //         }
    //       />
    //       {/* </View> */}

    //       {/* <View style={{ width: "15%" }}>
    //         <IconButton
    //           icon="barcode-scan"
    //           onPress={() => navigation.dispatch(
    //             CommonActions.navigate(navigationRoutes.cameraScreen)
    //           )}
    //           size={30}
    //           iconColor={theme.colors.purple}
    //         />
    //       </View> */}

    //     </View>

    //     <View style={{ paddingBottom: PixelRatio.roundToNearestPixel(10) }}>
    //       {search && (
    //         <ScrollableListContainer
    //           backgroundColor={'#fbf1cb'}>
    //           {filteredItems.map(item => (
    //             <ProductListSuggestion
    //               key={item?.id}
    //               itemName={item?.item_name}
    //               onPress={() => productDetails(item)}
    //               unitPrice={item?.price}
    //             />
    //           ))}
    //         </ScrollableListContainer>
    //       )}

    //       {addedProductsList.length > 0 && !search && (
    //         <>
    //           <ScrollableListContainer
    //             backgroundColor={theme.colors.secondaryContainer}>
    //             {addedProductsList.map(item => {
    //               totalPrice += item?.price * item["quantity"]

    //               receiptSettings?.discount_flag === "Y"
    //                 ? receiptSettings?.discount_position === "I"
    //                   ? receiptSettings?.discount_type === "A"
    //                     ? (totalDiscountedAmount += parseFloat(
    //                       //@ts-ignore
    //                       item["discount"] * item["quantity"],
    //                     ))
    //                     : (totalDiscountedAmount += parseFloat(
    //                       (
    //                         (item?.price *
    //                           item["quantity"] *
    //                           item["discount"]) /
    //                         100
    //                       ).toFixed(2),
    //                     ))
    //                   : receiptSettings?.discount_type === "A"
    //                     ? (totalDiscountedAmount = discountBillwise)
    //                     : (totalDiscountedAmount += parseFloat(
    //                       (
    //                         (item?.price *
    //                           item["quantity"] *
    //                           discountBillwise) /
    //                         100
    //                       ).toFixed(2),
    //                     ))
    //                 : (totalDiscountedAmount = 0)

    //               console.log("totalDiscount", totalDiscountedAmount)

    //               return (
    //                 <AddedProductList
    //                   key={item?.id}
    //                   itemName={item?.item_name}
    //                   quantity={item["quantity"]}
    //                   unitPrice={item["price"]}
    //                   discount={
    //                     receiptSettings?.discount_flag === "Y"
    //                       ? item["discount"]
    //                       : 0
    //                   }
    //                   unit={item["unit_name"]}
    //                   onPress={() => productEditAndDelete(item)}
    //                 />
    //               )
    //             })}
    //           </ScrollableListContainer>

    //           {receiptSettings?.kot_flag === "Y"
    //             && <View style={{
    //               paddingHorizontal: SCREEN_WIDTH / 10.5,
    //               paddingTop: 14,
    //             }}>
    //               <InputPaper
    //                 customStyle={{
    //                   backgroundColor: theme.colors.primaryContainer,
    //                 }}
    //                 selectTextOnFocus
    //                 label={
    //                   "Table No."
    //                 }
    //                 onChangeText={(tbleNo: number) => setTableNo(tbleNo)}
    //                 value={tableNo}
    //                 keyboardType="numeric"
    //                 mode="flat"
    //               />
    //             </View>}
    //         </>
    //       )}

    //       {totalPrice > 0 && (
    //         <>
    //           <NetTotalButton
    //             disabled
    //             // backgroundColor={theme.colors.greenContainer}
    //             backgroundColor={'#008181'}
    //             textColor={'white'}
    //             addedProductsList={addedProductsList}
    //             netTotal={totalPrice}
    //             totalDiscount={totalDiscountedAmount}
    //             onPress={() =>
    //               ToastAndroid.showWithGravityAndOffset(
    //                 "Printing feature will be added in some days.",
    //                 ToastAndroid.SHORT,
    //                 ToastAndroid.CENTER,
    //                 25,
    //                 50,
    //               )
    //             }
    //           />
    //           <View
    //             style={{
    //               paddingTop: normalize(15),
    //               // width: SCREEN_WIDTH / 1.16,
    //               flexDirection: "row",
    //               alignItems: "center",
    //               justifyContent: "space-evenly",
    //               // justifyContent: "center",
    //               paddingHorizontal: normalize(40)
    //             }}>
    //             {/* <ButtonPaper
    //               mode="text"
    //               textColor={theme.colors.purple}
    //               // onPress={handleMemOut}
    //               onPress={handleMemOut}
    //               icon={"arrow-right-thick"}>
    //               Mem Out
    //             </ButtonPaper> */}

    //             <ButtonPaper mode="text" textColor={theme.colors.error} icon={"hand-back-left-outline"} onPress={onHoldClick}>
    //               Hold
    //             </ButtonPaper>
    //             <ButtonPaper
    //               mode="text"
    //               textColor={'#008181'}
    //               onPress={handleNextScreen}
    //               icon={"arrow-right-thick"}>
    //               Next
    //             </ButtonPaper>
    //             {/* <ButtonPaper
    //               mode="text"
    //               textColor={theme.colors.purple}
    //               onPress={handleMemorize}
    //               icon={"arrow-right-thick"}>
    //               Memorization
    //             </ButtonPaper> */}

    //             {/* <IconButton icon={"restart"} onPress={onGetHoldBillOut} iconColor={theme.colors.green} disabled={productStorage.getAllKeys().length === 0} /> */}

    //           </View>
    //         </>
    //       )}
    //     </View>
    //   </ScrollView>
    //   {
    //     isDataAvailable && <AnimatedFABPaper
    //       icon="restart"
    //       label="Get"
    //       onPress={onGetHoldBillOut}
    //       // extended={isExtended}
    //       animateFrom="right"
    //       iconMode="dynamic"
    //       customStyle={styles.fabStyle}
    //       variant="primary"
    //       disabled={!isDataAvailable}
    //     />
    //   }
    // </SafeAreaView>
    <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? 'black' : '#f5f9ff' }]}>
      <DialogBox
        iconSize={40}
        visible={visible}
        hide={hideDialog}
        titleStyle={styles.title}
        btnSuccess={!editState ? "ADD" : "UPDATE"}
        onFailure={onDialogFailure}
        onSuccess={!editState ? onDialogSuccessChange : () => onDialogUpdateChange(product)}>
        <View style={styles.modalContainer}>
          <View style={{ alignItems: "center" }}>
            <Text variant="titleLarge" style={{ color: colorScheme === 'dark' ? '#009689' : '#008181' }}>{product?.item_name}</Text>
            <Text variant="labelMedium" style={{ color: "red", backgroundColor: "pink" }}>
              {updatedStock < product?.low_stock_qty && receiptSettings.stock_alert_flag === "Y" && receiptSettings.stock_flag === "Y" ? "Low stock!" : ""}
            </Text>
          </View>

          <View style={{ borderBottomWidth: 0.3, borderColor: colorScheme === 'dark' ? '#009689' : '#008181', margin: 10, borderStyle: "dashed" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 5 }}>
              <Text variant="labelMedium" style={{ color: colorScheme === 'dark' ? 'white' : 'gray', fontWeight: '800' }}>PRODUCT ID</Text>
              <Text variant="labelMedium" style={{ color: colorScheme === 'dark' ? 'white' : 'gray' }}>{product?.item_id}</Text>
            </View>
            {receiptSettings?.unit_flag === "Y" && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 5 }}>
                <Text variant="labelMedium" style={{ color: colorScheme === 'dark' ? 'white' : 'gray' }}>UNIT</Text>
                <Text variant="labelMedium" style={{ color: colorScheme === 'dark' ? 'white' : 'gray' }}>{product?.unit_name || ""}</Text>
              </View>
            )}
          </View>

          <View style={{ borderBottomWidth: 0.3, borderColor: colorScheme === 'dark' ? '#009689' : '#008181', margin: 10, borderStyle: "dashed" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 5 }}>
              {receiptSettings?.price_type === "A" ? (
                <>
                  <Text variant="labelMedium" style={{ color: colorScheme === 'dark' ? 'white' : 'gray' }}>UNIT PRICE</Text>
                  <Text variant="labelMedium" style={{ color: colorScheme === 'dark' ? 'white' : 'gray' }}>₹{product?.price}</Text>
                </>
              ) : (
                <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 5 }}>
                  <InputPaper
                    label="Unit Price"
                    onChangeText={(txt: any) => setPrice(txt)}
                    value={price}
                    keyboardType="numeric"
                    autoFocus={true}
                    mode="outlined"
                  />
                </View>
              )}
            </View>
          </View>

          {receiptSettings?.stock_flag === "Y" && (
            <View style={{ borderBottomWidth: 0.3, borderColor: '#008181', margin: 10, borderStyle: "dashed" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 5 }}>
                <Text variant="labelMedium" style={{ color: 'gray' }}>STOCK AVAILABLE</Text>
                <Text variant="labelMedium" style={{ color: 'gray' }}>{updatedStock || stock}</Text>
              </View>
            </View>
          )}

          {receiptSettings?.gst_flag === "Y" && (
            <View style={{ borderBottomWidth: 0.3, borderColor: '#008181', margin: 10, borderStyle: "dashed" }}>
              <View style={{ flexDirection: "column", width: "100%" }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 5 }}>
                  <Text variant="labelMedium" style={{ color: 'gray' }}>CGST</Text>
                  <Text variant="labelMedium" style={{ color: 'gray' }}>{product?.cgst || ""}%</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 5 }}>
                  <Text variant="labelMedium" style={{ color: 'gray' }}>SGST</Text>
                  <Text variant="labelMedium" style={{ color: 'gray' }}>{product?.sgst || ""}%</Text>
                </View>
              </View>
            </View>
          )}

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 7, gap: 5 }}>
            <View style={receiptSettings?.discount_flag === "Y" && receiptSettings?.discount_position !== "B" ? { width: "50%" } : { width: "100%" }}>
              <InputPaper
                label={`Quantity (${(receiptSettings?.unit_flag === "Y" && product?.unit_name) || ""})`}
                onChangeText={(txt: any) => setQuantity(txt)}
                value={quantity}
                keyboardType="numeric"
                autoFocus={true}
                mode="outlined"
              />
            </View>
            {receiptSettings?.discount_flag === "Y" && receiptSettings?.discount_position !== "B" && (
              <View style={{ width: "50%" }}>
                <InputPaper
                  selectTextOnFocus
                  label={receiptSettings?.discount_type === "A" ? "Discount (₹)" : "Discount (%)"}
                  onChangeText={(dis: any) => setDiscountState(dis)}
                  value={discountState}
                  keyboardType="numeric"
                  mode="outlined"
                />
              </View>
            )}
          </View>

          {editState && (
            <View style={{ marginBottom: normalize(-15), marginTop: normalize(10), paddingHorizontal: normalize(10) }}>
              <ButtonPaper
                mode="text"
                textColor={theme.colors.onPurple}
                buttonColor={theme.colors.purple}
                icon="trash-can-outline"
                onPress={() => handleOnDelete(product)}>
                DELETE ITEM
              </ButtonPaper>
            </View>
          )}
        </View>
      </DialogBox>

      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: "center" }}>
          <HeaderImage
            imgLight={productHeader}
            imgDark={productHeaderDark}
            borderRadius={30}
            blur={10}
            isBackEnabled>
            My Products
          </HeaderImage>
        </View>

        <View style={{ paddingHorizontal: normalize(25), paddingBottom: normalize(10), flexDirection: "row", justifyContent: "center", alignItems: "center", width: "100%" }}>
          <Searchbar
            ref={searchProductRef}
            placeholder="Search Items or ID"
            onChangeText={onChangeSearch}
            value={search}
            elevation={search && 2}
            autoFocus
            style={{ backgroundColor: colorScheme === 'dark' ? '#2e2929ff' : '#def0ddff', color: '#fbf1cb' }}
            traileringIcon="barcode-scan"
            traileringIconColor={colorScheme === 'dark' ? '#009689' : '#008181'}
            onTraileringIconPress={() => navigation.dispatch(CommonActions.navigate(navigationRoutes.cameraScreen))}
          />
        </View>

        <View style={{ paddingBottom: PixelRatio.roundToNearestPixel(10) }}>
          {search && (
            <ScrollableListContainer backgroundColor={colorScheme === 'dark' ? '#2e2929ff' : '#fbf1cb'}>
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

          {addedProductsList.length > 0 && !search && (
            <>
              <ScrollableListContainer backgroundColor={colorScheme === 'dark' ? '#2e2929ff' : '#008181'}>
                {addedProductsList.map(item => {


                  totalPrice += item?.price * item["quantity"]

                  receiptSettings?.discount_flag === "Y"
                    ? receiptSettings?.discount_position === "I"
                      ? receiptSettings?.discount_type === "A"
                        ? (totalDiscountedAmount += parseFloat(
                          //@ts-ignore
                          item["discount"] * item["quantity"],
                        ))
                        : (totalDiscountedAmount += parseFloat(
                          (
                            (item?.price *
                              item["quantity"] *
                              item["discount"]) /
                            100
                          ).toFixed(2),
                        ))
                      : receiptSettings?.discount_type === "A"
                        ? (totalDiscountedAmount = discountBillwise)
                        : (totalDiscountedAmount += parseFloat(
                          (
                            (item?.price *
                              item["quantity"] *
                              discountBillwise) /
                            100
                          ).toFixed(2),
                        ))
                    : (totalDiscountedAmount = 0)

                  // console.log("totalDiscount", totalDiscountedAmount)
                  return (
                    <AddedProductList
                      key={item?.id}
                      itemName={item?.item_name}
                      quantity={item["quantity"]}
                      unitPrice={item["price"]}
                      discount={receiptSettings?.discount_flag === "Y" ? item["discount"] : 0}
                      unit={item["unit_name"]}
                      onPress={() => productEditAndDelete(item)}
                    />
                  );
                })}
              </ScrollableListContainer>

              {receiptSettings?.kot_flag === "Y" && (
                <View style={{ paddingHorizontal: SCREEN_WIDTH / 10.5, paddingTop: 14 }}>
                  <InputPaper
                    customStyle={{ backgroundColor: theme.colors.primaryContainer }}
                    selectTextOnFocus
                    label="Table No."
                    onChangeText={(tbleNo: any) => setTableNo(tbleNo)}
                    value={tableNo}
                    keyboardType="numeric"
                    mode="flat"
                  />
                </View>
              )}
            </>
          )}

          {totalPrice > 0 && (
            <>
              <NetTotalButton
                disabled
                backgroundColor={colorScheme === 'dark' ? '#009689' : '#008181'}
                textColor={'white'}
                addedProductsList={addedProductsList}
                netTotal={totalPrice}
                totalDiscount={totalDiscountedAmount}
                onPress={() => ToastAndroid.showWithGravityAndOffset("Printing feature will be added in some days.", ToastAndroid.SHORT, ToastAndroid.CENTER, 25, 50)}
              />
              <View style={{ paddingTop: normalize(15), flexDirection: "row", alignItems: "center", justifyContent: "space-evenly", paddingHorizontal: normalize(40) }}>
                <ButtonPaper mode="text" textColor={colorScheme === 'dark' ? 'red' : theme.colors.error} icon="hand-back-left-outline" onPress={onHoldClick}>
                  Hold
                </ButtonPaper>
                <ButtonPaper mode="text" textColor={colorScheme === 'dark' ? '#009689' : '#008181'} onPress={handleNextScreen} icon="arrow-right-thick">
                  Next
                </ButtonPaper>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {isDataAvailable && (
        <AnimatedFABPaper
          icon="restart"
          label="Get"
          onPress={onGetHoldBillOut}
          animateFrom="right"
          iconMode="dynamic"
          customStyle={styles.fabStyle}
          variant="primary"
          disabled={!isDataAvailable}
        />
      )}
    </SafeAreaView>

  )
}

export default ProductsScreen

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  title: {
    textAlign: "center",
  },
  modalContainer: {
    justifyContent: "space-between",
    minHeight: normalize(230),
    height: "auto",
  },
  fabStyle: {
    bottom: normalize(16),
    right: normalize(16),
    position: "absolute",
  },
})
