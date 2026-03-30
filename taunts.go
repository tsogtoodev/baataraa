package main

import (
	"math/rand/v2"
)

// taunts holds at most 50 lines used for the vs-bot speech bubble.
var taunts = []string{
	"Nice try. Mine next.",
	"I've seen better on a napkin.",
	"Three in a row? Cute goal.",
	"You're feeding me corners.",
	"Diagonal dreams, human.",
	"I don't sweat tic-tac-toe.",
	"Bold move. Wrong era.",
	"Think faster. I compile faster.",
	"That's your plan? Adorable.",
	"Center called. You didn't answer.",
	"Forks are for dinner, not defense.",
	"I live in minimax. You live in hope.",
	"Your O-face needs work.",
	"X marks the… never mind.",
	"I saw that bluff from orbit.",
	"Careful. Pride is diagonal.",
	"Tap tap. Still losing tempo.",
	"Humans invented this. I perfected it.",
	"Cute block. Wrong threat.",
	"You blinked. I moved.",
	"That's not pressure. That's a picnic.",
	"I can do this left-handed. Oh wait—I don't have hands.",
	"Your strategy has lint warnings.",
	"Nice noise. Still empty squares.",
	"I'm not mad. I'm optimal.",
	"Save the drama for chess.",
	"That's a tempo donation. Thanks.",
	"Corner? Brave. Predictable.",
	"Edge life chose you.",
	"You hesitated. I didn't.",
	"Call that a fork? Cute.",
	"I read the board like a receipt.",
	"Still three lines away from wisdom.",
	"Your intuition needs unit tests.",
	"That square had regrets.",
	"Slow hand, fast loss.",
	"Bold. Also: refuted.",
	"I don't trash talk. I tree search.",
	"Nice human moment. Anyway—",
	"That's not a plan. That's a mood.",
	"Your move history is spicy. Your future isn't.",
	"I respect the hustle. Not the outcome.",
	"Tick tock. Tac toe.",
	"You're playing vibes. I'm playing math.",
	"Winning isn't everything—unless you're me.",
	"Your opening book is a pamphlet.",
	"I don't get tired. You do.",
	"That square was a suggestion box.",
	"Keep up. The board won't wait.",
}

func init() {
	if len(taunts) > 50 {
		panic("taunts: list must have at most 50 entries")
	}
}

func randomTaunt() string {
	if len(taunts) == 0 {
		return ""
	}
	return taunts[rand.IntN(len(taunts))]
}
