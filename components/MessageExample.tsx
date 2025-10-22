import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Message from './Message';

interface MessageExampleProps {
  theme: 'light' | 'dark';
  colors: any;
}

/**
 * 消息组件示例
 *
 * 用法:
 * <MessageExample theme={theme} colors={colors} />
 */
const MessageExample: React.FC<MessageExampleProps> = ({ theme, colors }) => {
  const [messages, setMessages] = useState<{
    success: boolean;
    error: boolean;
    warning: boolean;
    info: boolean;
  }>({
    success: false,
    error: false,
    warning: false,
    info: false,
  });

  // 显示特定类型的消息
  const showMessage = (type: 'success' | 'error' | 'warning' | 'info') => {
    setMessages({ ...messages, [type]: true });

    // 5秒后自动隐藏
    setTimeout(() => {
      setMessages((prev) => ({ ...prev, [type]: false }));
    }, 5000);
  };

  // 关闭特定类型的消息
  const closeMessage = (type: 'success' | 'error' | 'warning' | 'info') => {
    setMessages({ ...messages, [type]: false });
  };

  // 示例按钮样式
  const buttonStyle = {
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderColor: theme === 'dark' ? '#4B5563' : '#D1D5DB',
  };

  const buttonTextStyle = {
    color: theme === 'dark' ? '#E5E7EB' : '#111827',
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        消息提示组件示例
      </Text>

      <View style={styles.messagesContainer}>
        {/* 成功消息 */}
        <Message
          type="success"
          message="操作成功！数据已成功保存。"
          visible={messages.success}
          onClose={() => closeMessage('success')}
          autoClose={false}
          theme={theme}
          colors={colors}
        />

        {/* 错误消息 */}
        <Message
          type="error"
          message="操作失败！请检查您的输入并重试。"
          visible={messages.error}
          onClose={() => closeMessage('error')}
          autoClose={false}
          theme={theme}
          colors={colors}
        />

        {/* 警告消息 */}
        <Message
          type="warning"
          message="请注意！此操作无法撤销。"
          visible={messages.warning}
          onClose={() => closeMessage('warning')}
          autoClose={false}
          theme={theme}
          colors={colors}
        />

        {/* 信息消息 */}
        <Message
          type="info"
          message="提示：您可以点击右上角按钮获取更多帮助。"
          visible={messages.info}
          onClose={() => closeMessage('info')}
          autoClose={false}
          theme={theme}
          colors={colors}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, buttonStyle, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
          onPress={() => showMessage('success')}
        >
          <Text style={[styles.buttonText, { color: '#047857' }]}>成功消息</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, buttonStyle, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
          onPress={() => showMessage('error')}
        >
          <Text style={[styles.buttonText, { color: '#B91C1C' }]}>错误消息</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, buttonStyle, { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' }]}
          onPress={() => showMessage('warning')}
        >
          <Text style={[styles.buttonText, { color: '#B45309' }]}>警告消息</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, buttonStyle, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
          onPress={() => showMessage('info')}
        >
          <Text style={[styles.buttonText, { color: '#1D4ED8' }]}>信息消息</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  messagesContainer: {
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    minWidth: '48%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  }
});

export default MessageExample;