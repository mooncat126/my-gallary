import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

interface ArtStrokeBgProps {
  color: string;
}

/**
 * Top Fade Line Background (Optional)
 * Decorative SVG background with curved strokes
 */
const ArtStrokeBg: React.FC<ArtStrokeBgProps> = ({ color }) => {
  return (
    <Svg
      pointerEvents="none"
      style={StyleSheet.absoluteFillObject}
      viewBox="0 0 400 800"
    >
      <Path
        d="M12 72 Q 120 8 198 64 T 384 92"
        stroke={color}
        strokeOpacity="0.12"
        strokeWidth="1"
        fill="none"
      />
      <Path
        d="M-8 250 Q 90 206 168 260 T 420 320"
        stroke={color}
        strokeOpacity="0.1"
        strokeWidth="1"
        fill="none"
      />
    </Svg>
  );
};

export default ArtStrokeBg;