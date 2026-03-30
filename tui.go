package main

import (
	"fmt"
	"strings"
	"time"

	"github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type screen int

const (
	screenMenu screen = iota
	screenBotSide
	screenDifficulty
	screenPlay
)

type gameMode int

const (
	modeHumanHuman gameMode = iota
	modeVsBot
)

type botMoveMsg struct{}

type celebrationTickMsg struct{}

type delightKind int

const (
	delightNone delightKind = iota
	delightWin
	delightLoss
	delightDraw
)

var (
	titleStyle = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("213"))
	subStyle   = lipgloss.NewStyle().Foreground(lipgloss.Color("244"))
	xStyle     = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("86"))
	oStyle     = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("220"))
	bannerWin  = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("213"))
	bannerDraw = lipgloss.NewStyle().Foreground(lipgloss.Color("244"))
	helpStyle  = lipgloss.NewStyle().Foreground(lipgloss.Color("240"))
	menuItem   = lipgloss.NewStyle().PaddingLeft(2)
	menuSel    = lipgloss.NewStyle().PaddingLeft(0).Foreground(lipgloss.Color("213")).Bold(true)
	bubbleStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(lipgloss.Color("205")).
			Padding(0, 1).
			Foreground(lipgloss.Color("252"))
	bubbleLabel = lipgloss.NewStyle().Foreground(lipgloss.Color("244")).Italic(true)
	winBorder = lipgloss.NewStyle().
			Width(9).Height(3).Align(lipgloss.Center, lipgloss.Center).
			Border(lipgloss.RoundedBorder()).
			BorderForeground(lipgloss.Color("42"))
	delightWinHead  = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("220"))
	delightWinSub   = lipgloss.NewStyle().Foreground(lipgloss.Color("214"))
	delightLossHead = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("174"))
	delightLossSub  = lipgloss.NewStyle().Foreground(lipgloss.Color("246")).Italic(true)
	delightDrawHead = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("117"))
	delightDrawSub  = lipgloss.NewStyle().Foreground(lipgloss.Color("244"))
)

type model struct {
	width, height   int
	screen          screen
	menuCursor      int
	board           Board
	cursorR, cursorC int
	turn            byte
	mode            gameMode
	humanIsX        bool
	gameOver        bool
	isDraw          bool
	winner          byte
	taunt             string
	difficulty        int // 1 beginner, 2 intermediate, 3 expert (vs Bot only)
	delightKind       delightKind
	celebrationFrame  int
}

func initialModel() model {
	return model{
		screen:     screenMenu,
		menuCursor: 0,
		cursorR:    1,
		cursorC:    1,
	}
}

func (m model) Init() tea.Cmd { return nil }

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		return m, nil

	case botMoveMsg:
		return m.handleBotMove()

	case celebrationTickMsg:
		if !m.gameOver {
			return m, nil
		}
		if m.celebrationFrame >= 10 {
			return m, nil
		}
		m.celebrationFrame++
		if m.celebrationFrame < 10 {
			return m, startCelebrationCmd()
		}
		return m, nil

	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			return m, tea.Quit
		}
		switch m.screen {
		case screenMenu, screenBotSide, screenDifficulty:
			return m.updateMenuFlow(msg)
		case screenPlay:
			return m.updatePlay(msg)
		}
	}
	return m, nil
}

func (m model) updateMenuFlow(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch m.screen {
	case screenMenu:
		return m.updateMainMenu(msg)
	case screenBotSide:
		return m.updateBotSideMenu(msg)
	case screenDifficulty:
		return m.updateDifficultyMenu(msg)
	}
	return m, nil
}

func (m model) updateMainMenu(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "up", "k":
		if m.menuCursor > 0 {
			m.menuCursor--
		}
	case "down", "j":
		if m.menuCursor < 2 {
			m.menuCursor++
		}
	case "enter", " ":
		switch m.menuCursor {
		case 0:
			m = m.startHumanHuman()
		case 1:
			m.screen = screenBotSide
			m.menuCursor = 0
		case 2:
			return m, tea.Quit
		}
	}
	return m, nil
}

func (m model) updateBotSideMenu(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "up", "k":
		if m.menuCursor > 0 {
			m.menuCursor--
		}
	case "down", "j":
		if m.menuCursor < 2 {
			m.menuCursor++
		}
	case "enter", " ":
		switch m.menuCursor {
		case 0:
			m.humanIsX = true
			m.screen = screenDifficulty
			m.menuCursor = 0
		case 1:
			m.humanIsX = false
			m.screen = screenDifficulty
			m.menuCursor = 0
		case 2:
			m.screen = screenMenu
			m.menuCursor = 1
		}
	}
	return m, nil
}

func (m model) updateDifficultyMenu(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "up", "k":
		if m.menuCursor > 0 {
			m.menuCursor--
		}
	case "down", "j":
		if m.menuCursor < 3 {
			m.menuCursor++
		}
	case "enter", " ":
		switch m.menuCursor {
		case 0:
			m.difficulty = 1
			return m.beginVsBot()
		case 1:
			m.difficulty = 2
			return m.beginVsBot()
		case 2:
			m.difficulty = 3
			return m.beginVsBot()
		case 3:
			m.screen = screenBotSide
			m.menuCursor = 0
		}
	}
	return m, nil
}

func (m model) startHumanHuman() model {
	m.screen = screenPlay
	m.mode = modeHumanHuman
	m.board.Reset()
	m.cursorR, m.cursorC = 1, 1
	m.turn = 'X'
	m.gameOver = false
	m.isDraw = false
	m.winner = empty
	m.taunt = ""
	m.delightKind = delightNone
	m.celebrationFrame = 0
	return m
}

func (m model) beginVsBot() (model, tea.Cmd) {
	m.screen = screenPlay
	m.mode = modeVsBot
	m.board.Reset()
	m.cursorR, m.cursorC = 1, 1
	m.turn = 'X'
	m.gameOver = false
	m.isDraw = false
	m.winner = empty
	m.taunt = randomTaunt()
	m.delightKind = delightNone
	m.celebrationFrame = 0
	if !m.humanIsX {
		return m, m.botMoveCmd()
	}
	return m, nil
}

func (m model) humanMark() byte {
	if m.humanIsX {
		return 'X'
	}
	return 'O'
}

func (m model) botMark() byte {
	if m.humanIsX {
		return 'O'
	}
	return 'X'
}

func (m model) botMoveCmd() tea.Cmd {
	return tea.Tick(160*time.Millisecond, func(time.Time) tea.Msg {
		return botMoveMsg{}
	})
}

func startCelebrationCmd() tea.Cmd {
	return tea.Tick(130*time.Millisecond, func(time.Time) tea.Msg {
		return celebrationTickMsg{}
	})
}

func (m model) updatePlay(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "m":
		m.screen = screenMenu
		m.menuCursor = 0
		m.difficulty = 0
		m.delightKind = delightNone
		m.celebrationFrame = 0
		return m, nil
	case "r":
		return m.restartSame()
	case "up", "k":
		m = m.moveCursor(-1, 0)
	case "down", "j":
		m = m.moveCursor(1, 0)
	case "left", "h":
		m = m.moveCursor(0, -1)
	case "right", "l":
		m = m.moveCursor(0, 1)
	case "enter", " ":
		return m.tryHumanMove()
	}
	return m, nil
}

func (m model) restartSame() (model, tea.Cmd) {
	m.board.Reset()
	m.cursorR, m.cursorC = 1, 1
	m.turn = 'X'
	m.gameOver = false
	m.isDraw = false
	m.winner = empty
	m.delightKind = delightNone
	m.celebrationFrame = 0
	if m.mode == modeVsBot {
		m.taunt = randomTaunt()
	}
	if m.mode == modeVsBot && !m.humanIsX {
		return m, m.botMoveCmd()
	}
	return m, nil
}

func (m model) moveCursor(dr, dc int) model {
	if m.gameOver {
		return m
	}
	if m.mode == modeVsBot && m.turn != m.humanMark() {
		return m
	}
	m.cursorR = (m.cursorR + dr + 3) % 3
	m.cursorC = (m.cursorC + dc + 3) % 3
	return m
}

func (m model) tryHumanMove() (model, tea.Cmd) {
	if m.gameOver {
		return m, nil
	}
	if m.mode == modeVsBot && m.turn != m.humanMark() {
		return m, nil
	}
	if !m.board.Play(m.cursorR, m.cursorC, m.turn) {
		return m, nil
	}
	return m.afterMove()
}

func (m model) handleBotMove() (model, tea.Cmd) {
	if m.gameOver {
		return m, nil
	}
	if m.mode != modeVsBot || m.turn != m.botMark() {
		return m, nil
	}
	r, c := chooseBotMove(m.board, m.botMark(), m.humanMark(), m.difficulty)
	if !m.board.Play(r, c, m.botMark()) {
		return m, nil
	}
	return m.afterMove()
}

func (m model) afterMove() (model, tea.Cmd) {
	w := m.board.Winner()
	if w != empty {
		m.gameOver = true
		m.winner = w
		m.setDelightKind()
		m.setTauntAfterGame()
		m.celebrationFrame = 0
		return m, startCelebrationCmd()
	}
	if m.board.Full() {
		m.gameOver = true
		m.isDraw = true
		m.delightKind = delightDraw
		m.setTauntAfterGame()
		m.celebrationFrame = 0
		return m, startCelebrationCmd()
	}
	if m.turn == 'X' {
		m.turn = 'O'
	} else {
		m.turn = 'X'
	}
	if m.mode == modeVsBot {
		m.taunt = randomTaunt()
	}
	if m.mode == modeVsBot && m.turn == m.botMark() {
		return m, m.botMoveCmd()
	}
	return m, nil
}

func (m *model) setDelightKind() {
	if m.mode == modeVsBot {
		if m.winner == m.humanMark() {
			m.delightKind = delightWin
		} else {
			m.delightKind = delightLoss
		}
		return
	}
	m.delightKind = delightWin
}

func (m *model) setTauntAfterGame() {
	if m.mode != modeVsBot {
		return
	}
	switch {
	case m.isDraw:
		m.taunt = "Stalemate. I'll allow it."
	case m.winner == m.humanMark():
		m.taunt = "Okay… you earned that one."
	default:
		m.taunt = "Called it. Optimal doesn't blink."
	}
}

func (m model) View() string {
	if m.width == 0 {
		m.width = 80
	}
	var b strings.Builder
	b.WriteString("\n")
	b.WriteString(titleStyle.Render("  Tic Tac Toe"))
	b.WriteString("\n\n")

	switch m.screen {
	case screenMenu:
		b.WriteString(subStyle.Render("Choose a mode:"))
		b.WriteString("\n\n")
		items := []string{
			"Two players (local)",
			"vs Bot",
			"Quit",
		}
		for i, label := range items {
			line := menuItem.Render("  " + label)
			if i == m.menuCursor {
				line = menuSel.Render("▸ " + label)
			}
			b.WriteString(line)
			b.WriteString("\n")
		}
		b.WriteString("\n")
		b.WriteString(helpStyle.Render("↑/↓  move   enter  select   q  quit"))
	case screenBotSide:
		b.WriteString(subStyle.Render("Who plays first as X?"))
		b.WriteString("\n\n")
		items := []string{
			"You play as X",
			"You play as O",
			"Back",
		}
		for i, label := range items {
			line := menuItem.Render("  " + label)
			if i == m.menuCursor {
				line = menuSel.Render("▸ " + label)
			}
			b.WriteString(line)
			b.WriteString("\n")
		}
		b.WriteString("\n")
		b.WriteString(helpStyle.Render("↑/↓  move   enter  select   q  quit"))
	case screenDifficulty:
		b.WriteString(subStyle.Render("Bot difficulty:"))
		b.WriteString("\n\n")
		items := []string{
			"1 · Beginner",
			"2 · Intermediate",
			"3 · Expert",
			"Back",
		}
		for i, label := range items {
			line := menuItem.Render("  " + label)
			if i == m.menuCursor {
				line = menuSel.Render("▸ " + label)
			}
			b.WriteString(line)
			b.WriteString("\n")
		}
		b.WriteString("\n")
		b.WriteString(helpStyle.Render("↑/↓  move   enter  select   q  quit"))
	default:
		if m.mode == modeVsBot && m.taunt != "" {
			b.WriteString(renderTauntBubble(m))
			b.WriteString("\n")
		}
		b.WriteString(m.playHeader())
		b.WriteString("\n")
		b.WriteString(renderBoard(m))
		b.WriteString("\n")
		b.WriteString(m.statusLine())
		b.WriteString("\n")
		b.WriteString(helpStyle.Render(m.playHelp()))
	}

	return lipgloss.Place(m.width, m.height, lipgloss.Center, lipgloss.Center, b.String())
}

func (m model) playHeader() string {
	switch m.mode {
	case modeHumanHuman:
		return subStyle.Render("Two players — shared keyboard")
	case modeVsBot:
		side := "You are X · Bot is O"
		if !m.humanIsX {
			side = "You are O · Bot is X"
		}
		return subStyle.Render(side + " · " + difficultyLabel(m.difficulty))
	}
	return ""
}

func difficultyLabel(d int) string {
	switch d {
	case 1:
		return "Beginner"
	case 2:
		return "Intermediate"
	case 3:
		return "Expert"
	default:
		return "Expert"
	}
}

func renderGameOverDelight(m model) string {
	switch m.delightKind {
	case delightWin:
		return renderWinDelight(m)
	case delightLoss:
		return renderLossDelight(m)
	case delightDraw:
		return renderDrawDelight(m)
	default:
		if m.isDraw {
			return bannerDraw.Render("Draw — board is full.")
		}
		if m.mode == modeVsBot {
			if m.winner == m.humanMark() {
				return bannerWin.Render("You win!")
			}
			return bannerWin.Render("Bot wins.")
		}
		return bannerWin.Render(fmt.Sprintf("Player %c wins!", m.winner))
	}
}

func renderWinDelight(m model) string {
	f := m.celebrationFrame
	sp := []rune{'✦', '✧', '★', '☆'}
	n := len(sp)
	left := fmt.Sprintf("%c %c %c", sp[f%n], sp[(f+1)%n], sp[(f+2)%n])
	right := fmt.Sprintf("%c %c %c", sp[(f+3)%n], sp[(f+2)%n], sp[(f+1)%n])
	var headline string
	if m.mode == modeVsBot {
		headline = "You win!"
	} else {
		headline = fmt.Sprintf("Player %c wins!", m.winner)
	}
	line1 := delightWinHead.Render(fmt.Sprintf("%s   %s   %s", left, headline, right))
	sub := "Three in a row — clean finish."
	if m.mode != modeVsBot {
		sub = "That line is yours."
	}
	line2 := delightWinSub.Render(sub)
	return lipgloss.JoinVertical(lipgloss.Left, line1, line2)
}

func renderLossDelight(m model) string {
	head := delightLossHead.Render("Round to the bot")
	sub := delightLossSub.Render("Press r when you want another shot at the grid.")
	return lipgloss.JoinVertical(lipgloss.Left, head, sub)
}

func renderDrawDelight(m model) string {
	head := delightDrawHead.Render("Draw — the board refused a king")
	sub := delightDrawSub.Render("Every line stayed contested. Rematch?")
	return lipgloss.JoinVertical(lipgloss.Left, head, sub)
}

func (m model) statusLine() string {
	if m.gameOver {
		return renderGameOverDelight(m)
	}
	switch m.mode {
	case modeHumanHuman:
		return subStyle.Render(fmt.Sprintf("Player %c's turn", m.turn))
	case modeVsBot:
		if m.turn == m.humanMark() {
			return subStyle.Render("Your turn")
		}
		return subStyle.Render("Bot is playing…")
	}
	return ""
}

func (m model) playHelp() string {
	return "arrows / hjkl  move   enter  place   r  rematch   m  menu   q  quit"
}

func (m model) isWinningCell(r, c int) bool {
	if !m.gameOver || m.isDraw {
		return false
	}
	line, ok := m.board.WinningLine()
	if !ok {
		return false
	}
	for i := 0; i < 3; i++ {
		if line[i][0] == r && line[i][1] == c {
			return true
		}
	}
	return false
}

func renderTauntBubble(m model) string {
	w := m.width
	if w < 24 {
		w = 80
	}
	maxW := w - 8
	if maxW < 24 {
		maxW = 24
	}
	if maxW > 64 {
		maxW = 64
	}
	line := bubbleStyle.Width(maxW).Render(m.taunt)
	label := bubbleLabel.Render("— Bot")
	return lipgloss.JoinVertical(lipgloss.Left, line, "  "+label)
}

func renderBoard(m model) string {
	base := lipgloss.NewStyle().Width(9).Height(3).Align(lipgloss.Center, lipgloss.Center)
	cursorBorder := lipgloss.NewStyle().
		Width(9).Height(3).Align(lipgloss.Center, lipgloss.Center).
		Border(lipgloss.RoundedBorder()).
		BorderForeground(lipgloss.Color("213"))
	normalBorder := lipgloss.NewStyle().
		Width(9).Height(3).Align(lipgloss.Center, lipgloss.Center).
		Border(lipgloss.RoundedBorder()).
		BorderForeground(lipgloss.Color("238"))

	var rows []string
	for r := 0; r < 3; r++ {
		var cells []string
		for c := 0; c < 3; c++ {
			ch := m.board[r][c]
			isCursor := r == m.cursorR && c == m.cursorC
			active := !m.gameOver && (m.mode == modeHumanHuman || m.turn == m.humanMark())
			winCell := m.isWinningCell(r, c)

			var mark string
			switch ch {
			case 'X':
				if winCell {
					mark = xStyle.Copy().Strikethrough(true).Render("X")
				} else {
					mark = xStyle.Render("X")
				}
			case 'O':
				if winCell {
					mark = oStyle.Copy().Strikethrough(true).Render("O")
				} else {
					mark = oStyle.Render("O")
				}
			default:
				mark = subStyle.Render("·")
			}
			inner := base.Render(mark)
			var cell string
			switch {
			case winCell:
				cell = winBorder.Render(inner)
			case isCursor && active:
				cell = cursorBorder.Render(inner)
			default:
				cell = normalBorder.Render(inner)
			}
			cells = append(cells, cell)
		}
		rowStr := lipgloss.JoinHorizontal(lipgloss.Top, cells...)
		if wr, ok := winningHorizontalRow(m); ok && wr == r {
			bar := lipgloss.NewStyle().Foreground(lipgloss.Color("42")).Render(strings.Repeat("━", lipgloss.Width(rowStr)))
			rowStr = lipgloss.JoinVertical(lipgloss.Left, rowStr, bar)
		}
		rows = append(rows, rowStr)
	}
	return lipgloss.JoinVertical(lipgloss.Left, rows...)
}

// winningHorizontalRow returns the row index if the win is a full horizontal line.
func winningHorizontalRow(m model) (int, bool) {
	if !m.gameOver || m.isDraw {
		return 0, false
	}
	line, ok := m.board.WinningLine()
	if !ok {
		return 0, false
	}
	if line[0][0] == line[1][0] && line[1][0] == line[2][0] {
		return line[0][0], true
	}
	return 0, false
}
