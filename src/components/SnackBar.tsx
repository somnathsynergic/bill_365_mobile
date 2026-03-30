import { StyleSheet, View } from 'react-native'
import React from 'react'
import normalize, { SCREEN_WIDTH } from 'react-native-normalize'
import { usePaperColorScheme } from '../theme/theme'
import ButtonPaper from './ButtonPaper'
import { Badge, IconButton, Text } from 'react-native-paper'

type SnackBarProps = {
    totAmt: string
    cartItemQty?: number
    handleBtn1Press: () => void
    handleBtn2Press: () => void
    handleBtn3Press?: () => void
    disableNext?: boolean
    hideCart?: boolean
    disableCart?: boolean
}

const SnackBar = ({ 
    handleBtn1Press, 
    handleBtn2Press, 
    handleBtn3Press, 
    totAmt, 
    cartItemQty, 
    disableNext, 
    hideCart = false, 
    disableCart }: SnackBarProps) => {
    const theme = usePaperColorScheme()
    return (
        // <View style={{
        //     flexDirection: "row",
        //     paddingHorizontal: normalize(20),
        //     alignSelf: "center",
        //     width: SCREEN_WIDTH / 1.13,
        //     height: normalize(60),
        //     backgroundColor: '#008181',
        //     borderRadius: normalize(15),
        //     justifyContent: "space-between",
        //     alignItems: "center"
        // }}>
        //     <Text variant="bodyLarge" style={{ color: 'white',fontSize:normalize(15) }}>Total • ₹{totAmt}</Text>

        //     {!hideCart && <View style={{
        //         marginLeft: "1%"
        //     }}>
        //         <IconButton iconColor={'white'} icon="cart-variant" onPress={handleBtn3Press} disabled={disableCart} />
        //         <Badge visible={cartItemQty !== 0} style={{
        //             position: "absolute",
        //             top: 1,
        //             right: 1,
        //             backgroundColor: 'white',
        //             color: '#008181',
        //             fontWeight: "bold"
        //         }}>{cartItemQty}</Badge>
        //     </View>}

        //     <View style={{
        //         flexDirection: "row",
        //         alignItems: "center"
        //     }}>
        //         <ButtonPaper icon="arrow-right-thick" textColor={theme.colors.onVanilla} onPress={handleBtn1Press} mode="text" disabled={disableNext}>Next</ButtonPaper>
        //         <IconButton iconColor={theme.colors.onVanilla} icon="trash-can-outline" onPress={handleBtn2Press} disabled={disableCart}/>
        //     </View>
        // </View>
        <View style={{
  flexDirection: "row",
  paddingHorizontal: normalize(20),
  alignSelf: "center",
  width: SCREEN_WIDTH / 1.13,
  height: normalize(60),
  backgroundColor: '#008181',
  borderRadius: normalize(10),
  justifyContent: "space-between",
  alignItems: "center",
  elevation: 3,
  shadowColor: '#008181',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 3,
}}>
  <Text variant="bodyLarge" style={{ color: 'white', fontSize: normalize(15) }}>
    Total • ₹{totAmt}
  </Text>

  {!hideCart && (
    <View style={{ position: "relative" }}>
      <IconButton iconColor="white" icon="cart-variant" onPress={handleBtn3Press} disabled={disableCart} />
      <Badge visible={cartItemQty !== 0} style={{
        position: "absolute",
        top: 1,
        right: 1,
        backgroundColor: 'white',
        color: '#008181',
        fontWeight: "bold",
        fontSize: normalize(10),
        paddingHorizontal: normalize(4),
        borderRadius: normalize(10),
      }}>
        {cartItemQty}
      </Badge>
    </View>
  )}

  <View style={{
    flexDirection: "row",
    alignItems: "center",
  }}>
    <ButtonPaper
      icon="arrow-right-thick"
      textColor="white"
      onPress={handleBtn1Press}
      mode="text"
      disabled={disableNext}
      style={{ paddingHorizontal: normalize(10) }}
    >
      Next
    </ButtonPaper>
    <IconButton
      iconColor="white"
      icon="trash-can-outline"
      onPress={handleBtn2Press}
      disabled={disableCart}
    />
  </View>
</View>

    )
}

export default SnackBar

const styles = StyleSheet.create({})