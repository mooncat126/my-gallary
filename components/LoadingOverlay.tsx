import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Easing } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

interface LoadingOverlayProps {
  visible: boolean;
  stroke: string;
  bg: string;
}

/**
 * Loading Overlay (Line Style Spinner)
 * Animated loading spinner with circular progress indicator
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  stroke,
  bg,
}) => {
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.timing(rot, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [visible]);

  if (!visible) return null;

  const spin = rot.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        { backgroundColor: bg, alignItems: "center", justifyContent: "center" },
      ]}
    >
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Svg width={56} height={56} viewBox="0 0 64 64">
          <Circle
            cx="32"
            cy="32"
            r="22"
            stroke={stroke}
            strokeWidth="1"
            fill="none"
          />
          <Path
            d="M32 10 A22 22 0 0 1 52 30"
            stroke={stroke}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
      <Text
        style={{ marginTop: 10, color: stroke, opacity: 0.9, fontSize: 14 }}
      >
        Searching…
      </Text>
    </View>
  );
};

export default LoadingOverlay;