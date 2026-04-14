import AsyncStorage from "@react-native-async-storage/async-storage"

const KEY = "memoryLeaderboard"

export type Score = {
  moves: number
  time: number
}

export async function saveScore(moves: number, time: number): Promise<void> {
  const raw = await AsyncStorage.getItem(KEY)
  let leaderboard: Score[] = raw ? JSON.parse(raw) : []
  leaderboard.push({ moves, time })
  leaderboard.sort((a, b) => a.time - b.time)
  leaderboard = leaderboard.slice(0, 5)
  await AsyncStorage.setItem(KEY, JSON.stringify(leaderboard))
}

export async function getLeaderboard(): Promise<Score[]> {
  const raw = await AsyncStorage.getItem(KEY)
  return raw ? JSON.parse(raw) : []
}
