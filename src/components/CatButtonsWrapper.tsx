import { View } from "react-native"
import React, { PropsWithChildren } from "react"
import normalize from "react-native-normalize"

export default function ReportButtonsWrapper({ children }: PropsWithChildren) {
  return (
    <View
      style={{
        // padding: normalize(10),
        // flex: 1,
        // flexDirection: "column",
        // flexWrap: "wrap",
        // // gap: 10,
        // alignItems: "center",
        // justifyContent: "center",

        flexDirection: 'row', // Arrange items horizontally
    flexWrap: 'wrap',     // Allow items to wrap to the next line
    justifyContent: 'space-around', // Distribute items evenly
    padding: 10,
      }}>
      {children}
    </View>
  )
}
