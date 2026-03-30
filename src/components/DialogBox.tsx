import { PropsWithChildren } from "react"
import { Dialog, Portal, Button } from "react-native-paper"
import { usePaperColorScheme } from "../theme/theme"
import { useColorScheme } from "react-native"

type DialogBoxProps = {
  visible: boolean
  onFailure?: () => void
  onSuccess?: () => void
  hide: () => void
  title?: string
  btnFail?: string
  btnSuccess?: string
  icon?: string
  iconSize?: number
  titleStyle?: {}
  buttonSuccessIcon?: string
  dismissable?: boolean
  disabled?: boolean
  loading?: boolean
}

export default function DialogBox({
  children,
  visible,
  icon,
  iconSize,
  title,
  titleStyle,
  btnFail = "CANCEL",
  btnSuccess = "NEXT",
  onFailure,
  onSuccess,
  hide,
  dismissable = false,
}: PropsWithChildren<DialogBoxProps>) {
  const theme = usePaperColorScheme()
  const colorScheme = useColorScheme()
  return (
    <Portal>
      <Dialog
      style={{borderRadius:5,backgroundColor:colorScheme == "dark" ? '#2e2929ff' : 'white'}}
        visible={visible}
        onDismiss={hide}
        theme={theme}
        dismissable={dismissable}>
        {icon && <Dialog.Icon icon={icon} size={iconSize} />}
        {title && <Dialog.Title style={titleStyle}>{title}</Dialog.Title>}
        <Dialog.Content>{children}</Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onFailure} textColor={theme.colors.error}>
            {btnFail}
          </Button>
          <Button onPress={onSuccess} textColor="#008181">{btnSuccess}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )
}
