import { PropsWithChildren } from "react"
import { ScrollView, useColorScheme } from "react-native"
import normalize, { SCREEN_HEIGHT } from "react-native-normalize"

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
  const colorScheme = useColorScheme()
  return (
  //   <ScrollView
  //     keyboardShouldPersistTaps="handled"
  //     style={{
  //       width: normalize(width),
  //       height: SCREEN_HEIGHT/4,
  //       // backgroundColor: backgroundColor,
  //       backgroundColor: '#e7e7ebff',
  //       alignSelf: "center",
  //       // borderRadius: normalize(10),
  //       zIndex:999,
  //  marginBottom: normalize(12), borderRadius: normalize(8), padding: normalize(8) 

  //     }}
  //     nestedScrollEnabled={true}>
  //     {children}
  //   </ScrollView>
  <ScrollView
  keyboardShouldPersistTaps="handled"
  style={{
    width: normalize(width),
    // height: SCREEN_HEIGHT / 4,
    height: 'auto',
    // backgroundColor: '#f5f9ff',
    backgroundColor: backgroundColor,
    alignSelf: "center",
    borderRadius: normalize(12),
    elevation: 2,
    shadowColor: '#008181',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: normalize(12),
    padding: normalize(10),
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? '#2e2929ff' : '#d0e0e0',
  }}
  nestedScrollEnabled={true}
>
  {children}
</ScrollView>

  )
}
