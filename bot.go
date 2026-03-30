package main

import "math/rand/v2"

// Difficulty: 1 beginner (random), 2 intermediate (win/block else random), 3 expert (minimax).
func chooseBotMove(b Board, botMark, humanMark byte, difficulty int) (row, col int) {
	switch difficulty {
	case 1:
		return randomMove(b)
	case 2:
		return intermediateMove(b, botMark, humanMark)
	default:
		return bestMove(b, botMark, humanMark)
	}
}

func randomMove(b Board) (row, col int) {
	var cells [][2]int
	for r := 0; r < 3; r++ {
		for c := 0; c < 3; c++ {
			if b[r][c] == empty {
				cells = append(cells, [2]int{r, c})
			}
		}
	}
	if len(cells) == 0 {
		return 0, 0
	}
	i := rand.IntN(len(cells))
	return cells[i][0], cells[i][1]
}

// canWinNext returns a move that would complete three in a row for mark, if any.
func canWinNext(b Board, mark byte) (row, col int, ok bool) {
	for r := 0; r < 3; r++ {
		for c := 0; c < 3; c++ {
			if b[r][c] != empty {
				continue
			}
			b[r][c] = mark
			w := b.Winner()
			b[r][c] = empty
			if w == mark {
				return r, c, true
			}
		}
	}
	return 0, 0, false
}

func intermediateMove(b Board, botMark, humanMark byte) (row, col int) {
	if r, c, ok := canWinNext(b, botMark); ok {
		return r, c
	}
	if r, c, ok := canWinNext(b, humanMark); ok {
		return r, c
	}
	return randomMove(b)
}

// bestMove returns the optimal move for botMark using minimax (perfect play on 3×3).
func bestMove(b Board, botMark, humanMark byte) (row, col int) {
	bestScore := -2
	found := false
	for r := 0; r < 3; r++ {
		for c := 0; c < 3; c++ {
			if b[r][c] != empty {
				continue
			}
			b[r][c] = botMark
			score := minimax(b, false, botMark, humanMark)
			b[r][c] = empty
			if score > bestScore {
				bestScore = score
				row, col = r, c
				found = true
			}
		}
	}
	if !found {
		return 0, 0
	}
	return row, col
}

func minimax(b Board, isMaximizing bool, botMark, humanMark byte) int {
	w := b.Winner()
	if w == botMark {
		return 1
	}
	if w == humanMark {
		return -1
	}
	if b.Full() {
		return 0
	}

	if isMaximizing {
		best := -2
		for r := 0; r < 3; r++ {
			for c := 0; c < 3; c++ {
				if b[r][c] != empty {
					continue
				}
				b[r][c] = botMark
				s := minimax(b, false, botMark, humanMark)
				b[r][c] = empty
				if s > best {
					best = s
				}
			}
		}
		return best
	}

	best := 2
	for r := 0; r < 3; r++ {
		for c := 0; c < 3; c++ {
			if b[r][c] != empty {
				continue
			}
			b[r][c] = humanMark
			s := minimax(b, true, botMark, humanMark)
			b[r][c] = empty
			if s < best {
				best = s
			}
		}
	}
	return best
}
