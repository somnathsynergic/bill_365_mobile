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
      style={[customStyle,{height:height,borderColor:'#008181'}]}
      left={leftIcon && <TextInput.Icon icon={leftIcon} />}
      // right={<TextInput.Icon icon={secureTextEntry ? "eye-off" : "eye"} onPress={() => setSecureTextEntry(!secureTextEntry)} />}
      autoFocus={autoFocus}
      maxLength={maxLength}
      underlineColor={'#008181'}
      underlineStyle={{ backgroundColor: '#008181' }}
      // cursorColor={'#008181'}
      activeOutlineColor="#008181"
     theme={{ colors: { primary:'#008181', text: '#008181' } }}
      multiline={multiline}
      placeholderTextColor={'red'}
      
      
      // selectionColor={'#008181'}
      // textColor={'#008181'}
      disabled={disabled}
      clearTextOnFocus={clearTextOnFocus}
      // underlineStyle={{
      //   display: !hideUnderline ? "flex" : "none"
      // }}
    />
  )
}

export default InputPaper
