import { KeyboardTypeOptions } from "react-native"
import { TextInput } from "react-native-paper"

type InputPaperProps = {
  label: string
  value: string | number
  onChangeText: (msg: string | number) => void
  secureTextEntry?: boolean
  keyboardType?: KeyboardTypeOptions
  customStyle?: {}
  leftIcon?: string
  autoFocus?: boolean
  mode?: "outlined" | "flat"
  maxLength?: number
  selectTextOnFocus?: boolean
  disabled?: boolean
  clearTextOnFocus?: boolean
  multiline?: boolean
  // themeColors?: string
  hideUnderline?: boolean
  height?: number
}

const InputPaper = ({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  customStyle,
  leftIcon,
  autoFocus,
  mode = "flat",
  maxLength = 10,
  selectTextOnFocus,
  disabled,
  clearTextOnFocus,
  multiline=false,
  height,
  // themeColors,
  hideUnderline = false,
}: InputPaperProps) => {
  return (
    <TextInput
      selectTextOnFocus={selectTextOnFocus}
      mode={mode}
      keyboardType={keyboardType}
      label={label}
      value={value?.toString()}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      style={[customStyle,{height:height||37}]}
      left={leftIcon && <TextInput.Icon icon={leftIcon} />}
      // right={<TextInput.Icon icon={secureTextEntry ? "eye-off" : "eye"} onPress={() => setSecureTextEntry(!secureTextEntry)} />}
      autoFocus={autoFocus}
      maxLength={maxLength}
      underlineColor={'#404198'}
      underlineStyle={{ backgroundColor: '#404198' }}
      // cursorColor={'#404198'}
      activeOutlineColor="#404198"
      multiline={multiline}
      
      
      // selectionColor={'#404198'}
      // textColor={'#404198'}
      placeholderTextColor={'#404198'}
      disabled={disabled}
      clearTextOnFocus={clearTextOnFocus}
      // underlineStyle={{
      //   display: !hideUnderline ? "flex" : "none"
      // }}
    />
  )
}

export default InputPaper
