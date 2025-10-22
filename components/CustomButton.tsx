import React, { ReactNode } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface CustomButtonProps {
  title?: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  children?: ReactNode;
  textColor?: string;
  borderColor?: string;
  isIcon?: boolean; // 添加isIcon属性，用于区分是否为图标按钮
}

const CustomButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  children,
  textColor = '#000',
  borderColor = '#ddd',
  isIcon = false
}: CustomButtonProps) => {
  return (
    <TouchableOpacity
      style={[
        isIcon ? styles.iconButton : styles.button,
        { borderColor: borderColor },
        style
      ]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : children ? (
        children
      ) : title ? (
        <Text style={[styles.buttonText, { color: textColor }, textStyle]}>
          {title}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  // 图标按钮的样式，移除一些会影响布局的属性
  iconButton: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // 移除width, padding和margin，让外部style完全控制
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CustomButton;