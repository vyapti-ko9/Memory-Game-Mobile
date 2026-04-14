import { StyleSheet, View } from "react-native"

import type { CardType } from "@/types/card"

import MemoryCard from "./MemoryCard"

type Props = {
  cards: CardType[]
  onCardPress: (index: number) => void  
  cols: number
  maxRowWidth: number
  cardWidth: number
  cardHeight: number
  gap: number
  isDark: boolean
}

export default function GameBoard({
  cards,
  onCardPress,
  cols,
  maxRowWidth,
  cardWidth,
  cardHeight,
  gap,
  isDark,
}: Props) {
  const rows: CardType[][] = []
  for (let i = 0; i < cards.length; i += 1) {
    const rowIndex = Math.floor(i / Math.max(1, cols))
    if (!rows[rowIndex]) rows[rowIndex] = []
    rows[rowIndex].push(cards[i])
  }

  return (
    <View style={[styles.root, { width: maxRowWidth }]}>
      {rows.map((row, rowIdx) => (
        <View key={`row-${rowIdx}`} style={[styles.row, { marginBottom: rowIdx === rows.length - 1 ? 0 : gap }]}>
          {row.map((card, colIdx) => {
            const absoluteIndex = rowIdx * Math.max(1, cols) + colIdx
            return card.matched ? (
              <View
                key={card.id}
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  marginRight: colIdx === row.length - 1 ? 0 : gap,
                  opacity: 0,
                }}
                pointerEvents="none"
              />
            ) : (
              <View key={card.id} style={{ marginRight: colIdx === row.length - 1 ? 0 : gap }}>
                <MemoryCard
                  symbolKey={card.symbolKey}
                  flipped={card.flipped}
                  onPress={() => onCardPress(absoluteIndex)}
                  width={cardWidth}
                  height={cardHeight}
                  isDark={isDark}
                />
              </View>
            )
          })}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    alignSelf: "center",
  },
  row: {
    flexDirection: "row",
  },
})
