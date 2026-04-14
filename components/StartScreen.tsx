import { LinearGradient } from "expo-linear-gradient"
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { BP_SM } from "@/utils/gameLayout"

import {
  CARD_SET_LABELS,
  CARD_SET_ORDER,
  PREVIEW_SETS,
  type BoardSize,
  type CardSetKey,
} from "@/constants/cardSets"
import { startScreen } from "@/constants/gameTheme"
import { getImageSource } from "@/constants/imageMap"

type Props = {
  onStart: () => void
  boardSize: BoardSize
  onBoardSize: (size: BoardSize) => void
  cardSet: CardSetKey
  onCardSet: (set: CardSetKey) => void
}

export default function StartScreen({
  onStart,
  boardSize,
  onBoardSize,
  cardSet,
  onCardSet,
}: Props) {
  const { width: windowWidth } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const isXs = windowWidth <= 360
  const barSm = windowWidth >= BP_SM
  const barMd = windowWidth >= 768
  const overlayPad = barSm ? 16 : isXs ? 8 : 12
  const modalPadH = barSm ? 32 : isXs ? 10 : 16
  const modalPadV = barSm ? 32 : isXs ? 10 : 16
  const titleSize = barMd ? 48 : barSm ? 36 : isXs ? 26 : 30
  const sectionLabelSize = barSm ? 18 : isXs ? 14 : 16
  const sizeBtnMinW = barSm ? 88 : isXs ? 64 : 70
  const sizeBtnPadH = barSm ? 20 : isXs ? 8 : 10
  const sizeBtnText = barSm ? 16 : isXs ? 12 : 14
  const setGapY = barSm ? 16 : isXs ? 8 : 12
  const modalMaxW = 512
  const modalMaxH = isXs ? 620 : 700
  const modalWidth = Math.min(modalMaxW, windowWidth - overlayPad * 2)
  const modalInnerWidth = Math.max(280, modalWidth - modalPadH * 2)
  const setCols = modalInnerWidth >= 430 ? 6 : 3
  const setGapX = setCols === 6 ? 8 : isXs ? 2 : 8
  const thumbSize =
    setCols === 6 ? (barMd ? 58 : 52) : barMd ? 72 : barSm ? 64 : isXs ? 60 : 60
  const setLabelSize = setCols === 6 ? 12 : barSm ? 14 : isXs ? 11 : 12
  const setButtonWidth = Math.max(40, Math.floor((modalInnerWidth - setGapX * (setCols - 1)) / setCols))

  return (
    <View
      style={[
        styles.overlay,
        {
          paddingTop: insets.top + overlayPad,
          paddingBottom: insets.bottom + overlayPad,
          paddingHorizontal: overlayPad,
        },
      ]}
    >
      <LinearGradient
        colors={[...startScreen.base]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(53, 98, 223, 0.12)", "transparent"]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0.35 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.modal,
            {
              maxWidth: modalMaxW,
              maxHeight: modalMaxH,
              paddingHorizontal: modalPadH,
              paddingVertical: modalPadV,
            },
          ]}
        >
          <Text style={[styles.title, { fontSize: titleSize, marginBottom: barSm ? 28 : isXs ? 12 : 18 }]}>
            Memory Match
          </Text>

          <Text style={[styles.sectionLabel, { fontSize: sectionLabelSize }]}>Board Size</Text>
          <View style={[styles.boardSizeRow, { gap: barSm ? 12 : isXs ? 6 : 8 }]}>
            {(["small", "medium", "large"] as BoardSize[]).map((size) => {
              const selected = boardSize === size
              return (
                <Pressable
                  key={size}
                  onPress={() => onBoardSize(size)}
                  style={[
                    styles.sizeBtn,
                    {
                      minWidth: sizeBtnMinW,
                      paddingHorizontal: sizeBtnPadH,
                    },
                    selected && styles.sizeBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.sizeBtnText,
                      { fontSize: sizeBtnText },
                      selected && styles.sizeBtnTextActive,
                    ]}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <Text
            style={[
              styles.sectionLabel,
              styles.sectionSpaced,
              { fontSize: sectionLabelSize, marginTop: barSm ? 32 : isXs ? 10 : 18 },
            ]}
          >
            Card Set
          </Text>
          <View
            style={[
              styles.setGrid,
              {
                width: modalInnerWidth,
              },
            ]}
          >
            {CARD_SET_ORDER.map((setKey, index) => {
              const active = cardSet === setKey
              const isRowEnd = (index + 1) % setCols === 0
              return (
                <Pressable
                  key={setKey}
                  onPress={() => onCardSet(setKey)}
                  style={[
                    styles.setBtn,
                    {
                      width: setButtonWidth,
                      marginRight: isRowEnd ? 0 : setGapX,
                      marginBottom: setGapY,
                    },
                    active && styles.setBtnActive,
                  ]}
                >
                  <View
                    style={[
                      styles.setThumb,
                      {
                        width: thumbSize,
                        height: thumbSize,
                      },
                      active && styles.setThumbActive,
                    ]}
                  >
                    <Image
                      source={getImageSource(PREVIEW_SETS[setKey])}
                      style={styles.setThumbImg}
                      resizeMode="contain"
                    />
                  </View>
                  <Text
                    style={[
                      styles.setLabel,
                      { fontSize: setLabelSize },
                      active && styles.setLabelActive,
                    ]}
                  >
                    {CARD_SET_LABELS[setKey]}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <Pressable
            onPress={onStart}
            style={[styles.startBtn, { marginTop: isXs ? 8 : 16, paddingVertical: isXs ? 9 : 13 }]}
          >
            <Text style={[styles.startBtnText, { fontSize: isXs ? 16 : 18 }]}>Start Game</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    overflow: "hidden",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 8,
  },
  modal: {
    alignSelf: "center",
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.55)",
    backgroundColor: "rgba(10, 30, 66, 0.95)",
  },
  title: {
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  sectionLabel: {
    fontWeight: "600",
    color: "rgb(224, 242, 254)",
    textAlign: "center",
    marginBottom: 16,
  },
  sectionSpaced: {},
  boardSizeRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  sizeBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
    backgroundColor: "rgba(10, 22, 40, 0.9)",
  },
  sizeBtnActive: {
    backgroundColor: "rgb(56, 189, 248)",
    borderColor: "rgb(56, 189, 248)",
  },
  sizeBtnText: {
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    textTransform: "capitalize",
  },
  sizeBtnTextActive: {
    color: "rgb(15, 23, 42)",
  },
  setGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    alignSelf: "center",
    marginBottom: 20,
  },
  setBtn: {
    alignItems: "center",
    paddingVertical: 5,
    borderRadius: 10,
  },
  setBtnActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  setThumb: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "rgba(226, 232, 240, 0.95)",
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  setThumbActive: {
    borderColor: "rgb(125, 211, 252)",
    backgroundColor: "rgb(224, 242, 254)",
  },
  setThumbImg: {
    width: "100%",
    height: "100%",
  },
  setLabel: {
    marginTop: 6,
    fontWeight: "500",
    color: "rgb(241, 245, 249)",
    textAlign: "center",
  },
  setLabelActive: {
    color: "rgb(207, 250, 254)",
  },
  startBtn: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 240,
    backgroundColor: "#259add",
    paddingVertical: 13,
    marginTop: 20,
    borderRadius: 12,
    shadowColor: "#259add",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  startBtnText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
})
