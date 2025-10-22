import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

interface ArtStrokeBgProps {
  color: string;
}

/**
 * Decorative SVG background with a single line at the top
 */
const ArtStrokeBg: React.FC<ArtStrokeBgProps> = ({ color }) => {
  return (
    <Svg
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        { height: 100, top: 0 } // Position at the top, with limited height
      ]}
      viewBox="0 0 400 100"
    >
      {/* Single wavy line at the top */}
      <Path
        d="M0 60 Q 100 20 200 60 T 400 60"
        stroke={color}
        strokeOpacity="0.2"
        strokeWidth="1.5"
        fill="none"
      />
    </Svg>
  );
};

export default ArtStrokeBg;