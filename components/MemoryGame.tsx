import { Ionicons } from "@expo/vector-icons"
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av"
import * as Haptics from "expo-haptics"
import { Image } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"

import {
  gameShell,
  iconBtnGradient,
  playArea,
  progressFill,
  progressTrack,
  topBar,
} from "@/constants/gameTheme"

import {
  BOARD_CONFIG,
  CARD_SETS,
  type BoardSize,
  type CardSetKey,
} from "@/constants/cardSets"
import type { CardType } from "@/types/card"
import {
  BP_SM,
  getBoardGap,
  getPlayAreaHorizontalPad,
  getPlayingCardSize,
} from "@/utils/gameLayout"
import { shuffle } from "@/utils/shuffle"
import { saveScore } from "@/utils/storage"
import useTimer from "@/utils/useTimer"

import GameBoard from "./GameBoard"
import PauseModal from "./PauseModal"
import StartScreen from "./StartScreen"
import WinModal from "./WinModal"

const ARROW = require("../assets/images/arrow.png")

export default function MemoryGame() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const [boardSize, setBoardSize] = useState<BoardSize>("medium")
  const [cardSet, setCardSet] = useState<CardSetKey>("mixed")
  const [started, setStarted] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [paused, setPaused] = useState(false)
  const [level, setLevel] = useState(1)

  const [cards, setCards] = useState<CardType[]>([])
  const [flipped, setFlipped] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matches, setMatches] = useState(0)
  const [win, setWin] = useState(false)
  const [celebrationKey, setCelebrationKey] = useState(0)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [targetMatches, setTargetMatches] = useState(0)

  const { time, resetTimer } = useTimer(started && !win && !paused && !isPreviewing)

  const cardsRef = useRef<CardType[]>([])
  const movesRef = useRef(moves)
  const timeRef = useRef(time)
  const lastSelectionRef = useRef<string[]>([])
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flipSoundRef = useRef<Audio.Sound | null>(null)
  const matchSoundRef = useRef<Audio.Sound | null>(null)
  const winSoundRef = useRef<Audio.Sound | null>(null)
  const buttonSoundRef = useRef<Audio.Sound | null>(null)
  /** Serializes UI click playback so rapid taps do not race on one native player. */
  const buttonSoundQueueRef = useRef(Promise.resolve())
  const soundsInflightRef = useRef<Promise<void> | null>(null)
  const audioMountedRef = useRef(true)

  cardsRef.current = cards
  movesRef.current = moves
  timeRef.current = time


  const ensureSoundsLoaded = useCallback(async () => {
    const setSession = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        })
      } catch {
        /* session */
      }
    }

    const flipWinReady = async () => {
      const f = flipSoundRef.current
      const w = winSoundRef.current
      if (!f || !w) return false
      const fs = await f.getStatusAsync()
      const ws = await w.getStatusAsync()
      return fs.isLoaded && ws.isLoaded
    }

    const loadAuxIfMissing = async () => {
      await setSession()
      const tryLoad = async (requireMod: number, assign: (s: Audio.Sound) => void) => {
        try {
          const { sound } = await Audio.Sound.createAsync(requireMod, {
            shouldPlay: false,
            volume: 1,
            isMuted: false,
          })
          const st = await sound.getStatusAsync()
          if (st.isLoaded && audioMountedRef.current) {
            assign(sound)
            await sound.setVolumeAsync(1).catch(() => { })
          } else {
            await sound.unloadAsync()
          }
        } catch {
          /* */
        }
      }
      if (!matchSoundRef.current) {
        await tryLoad(require("../assets/audio/match.mp3"), (s) => {
          matchSoundRef.current = s
        })
      }
      if (!buttonSoundRef.current) {
        await tryLoad(require("../assets/audio/button.mp3"), (s) => {
          buttonSoundRef.current = s
        })
      }
    }

    if (await flipWinReady()) {
      if (soundsInflightRef.current) {
        await soundsInflightRef.current
      }
      if (!matchSoundRef.current || !buttonSoundRef.current) {
        await loadAuxIfMissing()
      }
      return
    }

    if (soundsInflightRef.current) {
      await soundsInflightRef.current
      if (await flipWinReady()) {
        if (!matchSoundRef.current || !buttonSoundRef.current) {
          await loadAuxIfMissing()
        }
        return
      }
    }

    const job = (async () => {
      await setSession()

      const loadFirst = async (sources: readonly number[]) => {
        for (const source of sources) {
          try {
            const { sound } = await Audio.Sound.createAsync(source, {
              shouldPlay: false,
              volume: 1,
              isMuted: false,
            })
            const st = await sound.getStatusAsync()
            if (st.isLoaded) {
              return sound
            }
            await sound.unloadAsync()
          } catch {
            /* try next format */
          }
        }
        return null
      }

      await flipSoundRef.current?.unloadAsync().catch(() => { })
      await matchSoundRef.current?.unloadAsync().catch(() => { })
      await winSoundRef.current?.unloadAsync().catch(() => { })
      await buttonSoundRef.current?.unloadAsync().catch(() => { })
      flipSoundRef.current = null
      matchSoundRef.current = null
      winSoundRef.current = null
      buttonSoundRef.current = null

      const flip = await loadFirst([
        require("../assets/audio/flip.ogg"),
      ])
      const matchS = await loadFirst([
        require("../assets/audio/match.mp3"),
      ])
      const winS = await loadFirst([
        require("../assets/audio/win.mp3"),
      ])
      const buttonS = await loadFirst([
        require("../assets/audio/button.mp3"),
      ])

      if (!audioMountedRef.current) {
        await flip?.unloadAsync().catch(() => { })
        await matchS?.unloadAsync().catch(() => { })
        await winS?.unloadAsync().catch(() => { })
        await buttonS?.unloadAsync().catch(() => { })
        return
      }

      flipSoundRef.current = flip
      matchSoundRef.current = matchS
      winSoundRef.current = winS
      buttonSoundRef.current = buttonS
      await flip?.setVolumeAsync(1).catch(() => { })
      await matchS?.setVolumeAsync(1).catch(() => { })
      await winS?.setVolumeAsync(1).catch(() => { })
      await buttonS?.setVolumeAsync(1).catch(() => { })
    })()

    soundsInflightRef.current = job
    try {
      await job
    } finally {
      if (soundsInflightRef.current === job) {
        soundsInflightRef.current = null
      }
    }
  }, [])

  const playLoadedSound = async (sound: Audio.Sound | null) => {
    if (!sound) return
    try {
      await sound.replayAsync()
      return
    } catch {
    }
    try {
      const st = await sound.getStatusAsync()
      if (!st.isLoaded) return
      if (st.isPlaying) {
        await sound.stopAsync()
      }
      await sound.setPositionAsync(0)
      await sound.playAsync()
    } catch {
      try {
        await sound.replayAsync()
      } catch {
        /* */
      }
    }
  }

  useLayoutEffect(() => {
    audioMountedRef.current = true
    void ensureSoundsLoaded()
    return () => {
      audioMountedRef.current = false
      void flipSoundRef.current?.unloadAsync()
      void matchSoundRef.current?.unloadAsync()
      void winSoundRef.current?.unloadAsync()
      void buttonSoundRef.current?.unloadAsync()
      flipSoundRef.current = null
      matchSoundRef.current = null
      winSoundRef.current = null
      buttonSoundRef.current = null
    }
  }, [ensureSoundsLoaded])

  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current !== null) clearTimeout(previewTimeoutRef.current)
    }
  }, [])

  const playFlipSound = useCallback(async () => {
    await ensureSoundsLoaded()
    await playLoadedSound(flipSoundRef.current)
  }, [ensureSoundsLoaded])

  const playMatchSound = useCallback(async () => {
    await ensureSoundsLoaded()
    await playLoadedSound(matchSoundRef.current)
  }, [ensureSoundsLoaded])

  const playWinSound = useCallback(async () => {
    await ensureSoundsLoaded()
    await playLoadedSound(winSoundRef.current)
  }, [ensureSoundsLoaded])

  const primeButtonSession = useCallback(() => {
    void Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(() => { })
  }, [])

  const queueButtonSound = useCallback(
    (after?: () => void) => {
      buttonSoundQueueRef.current = buttonSoundQueueRef.current
        .catch(() => { })
        .then(async () => {
          primeButtonSession()
          await ensureSoundsLoaded()
          const s = buttonSoundRef.current
          if (s) {
            void s.replayAsync().catch(async () => {
              await playLoadedSound(buttonSoundRef.current)
            })
          }
          if (after) {
            queueMicrotask(after)
          }
        })
    },
    [ensureSoundsLoaded, primeButtonSession],
  )

  const playButtonSoundThen = useCallback(
    (after: () => void) => {
      queueButtonSound(after)
    },
    [queueButtonSound],
  )

  function getBoardConfigByScreen() {
    return BOARD_CONFIG[boardSize]
  }

  function getSymbols(): string[] {
    if (cardSet === "custom") return CARD_SETS.mixed
    return CARD_SETS[cardSet]
  }

  function hasSameSelection(a: string[], b: string[]) {
    if (a.length !== b.length) return false
    const sortedA = [...a].sort()
    const sortedB = [...b].sort()
    return sortedA.every((value, index) => value === sortedB[index])
  }

  function clearPreviewTimeout() {
    if (previewTimeoutRef.current !== null) {
      clearTimeout(previewTimeoutRef.current)
      previewTimeoutRef.current = null
    }
  }

  function createBoard() {
    clearPreviewTimeout()
    setIsPreviewing(true)

    const { pairCount } = getBoardConfigByScreen()
    const symbols = getSymbols()
    const totalPairs = Math.min(pairCount, symbols.length)
    let selected = shuffle([...symbols]).slice(0, totalPairs)

    if (symbols.length > totalPairs) {
      let attempts = 0
      while (attempts < 5 && hasSameSelection(selected, lastSelectionRef.current)) {
        selected = shuffle([...symbols]).slice(0, totalPairs)
        attempts += 1
      }
    }

    lastSelectionRef.current = selected
    const rawDeck = selected.flatMap((symbolKey) => [symbolKey, symbolKey])

    const deck: CardType[] = shuffle(rawDeck).map((symbolKey, index) => ({
      id: index,
      symbolKey,
      flipped: true,
      matched: false,
    }))

    setCards(deck)
    setFlipped([])
    setMoves(0)
    setMatches(0)
    setWin(false)
    setPaused(false)
    setTargetMatches(totalPairs)

    previewTimeoutRef.current = setTimeout(() => {
      setCards((prev) => prev.map((c) => ({ ...c, flipped: false })))
      setFlipped([])
      setIsPreviewing(false)
      previewTimeoutRef.current = null
    }, 1000)
  }

  function startGame() {
    void ensureSoundsLoaded()
    resetTimer()
    setStarted(true)
    setLevel(1)
    createBoard()
  }

  function nextLevel() {
    resetTimer()
    setLevel((l) => l + 1)
    createBoard()
  }

  function restartGame() {
    resetTimer()
    createBoard()
  }

  function goToMenu() {
    clearPreviewTimeout()
    setIsPreviewing(false)
    setStarted(false)
    setWin(false)
    setPaused(false)
  }

  function flipCard(i: number) {
    const current = cardsRef.current
    if (paused || isPreviewing || current[i].flipped || flipped.length === 2) return

    void playFlipSound()
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    const newCards = [...current]
    newCards[i] = { ...newCards[i], flipped: true }
    setCards(newCards)

    const newFlip = [...flipped, i]
    setFlipped(newFlip)

    if (newFlip.length === 2) {
      setMoves((m) => m + 1)
      setTimeout(() => checkMatch(newFlip), 600)
    }
  }

  function checkMatch(indexes: number[]) {
    const snapshot = cardsRef.current
    const nextCards = [...snapshot]
    const firstKey = nextCards[indexes[0]].symbolKey
    const matchedSet = indexes.every((index) => nextCards[index].symbolKey === firstKey)

    if (matchedSet) {
      indexes.forEach((index) => {
        nextCards[index] = { ...nextCards[index], matched: true }
      })

      void playMatchSound()

      setMatches((m) => {
        const nextMatches = m + 1
        if (nextMatches === targetMatches) {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          void playWinSound()
          void saveScore(movesRef.current, timeRef.current)
          setCelebrationKey((k) => k + 1)
          setWin(true)
        }
        return nextMatches
      })
    } else {
      indexes.forEach((index) => {
        nextCards[index] = { ...nextCards[index], flipped: false }
      })
    }

    setCards(nextCards)
    setFlipped([])
  }

  const progress = targetMatches > 0 ? (matches / targetMatches) * 100 : 0
  const cols = getBoardConfigByScreen().cols

  const gap = getBoardGap(windowWidth)
  const horizontalPad = getPlayAreaHorizontalPad(windowWidth)
  const boardInnerWidth = windowWidth - horizontalPad * 2
  const { width: cardWidth, height: cardHeight } = getPlayingCardSize(
    boardSize,
    windowWidth,
    cols,
    boardInnerWidth,
    gap,
  )
  const rowWidth = cols * cardWidth + (cols - 1) * gap

  const barSm = windowWidth >= BP_SM
  const barNarrow = windowWidth <= 480
  const headerPadH = barSm ? 20 : 8
  const headerPadV = barSm ? 12 : 8
  const headerGap = barSm ? 8 : 6
  const titleFontSize = barSm ? (windowWidth >= 768 ? 24 : 20) : 16.32
  const iconBtnMin = barNarrow ? 34 : 42
  const iconBtnBorder = barNarrow ? 1 : 2
  const iconBtnRadius = barNarrow ? 7 : 8
  const arrowSize = barSm ? 36 : 32
  const pauseIconSize = barSm ? 28 : 26
  const themeTrackW = barNarrow ? 46 : 52
  const themeTrackH = barNarrow ? 25 : 30
  const themeKnobSize = barNarrow ? 19 : 22
  const playPadV = barSm ? 16 : 10
  const statsFontSize = barSm ? 16 : 12
  const statsCompactGrid = windowWidth <= 480
  const progressBarHeight = barNarrow ? 7 : 8
  const progressMaxW = Math.min(512, boardInnerWidth)

  const timerLabel = `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(time % 60).padStart(2, "0")}`

  const barColors = isDark ? topBar.dark : topBar.light
  const areaColors = isDark ? playArea.dark : playArea.light

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...gameShell.base]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[...gameShell.topGlow]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.55 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {!started && (
        <StartScreen
          onStart={() => {
            playButtonSoundThen(() => startGame())
          }}
          boardSize={boardSize}
          onBoardSize={(size) => {
            playButtonSoundThen(() => setBoardSize(size))
          }}
          cardSet={cardSet}
          onCardSet={(set) => {
            playButtonSoundThen(() => setCardSet(set))
          }}
        />
      )}

      {started && (
        <SafeAreaView style={styles.gameSafe} edges={["top", "left", "right"]}>
          <LinearGradient
            colors={[...barColors]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[
              styles.header,
              {
                paddingHorizontal: headerPadH,
                paddingVertical: headerPadV,
                gap: headerGap,
              },
            ]}
          >
            <View style={styles.headerBorder} />
            <LinearGradient
              colors={[...iconBtnGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[
                styles.iconBtnGrad,
                {
                  minWidth: iconBtnMin,
                  minHeight: iconBtnMin,
                  borderWidth: iconBtnBorder,
                  borderRadius: iconBtnRadius,
                },
              ]}
            >
              <Pressable
                onPress={() => {
                  playButtonSoundThen(() => goToMenu())
                }}
                style={styles.iconBtnInner}
                accessibilityLabel="Back to menu"
              >
                <Image
                  source={ARROW}
                  style={{ width: arrowSize, height: arrowSize }}
                  contentFit="contain"
                />
              </Pressable>
            </LinearGradient>
            <Text style={[styles.headerTitle, { fontSize: titleFontSize }]} numberOfLines={1}>
              Memory Match
            </Text>
            <View style={[styles.headerRight, { gap: headerGap }]}>
              <LinearGradient
                colors={[...iconBtnGradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[
                  styles.iconBtnGrad,
                  {
                    minWidth: iconBtnMin,
                    minHeight: iconBtnMin,
                    borderWidth: iconBtnBorder,
                    borderRadius: iconBtnRadius,
                  },
                ]}
              >
                <Pressable
                  onPress={() => {
                    playButtonSoundThen(() => setPaused((p) => !p))
                  }}
                  style={styles.iconBtnInner}
                  accessibilityLabel="Pause"
                >
                  <Ionicons name="pause" size={pauseIconSize} color="#0c2d5c" />
                </Pressable>
              </LinearGradient>
              <Pressable
                onPress={() => {
                  playButtonSoundThen(() => setIsDark((d) => !d))
                }}
                style={[
                  styles.themeTrack,
                  isDark ? styles.themeTrackDark : styles.themeTrackLight,
                  {
                    width: themeTrackW,
                    height: themeTrackH,
                    padding: barNarrow ? 2 : 3,
                  },
                ]}
                accessibilityLabel="Toggle theme"
              >
                <View style={[styles.themeKnob, { width: themeKnobSize, height: themeKnobSize, borderRadius: themeKnobSize / 2 }]}>
                  {isDark ? (
                    <Ionicons name="moon" size={14} color="#1e293b" />
                  ) : (
                    <Ionicons name="sunny" size={14} color="#ca8a04" />
                  )}
                </View>
              </Pressable>
            </View>
          </LinearGradient>

          <LinearGradient
            colors={[...areaColors]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[
              styles.playColumn,
              { paddingHorizontal: horizontalPad, paddingVertical: playPadV },
            ]}
          >


            <View
              style={[
                styles.footer,
                { paddingHorizontal: 0, paddingBottom: Math.max(14, insets.bottom + 8) },
              ]}
            >
              {statsCompactGrid ? (
                <View style={[styles.statsGrid, { maxWidth: progressMaxW }]}>
                  <Text style={[styles.statsCell, { fontSize: statsFontSize }]}>Moves: {moves}</Text>
                  <Text style={[styles.statsCell, { fontSize: statsFontSize }]}>Time: {timerLabel}</Text>
                  <Text style={[styles.statsCell, { fontSize: statsFontSize }]}>Level: {level}</Text>
                </View>
              ) : (
                <View style={styles.statsRow}>
                  <Text style={[styles.stats, { fontSize: statsFontSize }]}>Moves: {moves}</Text>
                  {barSm ? <Text style={[styles.statsDim, { fontSize: statsFontSize }]}>|</Text> : null}
                  <Text style={[styles.stats, { fontSize: statsFontSize }]}>Time: {timerLabel}</Text>
                  {barSm ? <Text style={[styles.statsDim, { fontSize: statsFontSize }]}>|</Text> : null}
                  <Text style={[styles.stats, { fontSize: statsFontSize }]}>Level: {level}</Text>
                </View>
              )}
              <View
                style={[
                  styles.progressTrack,
                  {
                    borderColor: progressTrack.border,
                    backgroundColor: progressTrack.track,
                    maxWidth: progressMaxW,
                    height: progressBarHeight,
                  },
                ]}
              >
                {progress > 0 ? (
                  <LinearGradient
                    colors={[...progressFill]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: `${progress}%` }]}
                  />
                ) : null}
              </View>
            </View>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[
                styles.scrollInner,
                {
                  minHeight: windowHeight * 0.48,
                  paddingBottom: 12,
                  paddingHorizontal: 0,
                },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <GameBoard
                cards={cards}
                onCardPress={flipCard}
                cols={cols}
                maxRowWidth={rowWidth}
                cardWidth={cardWidth}
                cardHeight={cardHeight}
                gap={gap}
                isDark={isDark}
              />
            </ScrollView>
          </LinearGradient>
        </SafeAreaView>
      )}

      <WinModal
        visible={win}
        celebrationKey={celebrationKey}
        moves={moves}
        time={time}
        onRestart={() => {
          playButtonSoundThen(() => restartGame())
        }}
        onNextLevel={() => {
          playButtonSoundThen(() => nextLevel())
        }}
      />

      <PauseModal
        visible={paused}
        onResume={() => {
          playButtonSoundThen(() => setPaused(false))
        }}
        onRestart={() => {
          playButtonSoundThen(() => restartGame())
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  gameSafe: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  headerBorder: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: "rgba(34, 211, 238, 0.35)",
  },
  iconBtnGrad: {
    borderColor: "#094c7d",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  iconBtnInner: {
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontWeight: "800",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  themeTrack: {
    borderRadius: 999,
    borderWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  themeTrackLight: {
    backgroundColor: "#38bdf8",
    borderColor: "#0369a1",
    justifyContent: "flex-start",
  },
  themeTrackDark: {
    backgroundColor: "#334155",
    borderColor: "#1e293b",
    justifyContent: "flex-end",
  },
  themeKnob: {
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 2,
  },
  playColumn: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollInner: {
    paddingTop: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingTop: 10,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: "row",
    width: "100%",
    alignSelf: "center",
    marginBottom: 10,
  },
  statsCell: {
    flex: 1,
    textAlign: "center",
    fontWeight: "600",
    color: "rgba(224, 242, 254, 0.95)",
  },
  stats: {
    fontWeight: "600",
    color: "rgba(224, 242, 254, 0.95)",
  },
  statsDim: {
    color: "rgba(103, 232, 249, 0.4)",
    fontWeight: "600",
  },
  progressTrack: {
    borderRadius: 999,
    borderWidth: 1,
    overflow: "hidden",
    alignSelf: "center",
    width: "100%",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
})
