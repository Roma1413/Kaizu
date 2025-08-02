import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';

export default function AnimatedLogo() {
  const leftLeaf = useRef(new Animated.Value(-80)).current;
  const rightLeaf = useRef(new Animated.Value(80)).current;
  const circle = useRef(new Animated.Value(-30)).current;
  const text = useRef(new Animated.Value(50)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate leaves sliding in from sides to form the V shape
    Animated.parallel([
      Animated.timing(leftLeaf, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
        delay: 300,
      }),
      Animated.timing(rightLeaf, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
        delay: 300,
      }),
    ]).start();

    // Animate circle dropping from above
    Animated.timing(circle, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
      delay: 800,
    }).start();

    // Animate text fading in from below
    Animated.parallel([
      Animated.timing(text, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
        delay: 1200,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        delay: 1200,
      }),
    ]).start();
  }, []);

  return (
      <View style={styles.container}>
        {/* Logo Graphic Container */}
        <View style={styles.logoContainer}>
          {/* Left Leaf */}
          <Animated.View
              style={[
                styles.leaf,
                styles.leftLeaf,
                {
                  transform: [{ translateX: leftLeaf }],
                },
              ]}
          />

          {/* Right Leaf */}
          <Animated.View
              style={[
                styles.leaf,
                styles.rightLeaf,
                {
                  transform: [{ translateX: rightLeaf }],
                },
              ]}
          />

          {/* Circle */}
          <Animated.View
              style={[
                styles.circle,
                {
                  transform: [{ translateY: circle }],
                },
              ]}
          />
        </View>

        {/* KAIZU Text */}
        <Animated.View
            style={[
              styles.textContainer,
              {
                transform: [{ translateY: text }],
                opacity: textOpacity,
              },
            ]}
        >
          <Text style={styles.logoText}>KAIZU</Text>
        </Animated.View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 250,
    height: 300,
    backgroundColor: '#f5f5f0',
  },
  logoContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(77, 208, 225, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaf: {
    position: 'absolute',
    width: 40,
    height: 55,
  },
  leftLeaf: {
    left: 20,
    top: 32,
    backgroundColor: '#4dd0e1',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    transform: [{ rotate: '-25deg' }],
  },
  rightLeaf: {
    right: 20,
    top: 32,
    backgroundColor: '#26c6da',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 3,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    transform: [{ rotate: '25deg' }],
  },
  circle: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: '#0097a7',
    position: 'absolute',
    top: 5,
    zIndex: 10,
  },
  textContainer: {
    marginTop: 40,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#263238',
    letterSpacing: 3,
  },
});