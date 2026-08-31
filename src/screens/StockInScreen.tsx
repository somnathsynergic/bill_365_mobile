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
import { ItemsData, StockSearchCredentials, StockInCredentials } from '../models/api_types'
import { AppStoreContext } from '../models/custom_types'
import { AppStore } from '../context/AppContext'
import ProductListSuggestion from '../components/ProductListSuggestion'
import ScrollableListContainer from '../components/ScrollableListContainer'
import { loginStorage } from '../storage/appStorage'
import useStockSearch from '../hooks/api/useStockSearch'
import useStockIn from '../hooks/api/useStockIn'
import InputPaper from '../components/InputPaper'
import ButtonPaper from '../components/ButtonPaper'
import DatePicker from 'react-native-date-picker'
import MenuPaperWithoutRestriction from '../components/MenuPaperWithoutRestriction'

const GST_OPTIONS = [
  { label: 'Exempted', cgst: 0, sgst: 0 },
  { label: '0%', cgst: 0, sgst: 0 },
  { label: '5% (2.5+2.5)', cgst: 2.5, sgst: 2.5 },
  { label: '12% (6+6)', cgst: 6, sgst: 6 },
  { label: '18% (9+9)', cgst: 9, sgst: 9 },
  { label: '28% (14+14)', cgst: 14, sgst: 14 },
]

export default function StockInScreen() {
  const theme = usePaperColorScheme()
  const colorScheme = useColorScheme()
  const isFocused = useIsFocused()
  const searchRef = useRef(null)

  const { items, handleGetItems } = useContext<AppStoreContext>(AppStore)
  const loginStore = JSON.parse(loginStorage.getString('login-data'))

  const { fetchStock } = useStockSearch()
  const { stockIn } = useStockIn()

  // ─── Search state ────────────────────────────────────────────────────
  const [search, setSearch] = useState<string>('')
  const [filteredItems, setFilteredItems] = useState<ItemsData[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [product, setProduct] = useState<ItemsData | undefined>(undefined)

  // ─── Current stock (fetched) ─────────────────────────────────────────
  const [currentStock, setCurrentStock] = useState<number | null>(null)

  // ─── Form state ──────────────────────────────────────────────────────
  const [qtyToAdd, setQtyToAdd] = useState<string>('')
  const [stockInPrice, setStockInPrice] = useState<string>('')
  const [sellingPrice, setSellingPrice] = useState<string>('')
  const [selectedGst, setSelectedGst] = useState(GST_OPTIONS[0])
  const [loading, setLoading] = useState(false)
  const [expiryDate, setExpiryDate] = useState<Date | null>(null)
  const [openExpiryDate, setOpenExpiryDate] = useState(false)
  const [mfgDate, setMfgDate] = useState<Date | null>(null)
  const [openMfgDate, setOpenMfgDate] = useState(false)
  const [batchNo, setBatchNo] = useState('')

  // ─── Qty change handler – strips negatives ───────────────────────────
  const onChangeQty = (txt: string) => {
    const sanitised = txt.replace(/-/g, '')
    setQtyToAdd(sanitised)
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
  const handleStockIn = async () => {
    if (!product) {
      ToastAndroid.show('Please select a product first.', ToastAndroid.SHORT)
      return
    }
    if (!qtyToAdd || +qtyToAdd <= 0) {
      ToastAndroid.show('Enter a valid quantity.', ToastAndroid.SHORT)
      return
    }
    if (+qtyToAdd < 0) {
      ToastAndroid.show('Quantity cannot be negative.', ToastAndroid.SHORT)
      return
    }
    if (!stockInPrice || +stockInPrice <= 0) {
      ToastAndroid.show('Enter a valid stock-in price.', ToastAndroid.SHORT)
      return
    }

    const payload: StockInCredentials = {
      comp_id: loginStore?.comp_id,
      br_id: loginStore?.br_id,
      item_id: product.item_id,
      in_price: +stockInPrice,
      sale_price: +sellingPrice,
      in_cgst: selectedGst.cgst,
      in_sgst: selectedGst.sgst,
      qty: +qtyToAdd,
      created_by: loginStore?.user_id,
      exp_dt: expiryDate ? expiryDate.toISOString().split('T')[0] : undefined,
      mfg_dt: mfgDate ? mfgDate.toISOString().split('T')[0] : undefined,
      batch_no: batchNo || undefined,
    }

    setLoading(true)
    try {
      await stockIn(payload)
      ToastAndroid.show('Stock updated successfully!', ToastAndroid.SHORT)
      const res: any = await fetchStock({
        comp_id: loginStore?.comp_id,
        br_id: loginStore?.br_id,
        item_id: product.item_id,
      })
      setCurrentStock(res?.stock ?? 0)
      setQtyToAdd('')
      setStockInPrice('')
      setSellingPrice('')
      setSelectedGst(GST_OPTIONS[0])
      setExpiryDate(null)
      setMfgDate(null)
      setBatchNo('')
    } catch (err) {
      console.log('StockIn error', err)
      ToastAndroid.show('Failed to update stock.', ToastAndroid.SHORT)
    } finally {
      setLoading(false)
    }
  }

  // ─── Derived ─────────────────────────────────────────────────────────
  const isDark = colorScheme === 'dark'
  const cardBg = isDark ? '#1e1e2e' : '#ffffff'
  const labelColor = isDark ? '#a0aec0' : '#4a5568'
  const valueColor = isDark ? '#e2e8f0' : '#1a202c'
  const accentColor = '#008181'

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
          Stock In
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
              { backgroundColor: isDark ? '#2d2d3e' : '#f5f9ff' },
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
                <Text style={[styles.stockValue, { color: accentColor }]}>
                  {currentStock !== null ? currentStock : '—'}
                  {product.unit_name ? ` ${product.unit_name}` : ''}
                </Text>
              </View>

              {qtyToAdd !== '' && +qtyToAdd > 0 && currentStock !== null && (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.stockLabel, { color: labelColor }]}>
                    After Stock In
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: labelColor, fontSize: 18 }}>→</Text>
                    <Text style={[styles.stockValue, { color: '#22c55e', fontSize: 26 }]}>
                      {currentStock + +qtyToAdd}
                      {product.unit_name ? ` ${product.unit_name}` : ''}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <Divider style={{ marginVertical: 10, opacity: 0.3 }} />

            {/* ── GST Rate dropdown ─────────────────────────────── */}
            <View style={styles.gstDropdownRow}>
              <Text style={[styles.sectionLabel, { color: labelColor, marginBottom: 0, alignSelf: 'center', marginRight: 12 }]}>
                GST Rate
              </Text>
              <MenuPaperWithoutRestriction
                title={selectedGst.label}
                mode="outlined"
                textColor={accentColor}
                customStyle={{ borderColor: accentColor, borderRadius: 8 }}
                menuArrOfObjects={GST_OPTIONS.map(opt => ({
                  title: opt.label,
                  func: () => setSelectedGst(opt),
                }))}
              />
            </View>

            {/* CGST / SGST display */}
            {(selectedGst.cgst > 0 || selectedGst.sgst > 0) && (
              <View style={styles.gstDisplay}>
                <Text style={[styles.gstTag, { color: accentColor }]}>
                  CGST {selectedGst.cgst}%
                </Text>
                <Text style={[styles.gstTag, { color: accentColor }]}>
                  SGST {selectedGst.sgst}%
                </Text>
              </View>
            )}

            <Divider style={{ marginVertical: 10, opacity: 0.3 }} />

            {/* ── Quantity ──────────────────────── */}
            <View style={{ marginTop: 6, marginBottom: 4 }}>
              <InputPaper
                label="Qty to Stock In"
                onChangeText={onChangeQty}
                value={qtyToAdd}
                keyboardType="numeric"
                mode="outlined"
                selectTextOnFocus
              />
            </View>

            {/* ── Prices ──────────────────────── */}
            <View style={styles.inputRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <InputPaper
                  label="Purchase Price"
                  onChangeText={(txt: string) => setStockInPrice(txt)}
                  value={stockInPrice}
                  keyboardType="numeric"
                  mode="outlined"
                  selectTextOnFocus
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <InputPaper
                  label="Selling Price"
                  onChangeText={(txt: string) => setSellingPrice(txt)}
                  value={sellingPrice}
                  keyboardType="numeric"
                  mode="outlined"
                  selectTextOnFocus
                />
              </View>
            </View>

            {/* ── Batch No ─────────────────────────────────────── */}
            <View style={{ marginTop: 6, marginBottom: 4 }}>
              <InputPaper
                label="Batch No. (Optional)"
                onChangeText={(txt: string) => setBatchNo(txt)}
                value={batchNo}
                mode="outlined"
              />
            </View>

            {/* ── Expiry Date ───────────────────────────────────── */}
            <ButtonPaper
              mode="outlined"
              onPress={() => setOpenExpiryDate(true)}
              style={{
                marginTop: 10,
                borderRadius: 10,
                borderColor: expiryDate ? accentColor : (isDark ? '#4a5568' : '#cbd5e0'),
              }}
              textColor={expiryDate ? accentColor : labelColor}
              icon="calendar">
              {expiryDate
                ? `Expiry: ${expiryDate.toLocaleDateString('en-GB')}`
                : 'Set Expiry Date (optional)'}
            </ButtonPaper>

            <DatePicker
              modal
              mode="date"
              open={openExpiryDate}
              date={expiryDate ?? new Date()}
              minimumDate={new Date()}
              onConfirm={date => {
                setOpenExpiryDate(false)
                setExpiryDate(date)
              }}
              onCancel={() => setOpenExpiryDate(false)}
            />

            {/* ── Manufacturing Date ────────────────────────────── */}
            <ButtonPaper
              mode="outlined"
              onPress={() => setOpenMfgDate(true)}
              style={{
                marginTop: 10,
                borderRadius: 10,
                borderColor: mfgDate ? accentColor : (isDark ? '#4a5568' : '#cbd5e0'),
              }}
              textColor={mfgDate ? accentColor : labelColor}
              icon="calendar">
              {mfgDate
                ? `Mfg: ${mfgDate.toLocaleDateString('en-GB')}`
                : 'Set Mfg Date (optional)'}
            </ButtonPaper>

            <DatePicker
              modal
              mode="date"
              open={openMfgDate}
              date={mfgDate ?? new Date()}
              maximumDate={new Date()} // Mfg date shouldn't be in the future usually
              onConfirm={date => {
                setOpenMfgDate(false)
                setMfgDate(date)
              }}
              onCancel={() => setOpenMfgDate(false)}
            />

            {/* ── Summary card ──────────────────────────────────── */}
            {qtyToAdd && stockInPrice && +qtyToAdd > 0 && +stockInPrice > 0 && (
              <View style={[styles.summaryCard, { backgroundColor: isDark ? '#0d1b2a' : '#e6f4f4' }]}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: labelColor }]}>Base Total</Text>
                  <Text style={[styles.summaryValue, { color: valueColor }]}>
                    ₹ {(+qtyToAdd * +stockInPrice).toFixed(2)}
                  </Text>
                </View>
                {selectedGst.cgst > 0 && (
                  <>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: labelColor }]}>
                        CGST ({selectedGst.cgst}%)
                      </Text>
                      <Text style={[styles.summaryValue, { color: valueColor }]}>
                        ₹ {(+qtyToAdd * +stockInPrice * selectedGst.cgst / 100).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: labelColor }]}>
                        SGST ({selectedGst.sgst}%)
                      </Text>
                      <Text style={[styles.summaryValue, { color: valueColor }]}>
                        ₹ {(+qtyToAdd * +stockInPrice * selectedGst.sgst / 100).toFixed(2)}
                      </Text>
                    </View>
                    <Divider style={{ marginVertical: 6, opacity: 0.3 }} />
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: accentColor, fontWeight: '700' }]}>
                        Grand Total (incl. GST)
                      </Text>
                      <Text style={[styles.summaryValue, { color: accentColor, fontWeight: '700', fontSize: 15 }]}>
                        ₹ {(+qtyToAdd * +stockInPrice * (1 + (selectedGst.cgst + selectedGst.sgst) / 100)).toFixed(2)}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            )}

            {/* ── Submit button ─────────────────────────────────── */}
            <ButtonPaper
              mode="contained"
              onPress={handleStockIn}
              buttonColor={accentColor}
              textColor="#ffffff"
              loading={loading}
              style={{ marginTop: 18, borderRadius: 10 }}>
              Stock In
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
  gstDropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  gstDisplay: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  gstTag: {
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: '#e6f4f4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  inputRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  summaryCard: {
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
  },
})
