import { LinearGradient } from "expo-linear-gradient"
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native"
import ConfettiCannon from "react-native-confetti-cannon"

import { modalCard } from "@/constants/gameTheme"

type Props = {
  visible: boolean
  celebrationKey: number
  moves: number
  time: number
  onRestart: () => void
  onNextLevel: () => void
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

const CONFETTI_COLORS = [
  "#22d3ee",
  "#38bdf8",
  "#0ea5e9",
  "#a5f3fc",
  "#fcd34d",
  "#f472b6",
  "#34d399",
  "#c084fc",
]

export default function WinModal({
  visible,
  celebrationKey,
  moves,
  time,
  onRestart,
  onNextLevel,
}: Props) {
  const { width } = useWindowDimensions()

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRestart}>
      <View style={styles.backdrop}>
        {visible ? (
          <View style={styles.confettiWrap} pointerEvents="none">
            <ConfettiCannon
              key={celebrationKey}
              count={240}
              origin={{ x: width / 2, y: -16 }}
              autoStart
              fadeOut
              explosionSpeed={420}
              fallSpeed={3600}
              colors={CONFETTI_COLORS}
            />
          </View>
        ) : null}

        <View style={styles.cardOuter}>
          <LinearGradient
            colors={[...modalCard.glow]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.55 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={[...modalCard.base]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.cardInner}
          >
            <Text style={styles.emoji}>🎉</Text>
            <Text style={styles.title}>Level Complete</Text>
            <Text style={styles.sub}>Great memory! Ready for the next challenge?</Text>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Moves</Text>
                <Text style={styles.statValue}>{moves}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Time</Text>
                <Text style={styles.statValue}>{formatTime(time)}</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable onPress={onRestart} style={[styles.btn, styles.btnSecondary]}>
                <Text style={styles.btnText}>Restart</Text>
              </Pressable>
              <Pressable onPress={onNextLevel} style={[styles.btn, styles.btnPrimary]}>
                <Text style={styles.btnText}>Next Level</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.72)",
    justifyContent: "center",
    padding: 20,
  },
  confettiWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  cardOuter: {
    zIndex: 2,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.45)",
    overflow: "hidden",
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  cardInner: {
    padding: 24,
    alignItems: "center",
  },
  emoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 13,
    color: "rgba(224, 242, 254, 0.8)",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginBottom: 20,
  },
  stat: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 14,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(224, 242, 254, 0.75)",
  },
  statValue: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  actions: {
    width: "100%",
    gap: 10,
  },
  btn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnSecondary: {
    backgroundColor: "rgb(14, 165, 233)",
  },
  btnPrimary: {
    backgroundColor: "rgb(16, 185, 129)",
  },
  btnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
})
