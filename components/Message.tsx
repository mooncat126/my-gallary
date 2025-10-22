import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type MessageType = 'success' | 'error' | 'warning' | 'info';

interface MessageProps {
  type: MessageType;
  message: string;
  visible: boolean;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
  theme?: 'light' | 'dark';
  colors?: any; // 接收外部传入的颜色主题
}

/**
 * 通用消息提示组件
 *
 * 用法示例:
 * <Message
 *   type="success"
 *   message="操作成功！"
 *   visible={true}
 *   theme={theme}
 *   colors={colors}
 * />
 */
const Message: React.FC<MessageProps> = ({
  type = 'info',
  message,
  visible = false,
  onClose,
  autoClose = true,
  duration = 3000,
  style,
  textStyle,
  theme = 'light',
  colors,
}) => {
  const [opacity] = useState(new Animated.Value(0));
  const [isVisible, setIsVisible] = useState(visible);

  // 默认颜色方案
  const defaultColors = {
    // 浅色模式
    light: {
      success: {
        background: '#ECFDF5',
        text: '#047857',
        border: '#A7F3D0',
        icon: '#059669',
      },
      error: {
        background: '#FEF2F2',
        text: '#B91C1C',
        border: '#FECACA',
        icon: '#DC2626',
      },
      warning: {
        background: '#FFFBEB',
        text: '#B45309',
        border: '#FEF3C7',
        icon: '#D97706',
      },
      info: {
        background: '#EFF6FF',
        text: '#1D4ED8',
        border: '#BFDBFE',
        icon: '#3B82F6',
      },
    },
    // 深色模式
    dark: {
      success: {
        background: '#064E3B',
        text: '#A7F3D0',
        border: '#065F46',
        icon: '#34D399',
      },
      error: {
        background: '#7F1D1D',
        text: '#FECACA',
        border: '#991B1B',
        icon: '#F87171',
      },
      warning: {
        background: '#78350F',
        text: '#FDE68A',
        border: '#92400E',
        icon: '#FBBF24',
      },
      info: {
        background: '#1E3A8A',
        text: '#BFDBFE',
        border: '#1E40AF',
        icon: '#60A5FA',
      },
    },
  };

  // 根据type和theme选择颜色
  const getColors = () => {
    // 如果外部传入了颜色，优先使用外部颜色
    if (colors && colors[type]) {
      return colors[type];
    }
    return defaultColors[theme][type];
  };

  // 获取对应类型的图标
  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'information-circle';
    }
  };

  // 处理动画和自动关闭
  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // 自动关闭逻辑
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      handleClose();
    }
  }, [visible]);

  // 关闭消息
  const handleClose = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      onClose && onClose();
    });
  };

  if (!isVisible) return null;

  // 获取当前类型的颜色配置
  const currentColors = getColors();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          backgroundColor: currentColors.background,
          borderColor: currentColors.border,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name={getIcon()}
          size={20}
          color={currentColors.icon}
          style={styles.icon}
        />
        <Text style={[styles.message, { color: currentColors.text }, textStyle]}>
          {message}
        </Text>
      </View>

      {/* 关闭按钮 */}
      {onClose && (
        <TouchableOpacity
          onPress={handleClose}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          style={styles.closeButton}
        >
          <Ionicons
            name="close"
            size={16}
            color={currentColors.text}
            style={{ opacity: 0.7 }}
          />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default Message;