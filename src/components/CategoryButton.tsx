import React, { PropsWithChildren } from "react"
import { StyleSheet, ImageProps, View, ImageBackground } from "react-native"
import { Text, IconButton, TouchableRipple } from "react-native-paper"
import FastImage from 'react-native-fast-image'
import { IconSource } from "react-native-paper/lib/typescript/components/Icon"
import { BASE_URL, BASE_URL_CATEGORY_IMG } from "../config/config"
import { Image } from 'react-native';
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
  console.log("RRRRRRRRRRRRRRRRRRRRRRRRR", )
  return (
    
    <TouchableRipple
      onPress={onPress}
      style={{
        width: "45%",
        // maxWidth: "48%",
        height: 75,
        flexDirection:"row",
        justifyContent: "center",
        flexWrap:"wrap",
        alignItems: "center",
        borderRadius: 8,
        backgroundColor: color,
        elevation: 2,
        paddingVertical:25,
        marginVertical:5,
        borderBottomColor: "#f0f0f0",
        borderBottomWidth: 1,
        paddingHorizontal: 10,
      }}>
      <>
        {/* {
          imageSource
            ? 
            <FastImage
              source={{
                uri: `${BASE_URL_CATEGORY_IMG}${imageSource}`,
                priority: FastImage.priority.high,
                cache: FastImage.cacheControl.immutable
              }}
              style={{ width: 30, height: 30, backgroundColor: "#f5f9ff", borderRadius: 25, marginRight: 10 }}
            />

            : ""
              // <IconButton icon={icon} iconColor={textColor} containerColor={"#f5f9ff"} />
        } */}
        <Text style={{ textAlign: "center", color: textColor, fontWeight:'800' }}>{text}</Text>
      </>
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
