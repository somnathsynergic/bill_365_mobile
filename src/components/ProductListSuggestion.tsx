import { Badge, Divider, List } from "react-native-paper"
import { usePaperColorScheme } from "../theme/theme"
import normalize from "react-native-normalize"
import { useColorScheme, View } from "react-native"

type ProductListSuggestionProps = {
  itemName: string
  unitPrice?: number
  stock?: number
  onPress?: () => void
  id?: number | string
  itemDesc?: string
  unit?: string
}

export default function ProductListSuggestion({
  id,
  itemName,
  itemDesc,
  unitPrice,
  stock,
  unit,
  onPress,
}: ProductListSuggestionProps) {
  const theme = usePaperColorScheme()
  const colorScheme = useColorScheme()
  return (
    <View style={{backgroundColor: colorScheme === 'dark' ? '#2e2929ff' : 'white'}}>
      <List.Item
        title={itemName}
        description={itemDesc}
        onPress={onPress}
        titleStyle={{fontSize:normalize(15)}}
        left={props => <List.Icon {...props} icon="basket" />}
        right={
          unitPrice
            ? props => (
                <Badge
                  {...props}
                  style={{
                    backgroundColor: colorScheme === 'dark' ? '#009689' : '#008181',
                    color: 'white',
                    paddingHorizontal:10
                  }}>
                  {unitPrice && `${unitPrice}/-`}
                  {/* {stock && `${stock}/-`} */}
                </Badge>
              )
            : props => (
                <Badge
                  {...props}
                  style={{
                    backgroundColor: '#ffcd04',
                    color: theme.colors.onTertiaryContainer,
                  }}>
                  {/* {unitPrice && `${unitPrice}/-`} */}
                  {stock &&
                    `${stock}${unit && unit !== "null" ? ` ${unit}` : ""}`}
                </Badge>
              )
        }
      />
      <Divider />
    </View>
  )
}
