import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

interface ArtStrokeBgProps {
  color: string;
}

/**
 * Decorative SVG background with a single wavy line
 */
const ArtStrokeBg: React.FC<ArtStrokeBgProps> = ({ color }) => {
  return (
    <Svg
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        { height: 250, top: 60 } // Position lower, with more height
      ]}
      viewBox="0 0 400 250"
    >
      {/* Single wavy line positioned lower and more subtle */}
      <Path
        d="M0 120 Q 100 80 200 120 T 400 120"
        stroke={color}
        strokeOpacity="0.12"
        strokeWidth="1.2"
        fill="none"
      />
    </Svg>
  );
};

export default ArtStrokeBg;