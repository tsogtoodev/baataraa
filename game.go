package main

const empty = ' '

// Board is a 3×3 tic-tac-toe grid; cells use ' ', 'X', or 'O'.
type Board [3][3]byte

func (b *Board) Reset() {
	for r := range b {
		for c := range b[r] {
			b[r][c] = empty
		}
	}
}

func (b *Board) Full() bool {
	for r := range b {
		for c := range b[r] {
			if b[r][c] == empty {
				return false
			}
		}
	}
	return true
}

func (b *Board) Winner() byte {
	lines := [][3][2]int{
		{{0, 0}, {0, 1}, {0, 2}},
		{{1, 0}, {1, 1}, {1, 2}},
		{{2, 0}, {2, 1}, {2, 2}},
		{{0, 0}, {1, 0}, {2, 0}},
		{{0, 1}, {1, 1}, {2, 1}},
		{{0, 2}, {1, 2}, {2, 2}},
		{{0, 0}, {1, 1}, {2, 2}},
		{{0, 2}, {1, 1}, {2, 0}},
	}
	for _, line := range lines {
		a, b1, c := line[0], line[1], line[2]
		v := b[a[0]][a[1]]
		if v != empty && v == b[b1[0]][b1[1]] && v == b[c[0]][c[1]] {
			return v
		}
	}
	return empty
}

// WinningLine returns the three [row,col] cells that form a winning line, if any.
func (b *Board) WinningLine() (line [3][2]int, ok bool) {
	lines := [][3][2]int{
		{{0, 0}, {0, 1}, {0, 2}},
		{{1, 0}, {1, 1}, {1, 2}},
		{{2, 0}, {2, 1}, {2, 2}},
		{{0, 0}, {1, 0}, {2, 0}},
		{{0, 1}, {1, 1}, {2, 1}},
		{{0, 2}, {1, 2}, {2, 2}},
		{{0, 0}, {1, 1}, {2, 2}},
		{{0, 2}, {1, 1}, {2, 0}},
	}
	for _, ln := range lines {
		a, b1, c := ln[0], ln[1], ln[2]
		v := b[a[0]][a[1]]
		if v != empty && v == b[b1[0]][b1[1]] && v == b[c[0]][c[1]] {
			return ln, true
		}
	}
	return line, false
}

func (b *Board) Play(row, col int, mark byte) bool {
	if row < 0 || row > 2 || col < 0 || col > 2 {
		return false
	}
	if b[row][col] != empty {
		return false
	}
	b[row][col] = mark
	return true
}
