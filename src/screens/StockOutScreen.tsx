import React, { useContext, useEffect, useRef, useState } from 'react'
import {
  View,
  StyleSheet,
  PixelRatio,
  ToastAndroid,
  useColorScheme,
} from 'react-native'
import { ScrollView } from 'react-native'
import { Searchbar, Text, Divider } from 'react-native-paper'
import HeaderImage from '../components/HeaderImage'
import { useIsFocused } from '@react-navigation/native'
import { usePaperColorScheme } from '../theme/theme'
import normalize from 'react-native-normalize'
import { flowerSetting, flowerSettingDark } from '../resources/images'
import { ItemsData, StockSearchCredentials, StockOutCredentials } from '../models/api_types'
import { AppStoreContext } from '../models/custom_types'
import { AppStore } from '../context/AppContext'
import ProductListSuggestion from '../components/ProductListSuggestion'
import ScrollableListContainer from '../components/ScrollableListContainer'
import { loginStorage } from '../storage/appStorage'
import useStockSearch from '../hooks/api/useStockSearch'
import useStockOut from '../hooks/api/useStockOut'
import InputPaper from '../components/InputPaper'
import ButtonPaper from '../components/ButtonPaper'
import MenuPaperWithoutRestriction from '../components/MenuPaperWithoutRestriction'

const STOCK_OUT_TYPES = [
  { label: 'Return', value: 'R' },
  { label: 'Damaged', value: 'D' },
]

export default function StockOutScreen() {
  const theme = usePaperColorScheme()
  const colorScheme = useColorScheme()
  const isFocused = useIsFocused()
  const searchRef = useRef(null)

  const { items, handleGetItems } = useContext<AppStoreContext>(AppStore)
  const loginStore = JSON.parse(loginStorage.getString('login-data'))

  const { fetchStock } = useStockSearch()
  const { stockOut } = useStockOut()

  // ─── Search state ────────────────────────────────────────────────────
  const [search, setSearch] = useState<string>('')
  const [filteredItems, setFilteredItems] = useState<ItemsData[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [product, setProduct] = useState<ItemsData | undefined>(undefined)

  // ─── Current stock (fetched) ─────────────────────────────────────────
  const [currentStock, setCurrentStock] = useState<number | null>(null)

  // ─── Form state ──────────────────────────────────────────────────────
  const [qtyToRemove, setQtyToRemove] = useState<string>('')
  const [remarks, setRemarks] = useState<string>('')
  const [selectedType, setSelectedType] = useState(STOCK_OUT_TYPES[0])
  const [loading, setLoading] = useState(false)

  // ─── Qty change handler – strips negatives ───────────────────────────
  const onChangeQty = (txt: string) => {
    const sanitised = txt.replace(/-/g, '')
    setQtyToRemove(sanitised)
  }

  useEffect(() => {
    handleGetItems()
  }, [isFocused])

  // ─── Search handler ──────────────────────────────────────────────────
  const onChangeSearch = (query: string) => {
    setSearch(query)
    setShowDropdown(true)
    setProduct(undefined)
    setCurrentStock(null)
    if (query === '') {
      setFilteredItems([])
      return
    }
    const lower = query.toLowerCase()
    setFilteredItems(
      items.filter((item: ItemsData) =>
        item?.item_name?.toLowerCase().includes(lower),
      ),
    )
  }

  // ─── Product selection ───────────────────────────────────────────────
  const handleProductPressed = async (item: ItemsData) => {
    setSearch(item.item_name)
    setShowDropdown(false)
    setFilteredItems([])
    setProduct(item)
    setCurrentStock(null)

    const payload: StockSearchCredentials = {
      comp_id: loginStore?.comp_id,
      br_id: loginStore?.br_id,
      item_id: item.item_id,
    }
    try {
      const res: any = await fetchStock(payload)
      setCurrentStock(res?.stock ?? 0)
    } catch {
      setCurrentStock(0)
    }
  }

  // ─── Submit ──────────────────────────────────────────────────────────
  const handleStockOut = async () => {
    if (!product) {
      ToastAndroid.show('Please select a product first.', ToastAndroid.SHORT)
      return
    }
    if (!qtyToRemove || +qtyToRemove <= 0) {
      ToastAndroid.show('Enter a valid quantity.', ToastAndroid.SHORT)
      return
    }
    if (+qtyToRemove < 0) {
      ToastAndroid.show('Quantity cannot be negative.', ToastAndroid.SHORT)
      return
    }
    if (currentStock !== null && +qtyToRemove > currentStock) {
      ToastAndroid.show('Insufficient stock available.', ToastAndroid.SHORT)
      return
    }

    const payload: StockOutCredentials = {
      comp_id: loginStore?.comp_id,
      br_id: loginStore?.br_id,
      item_id: product.item_id,
      qty: +qtyToRemove,
      damage_flag: selectedType.value,
      remarks: remarks || undefined,
      created_by: loginStore?.user_id,
    }
    console.log(payload)
    setLoading(true)
    try {
      await stockOut(payload)
      ToastAndroid.show('Stock deducted successfully!', ToastAndroid.SHORT)
      const res: any = await fetchStock({
        comp_id: loginStore?.comp_id,
        br_id: loginStore?.br_id,
        item_id: product.item_id,
      })
      setCurrentStock(res?.stock ?? 0)
      setQtyToRemove('')
      setRemarks('')
      setSelectedType(STOCK_OUT_TYPES[0])
    } catch (err) {
      console.log('StockOut error', err)
      ToastAndroid.show('Failed to deduct stock.', ToastAndroid.SHORT)
    } finally {
      setLoading(false)
    }
  }

  // ─── Derived ─────────────────────────────────────────────────────────
  const isDark = colorScheme === 'dark'
  const cardBg = isDark ? '#1e1e2e' : '#ffffff'
  const labelColor = isDark ? '#a0aec0' : '#4a5568'
  const valueColor = isDark ? '#e2e8f0' : '#1a202c'
  const accentColor = '#e53e3e' // Red accent for stock out

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{ alignItems: 'center' }}>
        <HeaderImage
          isBackEnabled
          imgLight={flowerSetting}
          imgDark={flowerSettingDark}
          borderRadius={30}
          blur={10}>
          Stock Out
        </HeaderImage>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Search Bar ─────────────────────────────────────────── */}
        <View style={styles.searchWrapper}>
          <Searchbar
            ref={searchRef}
            placeholder="Search product…"
            onChangeText={onChangeSearch}
            value={search}
            elevation={search ? 3 : 1}
            autoFocus
            style={[
              styles.searchbar,
              { backgroundColor: isDark ? '#2d2d3e' : '#fef2f2' },
            ]}
          />
        </View>

        {/* ── Dropdown suggestions ────────────────────────────────── */}
        {search !== '' && showDropdown && filteredItems.length > 0 && (
          <View style={styles.dropdownWrapper}>
            <ScrollableListContainer
              backgroundColor={isDark ? '#2e2929ff' : '#f5f9ff'}>
              {filteredItems.map(item => (
                <ProductListSuggestion
                  key={item.id}
                  itemName={item.item_name}
                  onPress={() => handleProductPressed(item)}
                  unitPrice={item.sale_price}
                />
              ))}
            </ScrollableListContainer>
          </View>
        )}

        {/* ── Product card + fields ────────────────────────────────── */}
        {product && (
          <View style={[styles.card, { backgroundColor: cardBg }]}>

            {/* Product info row */}
            <View style={styles.productRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.productName, { color: valueColor }]}>
                  {product.item_name}
                </Text>
                {product.category_name ? (
                  <Text style={[styles.subText, { color: labelColor }]}>
                    {product.category_name}
                  </Text>
                ) : null}
              </View>
              <View style={styles.itemIdBadge}>
                <Text style={styles.itemIdText}>ID: {product.item_id}</Text>
              </View>
            </View>

            <Divider style={{ marginVertical: 10, opacity: 0.3 }} />

            {/* ── Current stock + live projection ───────────────── */}
            <View style={styles.stockHighlight}>
              <View style={{ alignItems: 'flex-start' }}>
                <Text style={[styles.stockLabel, { color: labelColor }]}>
                  Current Stock
                </Text>
                <Text style={[styles.stockValue, { color: '#008181' }]}>
                  {currentStock !== null ? currentStock : '—'}
                  {product.unit_name ? ` ${product.unit_name}` : ''}
                </Text>
              </View>

              {qtyToRemove !== '' && +qtyToRemove > 0 && currentStock !== null && (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.stockLabel, { color: labelColor }]}>
                    After Stock Out
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: labelColor, fontSize: 18 }}>→</Text>
                    <Text style={[styles.stockValue, { color: accentColor, fontSize: 26 }]}>
                      {Math.max(currentStock - +qtyToRemove, 0)}
                      {product.unit_name ? ` ${product.unit_name}` : ''}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <Divider style={{ marginVertical: 10, opacity: 0.3 }} />

            {/* ── Stock Out Type dropdown ─────────────────────────────── */}
            <View style={styles.typeDropdownRow}>
              <Text style={[styles.sectionLabel, { color: labelColor, marginBottom: 0, alignSelf: 'center', marginRight: 12 }]}>
                Reason
              </Text>
              <MenuPaperWithoutRestriction
                title={selectedType.label}
                mode="outlined"
                textColor={accentColor}
                customStyle={{ borderColor: accentColor, borderRadius: 8 }}
                menuArrOfObjects={STOCK_OUT_TYPES.map(opt => ({
                  title: opt.label,
                  func: () => setSelectedType(opt),
                }))}
              />
            </View>

            <Divider style={{ marginVertical: 10, opacity: 0.3 }} />

            {/* ── Quantity & Remarks inputs ──────────────────────── */}
            <View style={styles.inputCol}>
              <View style={{ marginBottom: 12 }}>
                <InputPaper
                  label="Qty to Stock Out"
                  onChangeText={onChangeQty}
                  value={qtyToRemove}
                  keyboardType="numeric"
                  mode="outlined"
                  selectTextOnFocus
                />
              </View>
              <View>
                <InputPaper
                  label="Remarks (Optional)"
                  onChangeText={(txt: string) => setRemarks(txt)}
                  value={remarks}
                  mode="outlined"
                />
              </View>
            </View>

            {/* ── Submit button ─────────────────────────────────── */}
            <ButtonPaper
              mode="contained"
              onPress={handleStockOut}
              buttonColor={accentColor}
              textColor="#ffffff"
              loading={loading}
              style={{ marginTop: 24, borderRadius: 10 }}>
              Confirm Stock Out
            </ButtonPaper>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  searchWrapper: {
    paddingHorizontal: normalize(15),
    paddingTop: normalize(10),
    paddingBottom: 4,
    zIndex: 10,
  },
  searchbar: {
    borderRadius: 12,
    shadowColor: '#d0e1fd',
    borderColor: '#d0e1fd',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 5,
  },
  dropdownWrapper: {
    paddingBottom: PixelRatio.roundToNearestPixel(10),
    zIndex: 1000,
    marginHorizontal: normalize(15),
  },
  card: {
    marginHorizontal: normalize(15),
    marginTop: 12,
    borderRadius: 16,
    padding: normalize(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productName: {
    fontSize: 17,
    fontWeight: '700',
  },
  subText: {
    fontSize: 12,
    marginTop: 2,
  },
  itemIdBadge: {
    backgroundColor: '#fcd9d5',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  itemIdText: {
    color: '#C3423F',
    fontWeight: '700',
    fontSize: 12,
  },
  stockHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  stockLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  stockValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  typeDropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputCol: {
    flexDirection: 'column',
    marginTop: 4,
  },
})
