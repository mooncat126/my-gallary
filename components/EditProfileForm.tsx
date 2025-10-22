import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  ScrollView,
  Modal,
  FlatList,
  Pressable,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// 模拟图片选择器，解决原生模块问题
import { useAuth } from '../context/AuthContext';
import CustomButton from './CustomButton';

interface EditProfileFormProps {
  theme: 'light' | 'dark';
  colors: any;
  onClose: () => void;
}

// Sample avatar list
const DEFAULT_AVATARS = [
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/men/75.jpg',
  'https://randomuser.me/api/portraits/women/68.jpg',
  'https://randomuser.me/api/portraits/men/45.jpg',
  'https://randomuser.me/api/portraits/women/22.jpg',
  'https://randomuser.me/api/portraits/men/57.jpg',
  'https://randomuser.me/api/portraits/women/33.jpg',
  'https://randomuser.me/api/portraits/women/51.jpg',
  'https://randomuser.me/api/portraits/men/18.jpg',
  'https://randomuser.me/api/portraits/women/91.jpg',
  'https://randomuser.me/api/portraits/men/25.jpg',
];

const { width } = Dimensions.get('window');
const AVATAR_SIZE = width / 4 - 16; // 4 avatars per row with some spacing

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

  // Avatar selection modal state
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  // 打开头像选择模态框
  const pickImage = () => {
    setSelectedAvatar(photoURL || null);
    setAvatarModalVisible(true);
  };

  // 选择默认头像
  const handleAvatarSelect = (avatar: string) => {
    setSelectedAvatar(avatar);
  };

  // 确认选择头像
  const confirmAvatarSelection = () => {
    if (selectedAvatar) {
      setPhotoURL(selectedAvatar);
      setAvatarModalVisible(false);

      // 显示成功提示
      setTimeout(() => {
        Alert.alert('成功', '头像已更新');
      }, 300);
    }
  };

  // 选择本地图片（模拟实现）
  const handleLocalImageUpload = () => {
    // 在真实应用中，这里会打开设备的图片选择器
    // 由于这是模拟环境，我们只是显示一个提示
    Alert.alert(
      '选择本地图片',
      '在真实应用中，这会打开设备的图片选择器',
      [
        {
          text: '选择图片',  // 简化文本以避免截断
          onPress: () => {
            // 模拟选择了一个随机头像
            const randomAvatar = DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
            setSelectedAvatar(randomAvatar);
          }
        },
        { text: '取消', style: 'cancel' }
      ]
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
        <View style={styles.avatarTouchable}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme === 'dark' ? '#4B5563' : '#E5E7EB' }]}>
              <Text style={[styles.avatarText, { color: theme === 'dark' ? '#E5E7EB' : '#4B5563' }]}>
                {displayName ? displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>

        <CustomButton
          title="选择头像"
          onPress={pickImage}
          style={{...styles.button, marginTop: 16, width: '50%'}}
        />
      </View>

      {/* 头像选择模态框 */}
      <Modal
        visible={avatarModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <View style={[styles.modalOverlay, {backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)'}]}>
          <View style={[styles.modalContainer, {backgroundColor: colors.bg, borderColor: colors.border}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: colors.text}]}>选择头像</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setAvatarModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {selectedAvatar && (
                <View style={styles.previewContainer}>
                  <Text style={[styles.previewText, {color: colors.sub}]}>预览</Text>
                  <Image source={{uri: selectedAvatar}} style={styles.previewImage} />
                </View>
              )}

              <Text style={[styles.sectionTitle, {color: colors.text}]}>默认头像</Text>
              <FlatList
                data={DEFAULT_AVATARS}
                keyExtractor={(item) => item}
                numColumns={4}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={[
                      styles.avatarOption,
                      selectedAvatar === item && styles.selectedAvatarOption,
                      {borderColor: selectedAvatar === item ? colors.text : colors.border}
                    ]}
                    onPress={() => handleAvatarSelect(item)}
                  >
                    <Image source={{uri: item}} style={styles.avatarOptionImage} />
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.avatarGrid}
              />

              <View style={styles.uploadSection}>
                <Text style={[styles.sectionTitle, {color: colors.text}]}>或者上传本地图片</Text>
                <CustomButton
                  title="选择本地图片"
                  onPress={handleLocalImageUpload}
                  style={styles.uploadButton}
                  borderColor={colors.border}
                  textColor={colors.text}
                  textStyle={styles.uploadButtonText}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <CustomButton
                title="取消"
                onPress={() => setAvatarModalVisible(false)}
                style={{...styles.button, ...styles.cancelButton, marginRight: 10}}
                borderColor={colors.border}
                textColor={colors.text}
              />
              <CustomButton
                title="确认"
                onPress={confirmAvatarSelection}
                style={{...styles.button, ...styles.saveButton, backgroundColor: '#2563EB'}}
                borderColor="transparent"
                textColor="#FFFFFF"
                disabled={!selectedAvatar}
              />
            </View>
          </View>
        </View>
      </Modal>

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
        <CustomButton
          title="取消"
          onPress={onClose}
          disabled={isLoading}
          style={{...styles.button, ...styles.cancelButton}}
          borderColor={colors.border}
          textColor={colors.text}
          textStyle={styles.buttonText}
        />

        <CustomButton
          title="保存"
          onPress={handleSubmit}
          loading={isLoading}
          style={{...styles.button, ...styles.saveButton, backgroundColor: isLoading ? colors.hint : '#2563EB'}}
          borderColor="transparent"
          textColor="#FFFFFF"
          textStyle={styles.buttonText}
        />
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
  // Removed changePhotoButton and changePhotoText styles as we're using CustomButton now
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

  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: { elevation: 5 },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  previewText: {
    fontSize: 14,
    marginBottom: 8,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  avatarGrid: {
    paddingVertical: 8,
  },
  avatarOption: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    margin: 8,
    borderWidth: 2,
    overflow: 'hidden',
  },
  selectedAvatarOption: {
    borderWidth: 3,
  },
  avatarOptionImage: {
    width: '100%',
    height: '100%',
  },
  uploadSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  uploadButton: {
    marginTop: 8,
    height: 44,
    paddingHorizontal: 10, // 增加水平内边距
    width: '100%', // 确保按钮宽度足够
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '500',
    paddingHorizontal: 4, // 文本内边距
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

export default EditProfileForm;