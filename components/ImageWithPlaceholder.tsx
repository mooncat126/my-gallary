import React, { useState } from "react";
import { Image, ImageProps, StyleSheet, View, useColorScheme } from "react-native";
import Svg, { Rect, Path, Circle } from "react-native-svg";

interface ImageWithPlaceholderProps extends ImageProps {
  placeholderColor?: string;
  darkMode?: boolean;
}

const ImageWithPlaceholder: React.FC<ImageWithPlaceholderProps> = ({
  source,
  style,
  placeholderColor = "#F3F4F6",
  darkMode,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const systemColorScheme = useColorScheme();

  // Use passed darkMode prop or fall back to system color scheme
  const isDarkMode = darkMode ?? (systemColorScheme === 'dark');

  // Choose colors based on theme
  const bgColor = isDarkMode ? "#1A1D22" : "#F3F4F6";
  const shapeColor = isDarkMode ? "#2D3748" : "#E5E7EB";

  return (
    <View style={[style, { position: "relative" }]}>
      {isLoading && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: placeholderColor || bgColor }]}>
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 400 400"
            style={{ opacity: 0.6 }}
          >
            <Rect width="100%" height="100%" fill={bgColor} />
            <Path d="M160 120 L240 120 L240 160 L280 160 L200 240 L120 160 L160 160 Z" fill={shapeColor} />
            <Circle cx="280" cy="100" r="20" fill={shapeColor} />
            <Path d="M80 260 L320 260 L320 280 L80 280 Z" fill={shapeColor} />
            <Path d="M120 300 L280 300 L280 320 L120 320 Z" fill={shapeColor} />
          </Svg>
        </View>
      )}
      <Image
        source={source}
        style={[StyleSheet.absoluteFill]}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        {...props}
      />
    </View>
  );
};

export default ImageWithPlaceholder;