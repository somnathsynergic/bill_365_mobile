import { PropsWithChildren } from "react"
import { StyleSheet, Text, View } from "react-native"
import normalize from "react-native-normalize"

type ProfileSectionProps = {
  bgColor: string
}

const ProfileSection = ({
  bgColor,
  children,
}: PropsWithChildren<ProfileSectionProps>) => {
  return (

    <View
      style={{
        width: "100%",
        // minHeight: normalize(190),
        height: "auto",
        borderRadius: normalize(12),
        backgroundColor: bgColor,
        padding: normalize(20),
        
      }}>
      {children}
    </View>
  )
}

export default ProfileSection

const styles = StyleSheet.create({})
