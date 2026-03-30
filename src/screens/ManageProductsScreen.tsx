import {
  View,
  ScrollView,
  StyleSheet,
  PixelRatio,
  ToastAndroid,
  useColorScheme,
} from "react-native"
import React, { useCallback, useContext, useEffect, useRef, useState } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { Button, IconButton, List, Searchbar, Text, Dialog, Portal, RadioButton } from "react-native-paper"
import normalize, { SCREEN_HEIGHT, SCREEN_WIDTH } from "react-native-normalize"
import HeaderImage from "../components/HeaderImage"
import { flowerHome, flowerHomeDark } from "../resources/images"
import ScrollableListContainer from "../components/ScrollableListContainer"
import ProductListSuggestion from "../components/ProductListSuggestion"
import { usePaperColorScheme } from "../theme/theme"
import DialogBox from "../components/DialogBox"
import InputPaper from "../components/InputPaper"
import { clearStates } from "../utils/clearStates"
import { Switch } from 'react-native';
// import {
//   BottomSheetModal,
//   BottomSheetModalProvider,
//   BottomSheetView
// } from '@gorhom/bottom-sheet';
import {
  AddItemCredentials,
  ItemEditRequestCredentials,
  ItemsData,
} from "../models/api_types"
import { Checkbox } from 'react-native-paper';
import { loginStorage } from "../storage/appStorage"
import { CommonActions, useIsFocused, useNavigation, useRoute } from "@react-navigation/native"
import useEditItem from "../hooks/api/useEditItem"
import { AppStore } from "../context/AppContext"
import AnimatedFABPaper from "../components/AnimatedFABPaper"
import useAddItem from "../hooks/api/useAddItem"
import MenuPaper from "../components/MenuPaper"
import { AppStoreContext } from "../models/custom_types"
import { ToggleButton } from 'react-native-paper';
import { SegmentedButtons } from 'react-native-paper';
import { TouchableOpacity } from "react-native-gesture-handler"
import ButtonPaper from "../components/ButtonPaper"
import DatePicker from "react-native-date-picker"
import navigationRoutes from "../routes/navigationRoutes"
import { CameraScreenRouteProp } from "../models/route_types"
export default function ManageProductsScreen() {
  const theme = usePaperColorScheme()
  const colorScheme = useColorScheme()
  const isFocused = useIsFocused()
  const [value, setValue] = useState('1');
  const { items, handleGetItems, units, handleGetUnits, categories, handleGetCategories, receiptSettings } =
    useContext<AppStoreContext>(AppStore)
  const [value_pp, setValue_pp] = React.useState('1');
  const { params } = useRoute<CameraScreenRouteProp>()

  const [value_sp, setValue_sp] = React.useState('1');
  const [value_disc, setValue_disc] = React.useState('1');
  const refRBSheet = useRef<any>(null);
  const [visible_sp, setVisible_sp] = React.useState(false);
  const [visible_pp, setVisible_pp] = React.useState(false);
  const [visible_disc, setVisible_disc] = React.useState(false);
  const bottomSheetModalRef = useRef(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const toggleSwitch = () => setIsEnabled(previousState => !previousState);
  const toggleStockAlert = () => setChecked(previousState => !previousState);
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);
  const [visibleCatList, setVisibleCatList] = useState(false)
  const [visibleUnitList, setVisibleUnitList] = useState(false)
  const handleSheetChanges = useCallback((index) => {
    console.log('Bottom sheet index changed to', index);
  }, []);
  const openSheet = () => {
    refRBSheet.current?.open();
  };
  const [low_qty, setLowQty] = useState(10)
  const loginStore = JSON.parse(loginStorage.getString("login-data"))
  const [checked, setChecked] = React.useState(false);
  const { editItem } = useEditItem()
  const { sendAddedItem } = useAddItem()
  const [openMfgDate,setOpenMfgDate] = useState(false)
  const [openExp,setOpenExp] =  useState(false)
  const [visible, setVisible] = useState(() => false)
  const hideDialog_sp = () => setVisible_sp(() => false)
  const hideDialog_pp = () => setVisible_pp(() => false)
  const hideDialog_disc = () => setVisible_disc(() => false)
  const [visibleAdd, setVisibleAdd] = useState(() => false)
  const hideDialogAdd = () => setVisibleAdd(() => false)
  const [openToDate, setOpenToDate] = useState(false)
  const [openAsOn, setOpenAsOn] = useState(false)
  // const [unit_name,setUnitName] = useState<string>(() => "")
  const [search, setSearch] = useState<string>(() => "")
  const [filteredItems, setFilteredItems] = useState<ItemsData[]>(() => [])
  const [opening_stock, setOpeningStock] = useState<number>(() => 0)
  const [purchase_price, setPurchasePrice] = useState<number>(() => 0)
  const [sale_price, setSalePrice] = useState<number>(() => 0)
  const [barcode, setBarcode] = useState<string>(() => "")
  const [desc, setDesc] = useState<string>(() => "")
  const [isExtended, setIsExtended] = useState(() => true)
  const [as_on, setAsOn] = useState(() => new Date())
  const [product, setProduct] = useState<ItemsData>()
  const [batchWise, setBatchWise] = useState(false)


  const [price, setPrice] = useState<number>(() => product?.price || 0)
  const [discount, setDiscount] = useState<number>(() => product?.discount || 0)
  const [CGST, setCGST] = useState<number>(() => product?.cgst || 0)
  const [SGST, setSGST] = useState<number>(() => product?.sgst || 0)
  const [loading, setLoading] = useState<boolean>(false)
  const [hsnCode, setHsnCode] = useState<string>(() => "")
  const [batch_no, setBatchNo] = useState<string>(() => "0")
  const [expiry_date, setExpiryDate] = useState(() => new Date())
  const [mfg_date, setMfgDate] = useState(() => new Date())
  const [opening_dt, setOpeningDt] = useState<string>(() => "0")
  const [productName, setProductName] = useState<string>(
    () => product?.item_name || "",
  )
  const [status, setStatus] = React.useState('checked');
  const options = [{ val: 0, name: 'Add Product' }, { val: 1, name: 'Edit Product' }];
  const [toDate, setToDate] = useState(() => new Date())

  const subOptions = [{ val: 0, name: 'Pricing' }, { val: 1, name: 'Stock' }, { val: 2, name: 'Others' }];
  const subOptionsEdit = [{ val: 0, name: 'Pricing' }, { val: 2, name: 'Others' }];
  const onButtonToggle = value => {
    setStatus(status === 'checked' ? 'unchecked' : 'checked');
  };
  // const []
  const [selected, setSelected] = useState(options[0].val);
  const [selectedSub, setSelectedSub] = useState(subOptions[0].val);
  const [unitName, setUnitName] = useState<string>(() => "") // not sent to api (adding product)
  const [unitId, setUnitId] = useState<number>(() => undefined)
  const [itemDesc, setItemDesc] = useState<string>(() => "")
  const [categoryName, setCategoryName] = useState<string>(() => "") // not sent to api (adding product)
  const [categoryId, setCategoryId] = useState<number>(() => undefined)
  const [discountFlag, setDiscountFlag] = useState(false)
  const [exlusive_gst_pp, setExclusive_gst_pp] = useState(0)
  const [exlusive_gst_sp, setExclusive_gst_sp] = useState(0)
  const [isGstVisible,setIsGstVisible] =  useState(false)
  const navigation = useNavigation()
  let unitMenuArr = []
  for (const unit of units) {
    unitMenuArr.push({
      title: unit?.unit_name,
      func: () => handleSetUnitNameAndId(unit?.unit_name, unit?.sl_no),
    })
  }
  useEffect(() => {
    console.log('receiptsettings', receiptSettings)
    setDiscountFlag(receiptSettings?.discount_flag === 'Y' ? true : false)
  }, [])

  useEffect(() => {
    console.log('focused=========================')
    if (isFocused) {
      if (params?.navigatedFromCamera === true) {
        console.log("PARAMS IN MANAGE PRODUCTS SCREEN: ", params)
        // openModalWithHelpOfBarcodeScan(params?.barcode).then(() => {
        //   navigation.dispatch(CommonActions.setParams({ navigatedFromCamera: false }))
        // })
        setBarcode(params?.barcode)
      }
    }
  }, [isFocused])
  let categoryMenuArr = []
  for (const category of categories) {
    categoryMenuArr.push({
      title: category?.category_name,
      func: () => handleSetCategoryNameAndId(category?.category_name, category?.sl_no),
    })
  }
  const menuGstArr = [
    { title: "Exempted", val: 0 },
    { title: "0%", val: 0 },
    { title: "2.5%", val: 2.5 },
    { title: "5%", val: 5 },
    { title: "18%", val: 18 },
    { title: "40%", val: 40 },
  ]
  const handleSetUnitNameAndId = (unitName: string, unitId: number) => {
    setUnitName(unitName)
    setUnitId(unitId)
    console.log(unitId)
    setVisibleUnitList(false)
  }
  const handleSetGst = (gst_name: string, gst_val: number) => {
    setCGST(gst_val)
    // setUnitId(unitId)
    console.log(unitId)
    setIsGstVisible(false)
  }
  const handleSetCategoryNameAndId = (catName: string, catId: number) => {
    setCategoryName(catName)
    setCategoryId(catId)
    console.log(catId)
    setVisibleCatList(false)
  }

  const onScroll = ({ nativeEvent }) => {
    const currentScrollPosition = Math.floor(nativeEvent?.contentOffset?.y) ?? 0
    setIsExtended(currentScrollPosition <= 0)
  }

  const onChangeSearch = (query: string) => {
    setSearch(query)
    setVisible(true)
    setProduct(undefined)
    // Convert the query to lowercase (or uppercase) for case-insensitive comparison
    const lowerCaseQuery = query.toLowerCase()

    const filtered = items.filter(
      (item: ItemsData) =>
        item?.item_name?.toLowerCase().includes(lowerCaseQuery), // Convert each item_name to lowercase (or uppercase) as well
    )
    setFilteredItems(filtered)

    // Clear the filtered items if the query is empty
    if (query === "") setFilteredItems(() => [])
  }

  const handleUpdateProductDetails = async () => {
    if (!productName) {
      ToastAndroid.show("Add Product Name", ToastAndroid.SHORT)
      return
    }
    if (!categoryId) {
      ToastAndroid.show("Add Category", ToastAndroid.SHORT)
      return
    }
    if (!unitId) {
      ToastAndroid.show("Add Unit ID.", ToastAndroid.SHORT)
      return
    }



    // if (!price) {
    //   ToastAndroid.show("Add Price", ToastAndroid.SHORT)
    //   return
    // }
    if (!purchase_price) {
      ToastAndroid.show("Add Purchase Sale", ToastAndroid.SHORT)
      return
    }
    if (!sale_price) {
      ToastAndroid.show("Add Selling Price", ToastAndroid.SHORT)
      return
    }
    let editedItemObject: ItemEditRequestCredentials = {
      comp_id: +loginStore?.comp_id,
      item_id: +product?.item_id,
      price: +sale_price,
      discount: discount,
      cgst: CGST,
      sgst: SGST,
      modified_by: loginStore?.user_name,
      unit_id: +unitId,
      catg_id: +categoryId,
      selling_price: +sale_price,
      purchase_price: +purchase_price,
      barcode: barcode,
      description: desc,
      alert: checked ? 'Y' : 'N',
      item_name: productName,
      pp_gst_flag: value_pp == '0' ? 'N' : 'Y',
      sp_gst_flag: value_sp == '0' ? 'N' : 'Y',

    }

    console.log("EDITED ITEM OBJECT: ", editedItemObject)
    setLoading(true)

    await editItem(editedItemObject)
      .then(res => {
        setLoading(false)
        ToastAndroid.show("Product updated successfully.", ToastAndroid.SHORT)
        handleGetItems()
        handleGetUnits()
        handleGetCategories()
        setProduct(undefined)
      })
      .catch(err => {
        console.log(err)
        ToastAndroid.show(
          err,
          ToastAndroid.SHORT,
        )
      })
  }

  const onDialogFailure = () => {
    clearStates([setDiscount, setCGST, setSGST], () => 0)
    clearStates([setPrice, setUnitId, setCategoryId], () => undefined)
    clearStates([setSearch, setUnitName, setProductName, setCategoryName], () => "")
    setVisible(!visible)
  }

  const onDialogSuccecss = () => {
    if (+sale_price <= 0) {
      ToastAndroid.show("Try adding some price.", ToastAndroid.SHORT)
      return
    }

    if (selected == 1) {
      handleUpdateProductDetails()
        .then(() => {
          clearStates(
            [
              setSearch,
              setDiscount,
              setCGST,
              setSGST,
              setUnitName,
              setCategoryName,
              setProductName,
            ],
            () => "",
          )
          clearStates([setPrice, setUnitId, setCategoryId], () => undefined)
          setVisible(!visible)
          setFilteredItems(() => [])
        })
        .catch(err => {
          ToastAndroid.show(
            "An error occurred while updating product",
            ToastAndroid.SHORT,
          )
        })
    }
    else {
      handleAddProduct()
    }
  }

  const onDialogFailureAdd = () => {
    clearStates([setDiscount, setCGST, setSGST], () => 0)
    clearStates([setSearch, setHsnCode, setProductName, setUnitName], () => "")
    clearStates([setPrice, setUnitId, setCategoryId], () => undefined)
    setVisibleAdd(!visibleAdd)
  }

  const onDialogSuccecssAdd = () => {
    handleAddProduct()
      .then(() => {
        clearStates([setHsnCode, setProductName, setUnitName, setBatchNo, setExpiryDate, setDesc], () => "")
        clearStates([setDiscount, setCGST, setSGST], () => 0)
        clearStates([setPrice, setUnitId, setCategoryId], () => undefined)
        setVisibleAdd(!visibleAdd)
      })
      .catch(err => {
        ToastAndroid.show("Something went wrong on server.", ToastAndroid.SHORT)
      })
  }

  const handleAddProduct = async () => {
    let addedProductObject: AddItemCredentials = {
      comp_id: +loginStore?.comp_id,
      br_id: +loginStore?.br_id,
      hsn_code: hsnCode,
      item_name: productName,
      unit_id: +unitId || 0,
      catg_id: +categoryId,
      created_by: loginStore?.user_id,
      price: +sale_price,
      cgst: CGST,
      sgst: CGST,
      barcode: barcode,
      purchase_price: +purchase_price,
      sale_price: +sale_price,
      opening_stock: +opening_stock,
      batch_no: batch_no,
      // expiry_dt: new Date(toDate).toString().slice(0, 10),
      expiry_dt: new Date(toDate).getFullYear()+ '-'+  (new Date(toDate).getMonth() + 1) + "-" +new Date(toDate).getDate(),
      description: desc,
      alert: checked ? 'Y' : 'N',
      sp_gst_flag: value_sp == '0' ? 'N' : 'Y',
      pp_gst_flag: value_pp == '0' ? 'N' : 'Y',
      disc_prtg_flag: value_disc == '0' ? 'N' : 'Y',
      as_on_dt: new Date(as_on).getFullYear()+"-"+(new Date(as_on).getMonth() + 1) + "-"  + new Date(as_on).getDate()  ,
      // mfg_dt: new Date(mfg_date).toString().slice(0, 10),
      mfg_dt: new Date(mfg_date).getFullYear()+"-"+ (new Date(mfg_date).getMonth() + 1) + "-" + new Date(mfg_date).getDate() ,
      low_stock_qty: +low_qty,
      batchwise_flag: isEnabled ? 'Y' : 'N',
    }

    // if (hsnCode.length === 0 || productName.length === 0) {
    //     ToastAndroid.show("Add Product Name and HSN Code", ToastAndroid.SHORT)
    //     return
    // }
    if (productName.length === 0) {
      ToastAndroid.show("Add Product Name and HSN Code.", ToastAndroid.SHORT)
      return
    }

    if (!categoryId) {
      ToastAndroid.show("Add Category ID.", ToastAndroid.SHORT)
      return
    }

    if (!unitId) {
      ToastAndroid.show("Add Unit ID.", ToastAndroid.SHORT)
      return
    }

    if (!opening_stock) {
      ToastAndroid.show("Add Opening Stock", ToastAndroid.SHORT)
      return
    }

    // if (!price) {
    //   ToastAndroid.show("Add Price", ToastAndroid.SHORT)
    //   return
    // }
    // if (!purchase_price) {
    //   ToastAndroid.show("Add Purchase Sale", ToastAndroid.SHORT)
    //   return
    // }
    if (!sale_price) {
      ToastAndroid.show("Add Selling Price", ToastAndroid.SHORT)
      return
    }

    // if (CGST != SGST) {
    //   ToastAndroid.show("GST values must be equal", ToastAndroid.SHORT)
    //   return
    // }
    setLoading(true)
    console.log("ADDED ITEM OBJECT: ", addedProductObject)
    await sendAddedItem(addedProductObject)
      .then(res => {
        setLoading(false)
        ToastAndroid.show("Product has been added.", ToastAndroid.SHORT)
        handleGetItems()
        handleGetUnits()
        handleGetCategories()
        clearStates([setHsnCode, setProductName, setUnitName, setBarcode, setDesc, setAsOn, setCategoryName], () => "")
        clearStates([setDiscount, setCGST, setSGST], () => 0)
        clearStates([setPrice, setUnitId, setCategoryId], () => undefined)
        clearStates([setOpeningStock, setPurchasePrice, setSalePrice, setBatchNo], () => 0)
        // console.log("########################", addedProductObject)
      })
      .catch(err => {
        setLoading(false)
        console.log('=============errors===============',err.response.data)
        ToastAndroid.show(err, ToastAndroid.SHORT)
      })
  }
  // useEffect(() => {

  //   setSalePrice(value_disc == '0' ?
  //     (value_pp == '0' ?
  //       (+purchase_price * (1 - (+discount / 100)) * (CGST / 100)) + (+purchase_price * (1 - (+discount / 100)))
  //       : (+purchase_price * (1 - (+discount / 100))))
  //     : (value_pp == '0' ?
  //       ((+purchase_price - (+discount)) * (CGST / 100)) + (+purchase_price - (+discount))
  //       : (+purchase_price - (+discount)))
  //   )

  // }, [purchase_price, value_pp, value_disc, discount, CGST])
  const handleProductPressed = (item: ItemsData) => {
    console.log(item)
    setProduct(item)
    setSearch(item?.item_name)
    setPrice(item?.price)
    setDiscount(item?.discount)
    setBarcode(item?.bar_code)
    setCGST(item?.cgst)
    setSGST(item?.cgst)
    setProductName(item?.item_name)
    handleSetUnitNameAndId(item?.unit_name, item?.unit_id)
    handleSetCategoryNameAndId(item?.category_name, item?.catg_id)
    setPurchasePrice(item?.purchase_price)
    setSalePrice(item?.sale_price)
    setOpeningStock(item?.opening_stock)
    setBatchNo(item?.batch_no)
    setExpiryDate(item?.expiry_dt)
    setDesc(item?.description)
    setChecked(item?.stock_alert === 'Y' ? true : false)
    setVisible(!visible)
    setValue_pp(item?.pp_gst_flag == 'N' ? '0' : '1')
    setValue_sp(item?.sp_gst_flag == 'N' ? '0' : '1')
    setValue_disc(item?.disc_prtg_flag == 'N' ? '0' : '1')
    setHsnCode(item?.hsn_code)
    setBatchWise(item?.batchwise_flag == 'Y' ? true : false)


  }

  useEffect(() => {
    handleGetItems()
    handleGetUnits()
    handleGetCategories()
  }, [isFocused])

  return (
    <SafeAreaView
      style={[{ backgroundColor: theme.colors.background, height: "100%" }]}>

      <View style={{ alignItems: "center" }}>
        <HeaderImage
          isBackEnabled
          imgLight={flowerHome}
          imgDark={flowerHomeDark}
          borderRadius={30}
          blur={10}>
          Manage Products
        </HeaderImage>
      </View>

      <View style={styles.container}>
        {options.map(opt => (
          <Button
            key={opt.val}
            style={[
              colorScheme === 'dark' ? styles.btnDark : styles.btn,
              selected === opt.val ? colorScheme === 'dark' ? styles.btnSelectedDark : styles.btnSelected : colorScheme === 'dark' ? styles.btnUnselectedDark : styles.btnUnselected
            ]}
            onPress={() => {
              console.log(opt); setSelected(opt.val);
              setSearch("")
              setPrice(0)
              setDiscount(0)
              setCGST(0)
              setSGST(0)
              setProductName("")
              handleSetUnitNameAndId("", 0)
              handleSetCategoryNameAndId("", 0)
              setBarcode("")
              setPurchasePrice(0)
              setSalePrice(0)
              setOpeningStock(0)
              setBatchNo("")
              setProduct(undefined)
              setHsnCode("")
              setValue_pp('1')
              setValue_sp('1')

              setVisible(!visible)
            }}
          >
            <Text style={selected === opt.val ? colorScheme === 'dark' ? styles.textSelectedDark : styles.textSelected : colorScheme === 'dark' ? styles.textUnselectedDark : styles.textUnselected}>
              {opt.name}
            </Text>
          </Button>
        ))}
      </View>


      <ScrollView keyboardShouldPersistTaps="handled" onScroll={onScroll}>
        {selected == 1 && <View
        >
          <Searchbar
            style={{
              color: "white",
              shadowColor: '#d0e1fd',
              borderColor: '#d0e1fd',
              backgroundColor: colorScheme === 'dark' ? '#2e2929ff' : '#f5f9ff',
              shadowOffset: { width: 1, height: 1 },
              shadowOpacity: 0.4,
              shadowRadius: 3,
              elevation: 5,
              margin: 15,
              borderRadius: 10,

            }}
            placeholder="Search Products"
            onChangeText={onChangeSearch}
            value={search}
            elevation={search && 2}
            autoFocus
          />

          <View style={{ paddingBottom: PixelRatio.roundToNearestPixel(10), zIndex: 1000 }}>
            {search && visible && (
              <ScrollableListContainer
                backgroundColor={colorScheme === 'dark' ? '#2e2929ff' : '#f5f9ff'}>
                {filteredItems.map(item => (
                  <ProductListSuggestion
                    key={item.id}
                    itemName={item.item_name}
                    onPress={() => handleProductPressed(item)}
                    unitPrice={item.sale_price}
                  />
                ))}
              </ScrollableListContainer>
            )}
          </View>

          {product?.item_id && <View
            style={{ flexDirection: 'row', justifyContent: 'center', backgroundColor: '#fcd9d5ff', padding: 5, width: SCREEN_WIDTH / 3, borderRadius: 20, margin: 15 }}

          >
            <Text style={{ color: '#C3423F' }}
              variant="labelMedium">
              Item ID: {product?.item_id}
            </Text>
          </View>}


          {product?.item_id &&
            <View>
              <View style={[styles.formElem]}
              >
                <InputPaper
                  label="Product Name"
                  onChangeText={(txt: string) => setProductName(txt)}
                  value={productName}
                  keyboardType="default"
                  mode="outlined"
                  maxLength={30}
                />
              </View>

                <View style={[styles.formElem]}
                >


                  <InputPaper
                    label="Unit"
                    onChangeText={(txt: string) => { setUnitName(txt); setVisibleUnitList(true) }}
                    value={unitName}
                    keyboardType="default"
                    mode="outlined"
                    maxLength={30}
                  />
                </View>
                <View style={{ paddingBottom: PixelRatio.roundToNearestPixel(10), zIndex: 1000 }}>
                  {unitName && visibleUnitList && (
                    <ScrollableListContainer
                                          backgroundColor={colorScheme === 'dark' ? '#2e2929ff' : '#f5f9ff'}

                      
                      >
                      {units.filter(i => i.unit_name.toLowerCase().includes(unitName?.toLowerCase())).map(item => (
                        <ProductListSuggestion
                          key={item.sl_no}
                          itemName={item.unit_name}
                          onPress={() => handleSetUnitNameAndId(item?.unit_name, item?.sl_no)}
                        // unitPrice={item.sale_price}
                        />
                      ))}
                    </ScrollableListContainer>
                  )}
                </View>
              <View style={[styles.formElem]}
              >
              
                <InputPaper
                  label="Category"
                  onChangeText={(txt: string) => { setCategoryName(txt); setVisibleCatList(true) }}
                  value={categoryName}
                  keyboardType="default"
                  mode="outlined"
                  maxLength={30}
                />
              </View>
              <View style={{ paddingBottom: PixelRatio.roundToNearestPixel(10), zIndex: 999, elevation: 999 }}>
                {categoryName && visibleCatList && (
                  <ScrollableListContainer
                    backgroundColor={colorScheme === 'dark' ? '#2e2929ff' : '#f5f9ff'}
                  >
                    {categories.filter(i => i.category_name.toLowerCase().includes(categoryName?.toLowerCase())).map(item => (
                      <ProductListSuggestion
                        key={item.sl_no}
                        itemName={item.category_name}
                        onPress={() => handleSetCategoryNameAndId(item?.category_name, item?.sl_no)}
                      // unitPrice={item.sale_price}
                      />
                    ))}
                  </ScrollableListContainer>
                )}

              </View>
             {/* <View style={[styles.formElem, { flexDirection: 'row', alignItems: 'center' }]}>
            <Switch
              trackColor={{ false: '#767577', true: '#008181' }}
              thumbColor={isEnabled ? '#4042198' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleSwitch}
              value={isEnabled}
            />
            <Text style={{ color: '#89898bff', fontWeight: '800' }}>Batchwise Entry</Text>

          </View> */}
              <View style={[styles.formElem]}
              >
                <InputPaper
                  label="Bar Code"
                  onChangeText={(txt: string) => setBarcode(txt)}
                  value={barcode}
                  keyboardType="default"
                  mode="outlined"
                  maxLength={30}
                />
              </View>
              <View style={styles.container}>
                {subOptionsEdit.map(opt => (
                  <Button
                    key={opt.val}
                    style={[
                      colorScheme === 'dark' ? styles.btnSubDark : styles.btnSub,
                      selectedSub === opt.val ? colorScheme === 'dark' ? styles.btnSelectedSubDark : styles.btnSelectedSub : colorScheme === 'dark' ? styles.btnUnselectedSubDark : styles.btnUnselectedSub
                    ]}
                    onPress={() => {
                      console.log(opt); setSelectedSub(opt.val);
                      // setSearch("")
                      // setPrice(0)
                      // setDiscount(0)
                      // setCGST(0)
                      // setSGST(0)
                      // setProductName("")
                      // handleSetUnitNameAndId("", 0)
                      // handleSetCategoryNameAndId("", 0)
                      // setBarcode("")
                      // setPurchasePrice(0)
                      // setSalePrice(0)
                      // setOpeningStock(0)
                      // setProduct(undefined)

                      // setVisible(!visible)
                    }}
                  >
                    <Text style={selectedSub === opt.val ? colorScheme=== 'dark' ? styles.textSelectedDark : styles.textSelectedSub : colorScheme === 'dark' ?styles.textSelectedDark:styles.textUnselectedSub}>
                      {opt.name}
                    </Text>
                  </Button>
                ))}

              </View>
              {(selectedSub == 1 || selectedSub==0) && isEnabled && <View style={[styles.formElem]}>
                <InputPaper
                  label="Batch No."
                  onChangeText={(txt: string) => setBatchNo(txt)}
                  value={batch_no}
                  keyboardType="numeric"
                  mode="outlined"
                />

              </View>}

              {selectedSub == 1 && <View style={[styles.formElem]}>
               

                <ButtonPaper buttonColor="#008181" onPress={() => setOpenToDate(true)} mode="contained">
                  Expiry Date : {toDate?.toLocaleDateString("en-GB")}
                </ButtonPaper>
                <DatePicker
                  modal
                  mode="date"
                  open={openToDate}
                  date={toDate}
                  onConfirm={date => {
                    setToDate(date)
                  }}
                  onCancel={() => {
                    setOpenToDate(false)
                  }}
                />
              </View>}
              {/* {selectedSub == 0 && <View style={[styles.formElem]}>
                <InputPaper
                  label="Price"
                  onChangeText={(txt: number) => setPrice(txt)}
                  value={price}
                  keyboardType="numeric"
                  mode="outlined"
                />
              </View>} */}
         
              {selectedSub == 0 && <View style={[styles.formElem, styles.row]}
              >
                <InputPaper
                  customStyle={styles.input}
                  label="Purchase Price/Unit"
                  onChangeText={(txt: number) => setPurchasePrice(txt)}
                  value={purchase_price}
                  keyboardType="numeric"
                  mode="outlined"
                  maxLength={30}
                />
                <ButtonPaper style={styles.button} buttonColor="#def0ddff" textColor="#008181" onPress={() => setVisible_pp(true)} mode="contained">
                  {value_pp == '0' ? 'Without GST' : "With GST"}
                </ButtonPaper>
              </View>}
              {selectedSub == 0 && <View style={[styles.formElem, styles.row]}
              >
                <InputPaper
                  label="Sale Price/unit"
                  customStyle={styles.input}
                  onChangeText={(txt: number) => setSalePrice(txt)}
                  value={sale_price}
                  keyboardType="numeric"
                  mode="outlined"
                  maxLength={30}
                />
                <ButtonPaper style={styles.button} buttonColor="#def0ddff" textColor="#008181" onPress={() => setVisible_sp(true)} mode="contained">
                  {value_sp == '0' ? 'Without GST' : "With GST"}
                </ButtonPaper>
              </View>}
              {selectedSub == 0 && <View style={[styles.formElem]}>

                {/* <MenuPaper
                  // disabled={value_pp == '1' ? true : false}
                  title={`${CGST}` || "CGST (%)"}
                  menuArrOfObjects={[
                    { title: "Exempted", func: () => setCGST(0) },

                    { title: "0%", func: () => setCGST(0) },
                    { title: "2.5%", func: () => setCGST(2.5) },
                    { title: "5%", func: () => setCGST(5) },
                    { title: "18%", func: () => setCGST(18) },
                    { title: "40%", func: () => setCGST(40) },
                  ]}
                  customStyle={{ borderRadius: 4, backgroundColor: '#008181' }}
                  textColor={'#ffffff'}
                  mode="contained"
                /> */}
                 <InputPaper
              label="GST"
              onChangeText={(txt: any) => { setCGST(txt); setVisibleCatList(true) }}
              value={CGST}
              keyboardType="default"
              mode="outlined"
              maxLength={30}
            />

          </View>}
          <View style={{ paddingBottom: PixelRatio.roundToNearestPixel(10), zIndex: 1000 }}>
            {+CGST > 0 && isGstVisible && (
              <ScrollableListContainer
                                    backgroundColor={colorScheme === 'dark' ? '#2e2929ff' : '#f5f9ff'}

                >
                {menuGstArr.filter(i => i.title.toLowerCase().includes(CGST.toString()?.toLowerCase())).map(item => (
                  <ProductListSuggestion
                    key={item.val}
                    itemName={item.title}
                  onPress={() => {handleSetGst(item?.title,item?.val);setIsGstVisible(false)}}
                  // onPress={() => handleProductPressed(item)}
                  // unitPrice={item.sale_price}
                  />
                ))}
              </ScrollableListContainer>
            )}
              </View>
                        {selectedSub == 2 && <View style={[styles.formElem]}
          >
            <InputPaper
              selectTextOnFocus
              label="HSN Code"
              onChangeText={(txt: string) => setHsnCode(txt)}
              value={hsnCode}
              keyboardType="numeric"
              mode="outlined"
              maxLength={6}

            />
          </View>}
              {/* {selectedSub == 0 && <View style={[styles.formElem, styles.row]}>
                <InputPaper
                  label={
                   
                    value_disc == '0' ? 'Discount (%)' : 'Discount (₹)'
                  }
                  onChangeText={(txt: number) => setDiscount(txt)}
                  value={discount}
                  keyboardType="numeric"
                  mode="outlined"
                  customStyle={styles.input}
                />
                <ButtonPaper style={styles.discBtn} buttonColor="#acadc0ff" onPress={() => setVisible_disc(true)} mode="contained">
                  {value_disc == '0' ? '%' : "₹"}
                </ButtonPaper>
              </View>} */}


              {selectedSub == 2 && <View style={[styles.formElem]}
              >
                <InputPaper
                  label="Description"
                  onChangeText={(txt: string) => setDesc(txt)}
                  value={desc}
                  keyboardType="default"
                  mode="outlined"
                  customStyle={{ height: 90 }}
                  multiline={true}
                  maxLength={500}
                />
              </View>}


              {selectedSub == 1 &&
                <View style={[styles.formElem, { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }]}>
                  
                  <Switch
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={checked ? '#f5dd4b' : '#f4f3f4'}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={toggleStockAlert}
                    value={checked}
                  />
                  <Text style={{ color: '#008181', fontWeight: '800' }}>Low Stock Alert</Text>
                
                </View>

              }



            </View>
          }


        </View>
        }
        {selected == 0 &&
          <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 10 }}>
         <View style={{width:'100%'}}
          >
            <InputPaper
              label="Bar Code"
              onChangeText={(txt: string) => setBarcode(txt)}
              value={barcode}
              keyboardType="default"
              mode="outlined"
              maxLength={30}
            />
          </View>
        <ButtonPaper
              // textColor={btnIdentifier === "U" ? '#008181' : "white"}
              icon={"barcode-scan"}
              onPress={() =>  navigation.dispatch(CommonActions.navigate(navigationRoutes.cameraScreen,{params:{from:1}}))}
              mode="text"
              buttonColor="transparent"
              textColor="#008181"
              style={{width:'8%',height:'20%',borderRadius:0, marginLeft:-SCREEN_WIDTH/6,justifyContent:'center',alignItems:'center'}}
              
              
              // buttonColor={btnIdentifier === "U" ? "white" : "transparent"}
            >
              {/* User Profile */}
              {/* Hello */}
            </ButtonPaper>
             </View>}
        {selected == 0 && <View >

          <View style={[styles.formElem]}>
            <InputPaper
              label="Product Name"
              onChangeText={(txt: string) => setProductName(txt)}
              value={productName}
              keyboardType="default"
              mode="outlined"
              maxLength={30}
            />
          </View>


          <View style={[styles.formElem]}
          >


            <InputPaper
              label="Unit"
              onChangeText={(txt: string) => { setUnitName(txt); setVisibleUnitList(true) }}
              value={unitName}
              keyboardType="default"
              mode="outlined"
              maxLength={30}
            />
          </View>
          <View style={{ paddingBottom: PixelRatio.roundToNearestPixel(10), zIndex: 1000 }}>
            {unitName && visibleUnitList && (
              <ScrollableListContainer
                backgroundColor={colorScheme === 'dark' ? '#2e2929ff' : '#f5f9ff'}
                >
                {units.filter(i => i.unit_name.toLowerCase().includes(unitName?.toLowerCase())).map(item => (
                  <ProductListSuggestion
                    key={item.sl_no}
                    itemName={item.unit_name}
                    onPress={() => handleSetUnitNameAndId(item?.unit_name, item?.sl_no)}
                  // unitPrice={item.sale_price}
                  />
                ))}
              </ScrollableListContainer>
            )}
          </View>



          <View style={[styles.formElem]}>
            {/* <MenuPaper
              title={categoryName || "Category"}
              menuArrOfObjects={categoryMenuArr}
              customStyle={{ borderRadius: 4, backgroundColor: '#008181' }}
              textColor={'#ffffff'}
              mode="contained"
            /> */}
            <InputPaper
              label="Category"
              onChangeText={(txt: string) => { setCategoryName(txt); setVisibleCatList(true) }}
              value={categoryName}
              keyboardType="default"
              mode="outlined"
              maxLength={30}
            />
          </View>
          <View style={{ paddingBottom: PixelRatio.roundToNearestPixel(10), zIndex: 999, elevation: 999 }}>
            {categoryName && visibleCatList && (
              <ScrollableListContainer
                                   backgroundColor={colorScheme === 'dark' ? '#2e2929ff' : '#f5f9ff'}

              >
                {categories.filter(i => i.category_name.toLowerCase().includes(categoryName?.toLowerCase())).map(item => (
                  <ProductListSuggestion
                    key={item.sl_no}
                    itemName={item.category_name}
                    onPress={() => handleSetCategoryNameAndId(item?.category_name, item?.sl_no)}
                  // unitPrice={item.sale_price}
                  />
                ))}
              </ScrollableListContainer>
            )}
          </View>
          
          {/* <View style={[styles.formElem, { flexDirection: 'row', alignItems: 'center' }]}>
            <Switch
              trackColor={{ false: '#767577', true: '#008181' }}
              thumbColor={isEnabled ? '#4042198' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleSwitch}
              value={isEnabled}
            />
            <Text style={{ color: '#89898bff', fontWeight: '800' }}>Batchwise Entry</Text>

          </View> */}
          <View style={styles.container}>
            {subOptions.map(opt => (
              <Button
                key={opt.val}
                style={[
                  colorScheme === 'dark' ? styles.btnSubDark : styles.btnSub,
                  selectedSub === opt.val ? colorScheme === 'dark' ? styles.btnSelectedSubDark : styles.btnSelectedSub : colorScheme === 'dark' ? styles.btnUnselectedSubDark : styles.btnUnselectedSub
                ]}
                onPress={() => {
                  console.log(opt); setSelectedSub(opt.val);

                }}
              >
                <Text style={selectedSub === opt.val ? colorScheme === 'dark' ? styles.textSelectedDark : styles.textSelectedSub : colorScheme === 'dark' ? styles.textUnselectedDark : styles.textUnselectedSub}>
                  {opt.name}
                </Text>
              </Button>
            ))}
          </View>
        
          {selectedSub == 1 &&
            <View style={[styles.formElem, { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }]}>

              <Switch
                trackColor={{ false: '#767577', true: '#008181' }}
                thumbColor={checked ? '#4042198' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleStockAlert}
                value={checked}
              />
              <Text style={{ color: '#89898bff', fontWeight: '800' }}>Low Stock Alert</Text>

            </View>

          }
          {selectedSub == 1 && checked == true && <View style={[styles.formElem]}
          >
            <InputPaper
              label="Low Stock Qty"
              onChangeText={(txt: number) => setLowQty(txt)}
              value={low_qty}
              keyboardType="numeric"
              mode="outlined"
            />
          </View>}
          {/* <View style={{ flexDirection: 'row', width: SCREEN_WIDTH / 1.2, gap: 0 }}> */}
           
            {selectedSub == 1 && <View style={[styles.formElem]}>
             
             
              <InputPaper
                label="Opening Stock"
                onChangeText={(txt: number) => setOpeningStock(txt)}
                value={opening_stock}
                keyboardType="numeric"
                mode="outlined"
              />
           
            </View>}

            {selectedSub == 1 && isEnabled && <View style={[styles.formElem]}>

              <ButtonPaper buttonColor="white" style={{ borderRadius: 0 }} textColor="#008181" onPress={() => setOpenToDate(true)} mode="outlined">
                As On : {toDate?.toLocaleDateString("en-GB")}
              </ButtonPaper>
              <DatePicker
                modal
                textColor="#008181"
                minimumDate={toDate}
                mode="date"
                open={openToDate}
                date={toDate}
                onConfirm={date => {
                  setToDate(date)
                }}
                onCancel={() => {
                  setOpenToDate(false)
                }}
              />
            </View>

            }
          {/* </View> */}

          {(selectedSub == 1 || selectedSub == 0) && isEnabled && <View style={[styles.formElem]}>
            <InputPaper
              label="Batch No."
              onChangeText={(txt: string) => setBatchNo(txt)}
              value={batch_no}
              keyboardType="numeric"
              mode="outlined"
            />

          </View>}

          <View style={{ flexDirection: 'row', width: SCREEN_WIDTH / 1.2 }}>
            {selectedSub == 1 && <View style={[styles.formElem, { width: '50%' }]}>

              <ButtonPaper buttonColor="white" style={{ borderRadius: 0, }} textColor="#008181" onPress={() => setOpenMfgDate(true)} mode="outlined">
               <Text style={{ fontSize: 10,color:'#008181' }}>Mfg. Date : {mfg_date?.toLocaleDateString("en-GB")}</Text> 
              </ButtonPaper>
              <DatePicker
                modal
                textColor="#008181"
                minimumDate={mfg_date}
                mode="date"
                open={openMfgDate}
                date={mfg_date}
                onConfirm={date => {
                  setMfgDate(date)
                }}
                onCancel={() => {
                  setOpenMfgDate(false)
                }}
              />
            </View>}
            {selectedSub == 1 && <View style={[styles.formElem, { width: '50%' }]}>

              <ButtonPaper buttonColor="white" style={{ borderRadius: 0 }} textColor="#008181" onPress={() => setOpenExp(true)} mode="outlined">
               <Text style={{ fontSize: 8,color:'#008181' }}> Expiry Date : {expiry_date?.toLocaleDateString("en-GB")} </Text>
              </ButtonPaper>
              <DatePicker
                modal
                textColor="#008181"
                minimumDate={toDate}
                mode="date"
                open={openExp}
                date={expiry_date}
                onConfirm={date => {
                  setExpiryDate(date)
                }}
                onCancel={() => {
                  setOpenExp(false)
                }}
              />
            </View>}

          </View>
        
 
          {selectedSub == 0 && <View style={[styles.formElem, styles.row]}
          >
            <InputPaper
              label="Purchase Price/Unit"
              onChangeText={(txt: number) => setPurchasePrice(txt)}
              value={purchase_price}
              keyboardType="numeric"
              mode="outlined"
              maxLength={30}
              customStyle={styles.input}
            />
            <ButtonPaper style={styles.button} buttonColor="#def0ddff" textColor="#008181" onPress={() => setVisible_pp(true)} mode="contained">
              {value_pp == '0' ? 'Without GST' : "With GST"}
            </ButtonPaper>
          </View>}
          {selectedSub == 0 && <View style={[styles.formElem, styles.row]}
          >
            <InputPaper
              // label="M.R.P/Unit"
              label="Sale Price/Unit"
              onChangeText={(txt: number) => { setSalePrice(txt) }}
              value={sale_price}
              // value={value_disc == '0' ?
              //   (value_pp == '0' ?
              //     (+purchase_price * (1 - (+discount / 100)) * (CGST / 100)) + (+purchase_price * (1 - (+discount / 100)))
              //     : (+purchase_price * (1 - (+discount / 100))))
              //   : (value_pp == '0' ?
              //     ((+purchase_price - (+discount)) * (CGST / 100)) + (+purchase_price - (+discount))
              //     : (+purchase_price - (+discount)))}
              keyboardType="numeric"
              mode="outlined"
              maxLength={30}
              customStyle={styles.input}
            />
            <ButtonPaper style={styles.button} buttonColor="#def0ddff" textColor="#008181" onPress={() => setVisible_sp(true)} mode="contained">
              {value_sp == '0' ? 'Without GST' : "With GST"}
            </ButtonPaper>
          </View>}
           {selectedSub == 2 && <View style={[styles.formElem]}
          >
            <InputPaper
              selectTextOnFocus
              label="HSN Code"
              onChangeText={(txt: string) => setHsnCode(txt)}
              value={hsnCode}
              keyboardType="numeric"
              mode="outlined"
              maxLength={6}

            />
          </View>}
          {selectedSub == 2 && <View style={[styles.formElem]}
          >
            <InputPaper
              label="Description"
              onChangeText={(txt: string) => setDesc(txt)}
              value={desc}
              keyboardType="default"
              mode="outlined"
              multiline={true}
              customStyle={{ height: 90 }}

              maxLength={500}
            />
          </View>}
          {selectedSub == 0 && <View style={[styles.formElem]}>

            {/* <MenuPaper
              title={`${CGST}` || "CGST (%)"}
              menuArrOfObjects={[
                { title: "Exempted", func: () => setCGST(0) },
                { title: "0%", func: () => setCGST(0) },
                { title: "2.5%", func: () => setCGST(2.5) },
                { title: "5%", func: () => setCGST(5) },
                { title: "18%", func: () => setCGST(18) },
                { title: "40%", func: () => setCGST(40) },
              ]}
              customStyle={{ borderRadius: 4, backgroundColor: '#008181' }}
              textColor={'#ffffff'}
              mode="outlined"
            /> */}
            <InputPaper
              label="GST"
              onChangeText={(txt: any) => { setCGST(txt); setIsGstVisible(true) }}
              value={CGST}
              keyboardType="default"
              mode="outlined"
              maxLength={30}
            />

          </View>}
          <View style={{ paddingBottom: PixelRatio.roundToNearestPixel(10), zIndex: 1000 }}>
            {+CGST > 0 && isGstVisible && (
              <ScrollableListContainer
                                 backgroundColor={colorScheme === 'dark' ? '#2e2929ff' : '#f5f9ff'}

                
                >
                {menuGstArr.filter(i => i.title.toLowerCase().includes(CGST.toString()?.toLowerCase())).map(item => (
                  <ProductListSuggestion
                    key={item.val}
                    itemName={item.title}
                  onPress={() => {handleSetGst(item?.title,item?.val);setIsGstVisible(false)}}
                  // unitPrice={item.sale_price}
                  />
                ))}
              </ScrollableListContainer>
            )}
          </View>
          {/* {selectedSub == 0 && <View style={[styles.formElem, styles.row]}>
            <InputPaper
              customStyle={styles.input}
              selectTextOnFocus
              label={
              

                value_disc == '1' ? "Discount (₹)" : "Discount (%)"
              }
              onChangeText={(txt: number) => setDiscount(txt)}
              value={discount}
              keyboardType="numeric"
              mode="outlined"
            />
            <ButtonPaper style={styles.discBtn} buttonColor="#acadc0ff" onPress={() => setVisible_disc(true)} mode="contained">
              {value_disc == '0' ? '%' : "₹"}
            </ButtonPaper>
          </View>} */}



         



          {/* <View style={[styles.formElem]}>

            <MenuPaper
              title={`${SGST}` || "SGST (%)"}
              menuArrOfObjects={[
                { title: "0%", func: () => setSGST(0) },
                { title: "2.5%", func: () => setSGST(2.5) },
                { title: "5%", func: () => setSGST(5) },
                { title: "18%", func: () => setSGST(18) },
                { title: "40%", func: () => setSGST(40) },
              ]}
              customStyle={{ borderRadius: 4 }}
              textColor={'#008181'}
              mode="outlined"
            />
          </View> */}
        </View>}

      </ScrollView>

      <View style={{ alignItems: "center" }}>
        {(selected == 0 || (selected == 1 && product?.item_id)) && <ButtonPaper
          onPress={() =>
            onDialogSuccecss()

            // handleGetBillsByDate(formattedFromDate, formattedToDate)
          }
          style={[styles.submitBtn, { margin: 6, width: SCREEN_WIDTH / 1.1, borderRadius: 8 }]}
          mode="elevated"
          loading={loading}
          disabled={loading}
        >
          <Text style={{ color: '#fff' }}>Save </Text>
        </ButtonPaper>}
      </View>
      <Portal>
        <Dialog style={{ borderRadius: 0, backgroundColor: 'white', padding: 30 }} visible={visible_sp} onDismiss={hideDialog_sp}>
          <RadioButton.Group onValueChange={newValue => { setValue_sp(newValue); hideDialog_sp() }} value={value_sp}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
              <RadioButton color="#008181" value="1" />
              <Text>With GST</Text>

            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
              <RadioButton color="#008181" value="0" />
              <Text>Without GST</Text>

            </View>
          </RadioButton.Group>
          {/* <Dialog.Actions>
          <Button onPress={() => console.log('Cancel')}>Cancel</Button>
          <Button onPress={() => console.log('Ok')}>Ok</Button>
        </Dialog.Actions> */}
        </Dialog>
      </Portal>
      <Portal>
        <Dialog style={{ borderRadius: 0, backgroundColor: 'white', padding: 30 }} visible={visible_pp} onDismiss={hideDialog_pp}>
          <RadioButton.Group onValueChange={newValue => { setValue_pp(newValue); hideDialog_pp() }} value={value_pp}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
              <RadioButton color="#008181" value="1" />
              <Text>With GST</Text>

            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
              <RadioButton color="#008181" value="0" />
              <Text>Without GST</Text>

            </View>
          </RadioButton.Group>
          {/* <Dialog.Actions>
          <Button onPress={() => console.log('Cancel')}>Cancel</Button>
          <Button onPress={() => console.log('Ok')}>Ok</Button>
        </Dialog.Actions> */}
        </Dialog>
      </Portal>
      <Portal>
        <Dialog style={{ borderRadius: 0, backgroundColor: 'white', padding: 30 }} visible={visible_disc} onDismiss={hideDialog_disc}>
          <RadioButton.Group onValueChange={newValue => { setValue_disc(newValue); hideDialog_disc() }} value={value_disc}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
              <RadioButton color="#008181" value="0" />
              <Text>%</Text>

            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
              <RadioButton color="#008181" value="1" />
              <Text>₹</Text>

            </View>
          </RadioButton.Group>
          {/* <Dialog.Actions>
          <Button onPress={() => console.log('Cancel')}>Cancel</Button>
          <Button onPress={() => console.log('Ok')}>Ok</Button>
        </Dialog.Actions> */}
        </Dialog>
      </Portal>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  fabStyle: {
    bottom: normalize(16),
    right: normalize(16),
    position: "absolute",
  },
  title: {
    textAlign: "center",
  },
  container: {

    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 2, elevation: 2
  },
  btn: { borderRadius: 0, padding: 1, marginBottom: 5, width: SCREEN_WIDTH / 2.1, justifyContent: 'center', alignItems: 'center' },
  btnSelected: { color: '#008181', backgroundColor: "#f5f9ff", borderColor: '#008181', borderBottomColor: '#008181', borderBottomWidth: 2 },
  btnUnselected: { backgroundColor: '#ffff', color: 'gray', borderBottomWidth: 2, borderBottomColor: 'gray' },
  textSelected: { color: '#008181', fontWeight: '800' },
  textUnselected: { color: 'gray', fontWeight: '200' },

  btnDark: { borderRadius: 0, padding: 1, marginBottom: 5, width: SCREEN_WIDTH / 2.1, justifyContent: 'center', alignItems: 'center' },
  btnSelectedDark: { color: '#f5f9ff', backgroundColor: "#009689", borderColor: '#ffcd04', borderBottomColor: '#ffcd04', borderBottomWidth: 2 },
  btnUnselectedDark: { backgroundColor: '#2e2929ff', color: '#008181', borderBottomWidth: 2, borderBottomColor: '#008181' },
  textSelectedDark: { color: '#f5f9ff', fontWeight: '800' },
  textUnselectedDark: { color: 'gray', fontWeight: '200' },

  textSelectedSub: { color: '#008181', fontWeight: '800' },
  textUnselectedSub: { color: 'gray', fontWeight: '200' },
  formElem: {
    marginVertical: 12,
    marginHorizontal: 15
  },
  submitBtn: { borderRadius: 0, backgroundColor: '#008181', color: '#fff', width: '50%' },

  content: { flex: 1, padding: 16, backgroundColor: 'white' },
  containerSub: {

    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 2, elevation: 2,
  },
  btnSub: { borderRadius: 0, padding: 1, marginBottom: 5, marginTop: 5, width: SCREEN_WIDTH / 3.37, justifyContent: 'center', alignItems: 'center' },
  btnSelectedSub: { color: '#008181', backgroundColor: "#f5f9ff", borderColor: '#008181', borderBottomColor: '#008181', borderBottomWidth: 2 },
  btnUnselectedSub: { backgroundColor: '#ffff', color: 'gray', borderBottomWidth: 2, borderBottomColor: 'gray' },

  btnSubDark: { borderRadius: 0, padding: 1, marginBottom: 5, marginTop: 5, width: SCREEN_WIDTH / 3.37, justifyContent: 'center', alignItems: 'center' },
  btnSelectedSubDark: { color: '#f5f9ff', backgroundColor: "#009689", borderColor: '#ffcd04', borderBottomColor: '#ffcd04', borderBottomWidth: 2 },
  btnUnselectedSubDark: { backgroundColor: '#2e2929ff', color: '#008181', borderBottomWidth: 2, borderBottomColor: '#008181' },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,                   // so input takes remaining space
  },
  button: {
    marginLeft: -120,
    // marginBottom: 4,
    borderRadius: 3,
    height: 51    // backgroundColor:"gray"            // space between input and button
  },
  discBtn: {
    marginLeft: -66,
    marginBottom: 4,
    borderRadius: 3,
    height: 42
  }
})
