import React, { PropsWithChildren } from "react"
import { StyleSheet, ImageProps, View, ImageBackground } from "react-native"
import { Text, IconButton, TouchableRipple } from "react-native-paper"
import FastImage from 'react-native-fast-image'
import { IconSource } from "react-native-paper/lib/typescript/components/Icon"
import { BASE_URL, BASE_URL_CATEGORY_IMG } from "../config/config"
import { Image } from 'react-native';
import { home_flower_dark } from '../resources/images/home_flower_dark.png'
type CategoryButtonProps = {
  text: string
  onPress?: () => void
  icon?: IconSource
  color?: string
  textColor?: string
  withImage?: boolean
  imageSource?: string
  imageSourceObject?: ImageProps
}

export default function CategoryButton({
  text,
  icon,
  color,
  textColor,
  withImage,
  imageSource,
  imageSourceObject,
  onPress,
}: PropsWithChildren<CategoryButtonProps>) {
  console.log("RRRRRRRRRRRRRRRRRRRRRRRRR",)
  return (

    <TouchableRipple
      onPress={onPress}
      style={{
        width: "45%",
        // maxWidth: "48%",
        height: 75,
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
        alignItems: "center",
        backgroundColor: color,
        elevation: 2,
        // paddingVertical: 8,
        marginVertical: 5,
        // borderBottomColor: "#f0f0f0",
        // borderBottomWidth: 1,
        // paddingHorizontal: 10,
        shadowColor: '#008181',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        borderRadius: 14,
        transform: [{ scale: 1 }],


      }}


    >
      <ImageBackground
        source={imageSource ? { uri: `${BASE_URL_CATEGORY_IMG}${imageSource}` } : require(`../resources/images/home_flower_dark.webp`)}
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 14,
          height: '100%',
          width:'100%'
        }}
        imageStyle={{ borderRadius: 12 }}
      >
        <Text style={imageSource ? { textAlign: "center", color: 'white', fontWeight: '800' } : { textAlign: "center", color: 'white', fontWeight: '800' }}>{text}</Text>
      </ImageBackground>
    </TouchableRipple>
    // </ImageBackground>
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
