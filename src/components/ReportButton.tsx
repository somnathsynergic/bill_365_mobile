import React, { PropsWithChildren } from "react"
import { StyleSheet, ImageProps, View, useColorScheme } from "react-native"
import { Text, IconButton, TouchableRipple } from "react-native-paper"
import FastImage from 'react-native-fast-image'
import { IconSource } from "react-native-paper/lib/typescript/components/Icon"
import { BASE_URL, BASE_URL_CATEGORY_IMG } from "../config/config"
import { Image } from 'react-native';
import normalize from "react-native-normalize"
type ReportButtonProps = {
  text: string
  onPress?: () => void
  icon?: IconSource
  color?: string
  textColor?: string
  withImage?: boolean
  imageSource?: string
  imageSourceObject?: ImageProps
}

export default function ReportButton({
  text,
  icon,
  color,
  textColor,
  withImage,
  imageSource,
  imageSourceObject,
  onPress,
}: PropsWithChildren<ReportButtonProps>) {
  console.log("RRRRRRRRRRRRRRRRRRRRRRRRR", `${BASE_URL_CATEGORY_IMG}${imageSource}`)
  const colorScheme = useColorScheme()
  return (
    // <TouchableRipple
    //   onPress={onPress}
    //   style={{
    //     width: "100%",
    //     height: 60,
    //     flexDirection:"row",
    //     justifyContent: "flex-start",
    //     alignItems: "center",
    //     backgroundColor: color,
    //     // elevation: 2,
    //     paddingVertical:5,
    //     marginVertical:-5,
    //     borderBottomColor: "#f0f0f0",
    //     borderBottomWidth: 1,
    //     paddingHorizontal: 10,
    //   }}>
    //   <>
    //     {
    //       imageSource
    //         ? 
    //         <FastImage
    //           source={{
    //             uri: `${BASE_URL_CATEGORY_IMG}${imageSource}`,
    //             priority: FastImage.priority.high,
    //             cache: FastImage.cacheControl.immutable
    //           }}
    //           style={{ width: 40, height: 40, backgroundColor: "#f5f9ff", borderRadius: 25, marginRight: 10 }}
    //         />

    //         : 
    //           <IconButton icon={icon} iconColor={textColor} containerColor={"#f5f9ff"} />
    //     }
    //     <Text style={{ textAlign: "center", color: textColor }}>{text}</Text>
    //   </>
    // </TouchableRipple>
    <TouchableRipple
  onPress={onPress}
  style={{
    width: '100%',
    height: 60,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: colorScheme === 'dark' ? '#2e2929ff' : '#fff',
    borderRadius: normalize(6),
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(10),
    marginBottom: normalize(0),
    elevation: 1,
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? '#2e2929ff' :  "#ececf0ff",
  }}
>
  <>
    {imageSource ? (
      <FastImage
        source={{
          uri: `${BASE_URL_CATEGORY_IMG}${imageSource}`,
          priority: FastImage.priority.high,
          cache: FastImage.cacheControl.immutable,
        }}
        style={{
          width: 40,
          height: 40,
          backgroundColor: '#f5f9ff',
          borderRadius: 20,
          marginRight: normalize(10),
        }}
      />
    ) : (
      <IconButton icon={icon} iconColor={colorScheme === 'dark' ?'white' : "#009689"} containerColor={colorScheme === 'dark' ? '#009689' : "#f5f9ff"} />
    )}
    <Text style={{ color: colorScheme === 'dark' ?'#009689' : "#008181", fontSize: normalize(14) }}>{text}</Text>
  </>
</TouchableRipple>
  )
}

const styles = StyleSheet.create({
  buttonImageIconStyle: {
    padding: 10,
    margin: 5,
    height: 50,
    width: 50,
  },
});
