import { LinearGradient } from "expo-linear-gradient"
import { Modal, Pressable, StyleSheet, Text, View } from "react-native"

import { modalCard } from "@/constants/gameTheme"

type Props = {
  visible: boolean
  onResume: () => void
  onRestart: () => void
}

export default function PauseModal({ visible, onResume, onRestart }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onResume}>
      <View style={styles.backdrop}>
        <View style={styles.cardOuter}>
          <LinearGradient
            colors={["rgba(56, 189, 248, 0.2)", "transparent"]}
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
            <Text style={styles.emoji}>⏸</Text>
            <Text style={styles.title}>Game Paused</Text>
            <Text style={styles.sub}>Take a breath. Continue whenever you are ready.</Text>

            <View style={styles.actions}>
              <Pressable onPress={onResume} style={[styles.btn, styles.btnPrimary]}>
                <Text style={styles.btnText}>Resume</Text>
              </Pressable>
              <Pressable onPress={onRestart} style={[styles.btn, styles.btnSecondary]}>
                <Text style={styles.btnText}>Restart</Text>
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
  cardOuter: {
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
    padding: 28,
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
    marginBottom: 22,
    lineHeight: 18,
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
  btnPrimary: {
    backgroundColor: "rgb(16, 185, 129)",
  },
  btnSecondary: {
    backgroundColor: "rgb(14, 165, 233)",
  },
  btnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
})
