import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// 模拟图片选择器，解决原生模块问题
import { useAuth } from '../context/AuthContext';

interface EditProfileFormProps {
  theme: 'light' | 'dark';
  colors: any;
  onClose: () => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({
  theme,
  colors,
  onClose,
}) => {
  const { user, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // 选择图片 - 模拟实现
  const pickImage = () => {
    console.log('模拟选择图片');

    // 使用预定义样例头像
    const sampleAvatars = [
      'https://randomuser.me/api/portraits/men/32.jpg',
      'https://randomuser.me/api/portraits/women/44.jpg',
      'https://randomuser.me/api/portraits/men/75.jpg',
      'https://randomuser.me/api/portraits/women/68.jpg',
      'https://randomuser.me/api/portraits/men/45.jpg',
      'https://randomuser.me/api/portraits/women/22.jpg',
    ];

    // 显示头像选择界面
    Alert.alert(
      '选择头像',
      '请选择一个头像样式',
      sampleAvatars.slice(0, 3).map((avatar, index) => ({
        text: `头像 ${index + 1}`,
        onPress: () => {
          console.log('设置新头像:', avatar);
          setPhotoURL(avatar);
          // 显示成功提示
          setTimeout(() => {
            Alert.alert('成功', '头像已更新');
          }, 300);
        }
      })).concat([{
        text: '更多选项...',
        onPress: () => {
          // 显示更多头像选项
          setTimeout(() => {
            Alert.alert(
              '更多头像',
              '请选择一个头像样式',
              sampleAvatars.slice(3).map((avatar, index) => ({
                text: `头像 ${index + 4}`,
                onPress: () => {
                  console.log('设置新头像:', avatar);
                  setPhotoURL(avatar);
                  // 显示成功提示
                  setTimeout(() => {
                    Alert.alert('成功', '头像已更新');
                  }, 300);
                }
              })).concat([{
                text: '取消',
                style: 'cancel'
              }])
            );
          }, 300);
        }
      }, {
        text: '取消',
        style: 'cancel'
      }])
    );
  };

  // 保存表单
  const handleSubmit = async () => {
    if (!displayName.trim()) {
      setError('用户名不能为空');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 在真实应用中，这里应该上传图片到存储服务
      // 这里我们直接使用本地 URI
      const result = await updateProfile({
        displayName,
        // 在真实场景下，不应该直接修改 email，这需要重新验证
        // 这里为了演示，我们允许直接修改
        email,
        photoURL,
      });

      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.error || '更新失败');
      }
    } catch (err: any) {
      setError(err.message || '更新过程中出现错误');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>编辑个人资料</Text>
      </View>

      {/* 头像选择 */}
      <View style={styles.avatarContainer}>
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={() => {
            console.log('头像点击事件');
            Alert.alert(
              '选择头像',
              '您想要更换头像吗？',
              [
                { text: '取消', style: 'cancel' },
                { text: '确定', onPress: pickImage }
              ]
            );
          }}
          style={styles.avatarTouchable}
        >
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme === 'dark' ? '#4B5563' : '#E5E7EB' }]}>
              <Text style={[styles.avatarText, { color: theme === 'dark' ? '#E5E7EB' : '#4B5563' }]}>
                {displayName ? displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
          {/* <View style={styles.avatarOverlay}>
            <Ionicons name="camera" size={16} color="#FFFFFF" />
            <Text style={{color: '#FFFFFF', fontSize: 12, marginTop: 2}}>点击更换</Text>
          </View> */}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.changePhotoButton, { backgroundColor: colors.card }]}
          onPress={pickImage}
        >
          <Ionicons name="camera" size={20} color={colors.text} />
          <Text style={[styles.changePhotoText, { color: colors.text }]}>选择头像</Text>
        </TouchableOpacity>
      </View>

      {/* 表单字段 */}
      <View style={styles.formSection}>
        <Text style={[styles.sectionLabel, { color: colors.sub }]}>用户信息</Text>

        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.inputLabel, { color: colors.sub }]}>用户名</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="请输入用户名"
            placeholderTextColor={colors.hint}
          />
        </View>

        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.inputLabel, { color: colors.sub }]}>电子邮箱</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={email}
            onChangeText={setEmail}
            placeholder="请输入电子邮箱"
            placeholderTextColor={colors.hint}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}
        {isSuccess && <Text style={styles.successText}>个人资料更新成功！</Text>}
      </View>

      {/* 按钮 */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
          onPress={onClose}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>取消</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.saveButton,
            { backgroundColor: isLoading ? colors.hint : '#2563EB' }
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[styles.buttonText, styles.saveButtonText]}>保存</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarTouchable: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '600',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    borderRadius: 20,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  changePhotoText: {
    marginLeft: 8,
    fontSize: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    paddingVertical: 8,
  },
  errorText: {
    color: '#EF4444',
    marginVertical: 8,
  },
  successText: {
    color: '#10B981',
    marginVertical: 8,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 8,
    borderWidth: 1,
  },
  saveButton: {
    marginLeft: 8,
    backgroundColor: '#2563EB',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#FFFFFF',
  },
});

export default EditProfileForm;