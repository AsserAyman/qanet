import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, StyleSheet } from 'react-native';

interface AnimatedGradientBackgroundProps {
  colors: readonly [string, string, ...string[]];
}

export function AnimatedGradientBackground({
  colors,
}: AnimatedGradientBackgroundProps) {
  const prevColors = React.useRef(colors);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (prevColors.current === colors) return;
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start(() => {
      prevColors.current = colors;
    });
  }, [colors, fadeAnim]);

  return (
    <>
      <LinearGradient colors={prevColors.current} style={styles.background} />
      <Animated.View style={[styles.background, { opacity: fadeAnim }]}>
        <LinearGradient colors={colors} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
});
