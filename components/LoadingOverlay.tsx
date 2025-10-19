import React, { useRef, useEffect } from "react";
import { View, Animated, StyleSheet, Easing, StyleProp, ViewStyle } from "react-native";

interface LoadingOverlayProps {
  visible: boolean;
  stroke: string; // 三个圆点的主色
  bg: string;     // 背景半透明层
  size?: number;  // 圆点直径，默认 12
  gap?: number;   // 圆点间距，默认 6
  style?: StyleProp<ViewStyle>;
}

/**
 * Loading Overlay - Three Bouncing Dots with Breathing
 * 跳动的三个圆点 + 轻微缩放与透明度呼吸效果
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  stroke,
  bg,
  size = 12,
  gap = 6,
  style,
}) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  // 抽象一个“呼吸跳动”动画：上移 + 缩放 + 透明度
  const createBounce = (anim: Animated.Value, delay: number) =>
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 320,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
          delay,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 320,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

  useEffect(() => {
    if (!visible) return;
    const loops = [createBounce(dot1, 0), createBounce(dot2, 120), createBounce(dot3, 240)];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [visible]);

  if (!visible) return null;

  // 将 0→1 的进度映射为：Y位移、缩放、透明度
  const makeStyles = (v: Animated.Value) => ({
    transform: [
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
      { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) },
    ],
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
  });

  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        { backgroundColor: bg, alignItems: "center", justifyContent: "center" },
        style,
      ]}
    >
      <View style={styles.row}>
        <Animated.View
          style={[
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginHorizontal: gap,
              backgroundColor: stroke,
            },
            makeStyles(dot1),
            styles.shadow,
          ]}
        />
        <Animated.View
          style={[
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginHorizontal: gap,
              backgroundColor: stroke,
            },
            makeStyles(dot2),
            styles.shadow,
          ]}
        />
        <Animated.View
          style={[
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginHorizontal: gap,
              backgroundColor: stroke,
            },
            makeStyles(dot3),
            styles.shadow,
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center" },
  // 轻微阴影，浅色背景下更立体
  shadow: {
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 3,
  },
});

export default LoadingOverlay;
