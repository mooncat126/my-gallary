import React, { ReactNode } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';

// Light and dark mode theme colors
const Light = {
  button: {
    background: '#FFFFFF',
    text: '#111417',
    border: '#E5E7EB',
    primary: '#2563EB',
    primaryText: '#FFFFFF',
    cancelBorder: '#D1D5DB',
    cancelText: '#111417',
  }
};

const Dark = {
  button: {
    background: '#111214',
    text: '#E7E9ED',
    border: '#374151',
    primary: '#3B82F6',
    primaryText: '#FFFFFF',
    cancelBorder: '#4B5563',
    cancelText: '#E7E9ED',
  }
};

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
  isIcon?: boolean; // 用于区分是否为图标按钮
  theme?: 'light' | 'dark';
  variant?: 'default' | 'primary' | 'cancel';
  colors?: any; // 接收外部传入的颜色主题（可选）
}

const CustomButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  children,
  textColor,
  borderColor,
  isIcon = false,
  theme = 'light',
  variant = 'default',
  colors
}: CustomButtonProps) => {
  // 根据主题选择颜色
  const themeColors = theme === 'dark' ? Dark.button : Light.button;

  // 使用外部传入的colors，如果存在的话
  const buttonColors = colors?.button || themeColors;

  // 根据variant确定样式
  let buttonBorderColor = borderColor;
  let buttonTextColor = textColor;

  if (!borderColor) {
    if (variant === 'primary') {
      buttonBorderColor = buttonColors.primary;
    } else if (variant === 'cancel') {
      buttonBorderColor = buttonColors.cancelBorder;
    } else {
      buttonBorderColor = buttonColors.border;
    }
  }

  if (!textColor) {
    if (variant === 'primary') {
      buttonTextColor = buttonColors.primaryText;
    } else if (variant === 'cancel') {
      buttonTextColor = buttonColors.cancelText;
    } else {
      buttonTextColor = buttonColors.text;
    }
  }
  return (
    <TouchableOpacity
      style={[
        isIcon ? styles.iconButton : styles.button,
        { borderColor: buttonBorderColor },
        variant === 'primary' && { backgroundColor: buttonColors.primary },
        disabled && { opacity: 0.6 },
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
        <Text style={[styles.buttonText, { color: buttonTextColor }, textStyle]}>
          {title}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
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