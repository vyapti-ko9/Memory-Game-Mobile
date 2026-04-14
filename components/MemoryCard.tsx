import { LinearGradient } from "expo-linear-gradient"
import { useEffect } from "react"
import { Image, Pressable, StyleSheet } from "react-native"
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import { getImageSource } from "@/constants/imageMap"

type Props = {
  symbolKey: string
  flipped: boolean
  onPress: () => void
  width: number
  height: number
  isDark: boolean
}

/** Face-down card — `#gameBoard .card-front` in index.css */
const HIDDEN_LIGHT = ["#2a6bb8", "#153a6e", "#0f2d56"] as const
const HIDDEN_DARK = ["#1e3a5c", "#0f2438"] as const

/** Face-up panel — `#gameBoard .card-back` */
const FACE_PANEL = ["#f8fafc", "#e2e8f0"] as const

export default function MemoryCard({ symbolKey, flipped, onPress, width, height, isDark }: Props) {
  const progress = useSharedValue(flipped ? 1 : 0)

  useEffect(() => {
    progress.value = withTiming(flipped ? 1 : 0, {
      duration: 600,
      easing: Easing.inOut(Easing.ease),
    })
  }, [flipped, progress])

  const shellStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.02]) }],
  }))

  const hiddenStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ rotateY: `${interpolate(progress.value, [0, 1], [0, 90])}deg` }],
  }))

  const faceStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ rotateY: `${interpolate(progress.value, [0, 1], [-90, 0])}deg` }],
  }))

  const hiddenColors = isDark ? HIDDEN_DARK : HIDDEN_LIGHT
  const borderHidden = isDark ? "#d8d8d0" : "#f4f4ee"

  return (
    <Pressable
      onPress={onPress}
      style={[styles.press, { width, height }]}
      accessibilityRole="button"
      accessibilityLabel={flipped ? "Card face" : "Hidden card"}
    >
      <Animated.View style={[styles.clip, { width, height }, shellStyle]}>
        {/* Face-down (pattern) */}
        <Animated.View style={[styles.face, { borderColor: borderHidden }, hiddenStyle]} pointerEvents="none">
          <LinearGradient
            colors={[...hiddenColors]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Face-up (image) */}
        <Animated.View
          style={[
            styles.face,
            {
              borderColor: "rgba(186, 230, 253, 0.85)",
            },
            faceStyle,
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[...FACE_PANEL]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Image source={getImageSource(symbolKey)} style={styles.faceImg} resizeMode="contain" />
        </Animated.View>
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  press: {
    borderRadius: 10,
  },
  clip: {
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  face: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    borderWidth: 2,
    backfaceVisibility: "hidden",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
  },
  faceImg: {
    width: "100%",
    height: "100%",
  },
})
