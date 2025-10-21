import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { loginWithEmail, createUserAccount } from "../firebase";
import ArtStrokeBg from "./ArtStrokeBg";
import CustomButton from "./CustomButton";

interface LoginScreenProps {
  theme: "light" | "dark";
  colors: any;
  onLoginSuccess: (user: any) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  theme,
  colors,
  onLoginSuccess,
}) => {
  // State variables
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle login
  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage("Email and password are required");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const { user, error } = await loginWithEmail(email, password);

      if (error) {
        setErrorMessage(error);
        return;
      }

      if (user) {
        onLoginSuccess(user);
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle sign up
  const handleSignUp = async () => {
    if (!email || !password) {
      setErrorMessage("Email and password are required");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const { user, error } = await createUserAccount(email, password);

      if (error) {
        setErrorMessage(error);
        return;
      }

      if (user) {
        onLoginSuccess(user);
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle between login and signup
  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setErrorMessage(null);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.bg }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <ArtStrokeBg color={colors.border} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <View style={styles.contentContainer}>
          {/* App Logo and Title */}
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/app-icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.appTitle, { color: colors.text }]}>
              小画廊
            </Text>
            <Text style={[styles.subtitle, { color: colors.sub }]}>
              Your personal art collection
            </Text>
          </View>

          {/* Login Form */}
          <View style={[styles.formContainer, { borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>
              {isSignUp ? "Create Account" : "Login"}
            </Text>

            {/* Email Input */}
            <View
              style={[styles.inputContainer, { borderColor: colors.border }]}
            >
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Email"
                placeholderTextColor={colors.hint}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Input */}
            <View
              style={[styles.inputContainer, { borderColor: colors.border }]}
            >
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Password"
                placeholderTextColor={colors.hint}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Error Message */}
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            {/* Login Button */}
            <CustomButton
              title={isSignUp ? "Sign Up" : "Login"}
              onPress={isSignUp ? handleSignUp : handleLogin}
              loading={loading}
              borderColor={colors.border}
              textColor={colors.text}
              style={styles.button}
              textStyle={styles.buttonText}
            />

            {/* Toggle Sign Up / Login */}
            <CustomButton
              title={isSignUp
                ? "Already have an account? Login"
                : "Don't have an account? Sign Up"}
              onPress={toggleAuthMode}
              style={styles.toggleButton}
              textStyle={styles.toggleText}
              textColor={colors.sub}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidView: {
    flex: 1,
    justifyContent: "center",
  },
  contentContainer: {
    padding: 20,
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
    borderRadius: 16,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 20,
  },
  inputContainer: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 10,
    paddingHorizontal: 12,
  },
  input: {
    height: 50,
    fontSize: 16,
  },
  errorText: {
    color: "#ef4444",
    marginTop: 10,
    textAlign: "center",
  },
  button: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  toggleButton: {
    marginTop: 20,
    padding: 10,
  },
  toggleText: {
    fontSize: 14,
  },
});

export default LoginScreen;
