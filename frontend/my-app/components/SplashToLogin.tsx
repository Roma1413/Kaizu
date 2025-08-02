import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import AnimatedLogo from './AnimatedLogo';
import LoginScreen from './LoginScreen';

export default function SplashToLogin() {
  const [showLogin, setShowLogin] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const loginAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Wait for logo animation to complete (about 2 seconds)
    const timer = setTimeout(() => {
      // Fade out splash screen
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        setShowLogin(true);
        // Fade in login screen
        Animated.timing(loginAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (showLogin) {
    return (
      <Animated.View style={[styles.container, { opacity: loginAnim }]}>
        <LoginScreen />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.logoContainer}>
        <AnimatedLogo />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Light, clean background
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 