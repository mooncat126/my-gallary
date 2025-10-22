import React, { useState } from "react";
import { Image, ImageProps, StyleSheet, View, useColorScheme } from "react-native";

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

  // Choose background color based on theme
  const bgColor = isDarkMode ? "#1A1D22" : "#F3F4F6";

  return (
    <View style={[style, { position: "relative" }]}>
      {isLoading && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: placeholderColor || bgColor }]}>
          <Image
            source={require('../assets/placeholder.png')}
            style={{ width: '100%', height: '100%', opacity: 0.6 }}
            resizeMode="contain"
          />
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