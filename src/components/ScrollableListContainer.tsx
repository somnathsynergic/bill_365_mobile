import { PropsWithChildren } from "react"
import { ScrollView } from "react-native"
import normalize from "react-native-normalize"

type ScrollableListContainerProps = {
  backgroundColor: string
  height?: number
  width?: number
}

export default function ScrollableListContainer({
  children,
  backgroundColor,
  height = 220,
  width = 325,
}: PropsWithChildren<ScrollableListContainerProps>) {
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      style={{
        width: normalize(width),
        height: 'auto',
        // backgroundColor: backgroundColor,
        backgroundColor: '#f1f6ffff',
        alignSelf: "center",
        borderRadius: normalize(10),
        zIndex:999
      }}
      nestedScrollEnabled={true}>
      {children}
    </ScrollView>
  )
}
