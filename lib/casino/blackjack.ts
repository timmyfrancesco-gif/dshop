import { fairShuffle } from "./fair";

/**
 * Server-side blackjack engine. All game state lives on the server; the client
 * only sends actions. Rules: 6 decks, dealer stands on all 17, blackjack pays
 * 3:2, double on any two cards, one split, no re-split, no insurance.
 */

export type Suit = "S" | "H" | "D" | "C";
export interface Card {
  rank: string; // "A","2".."10","J","Q","K"
  suit: Suit;
}
export interface Hand {
  cards: Card[];
  betCents: number;
  doubled: boolean;
  done: boolean;
  outcome?: "win" | "lose" | "push" | "blackjack";
}
export interface BlackjackState {
  deck: Card[];
  dealer: Card[];
  hands: Hand[];
  active: number; // index of the hand currently being played
  betCents: number;
  finished: boolean;
  dealerRevealed: boolean;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  payoutCents: number; // total returned to player on settle
}

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS: Suit[] = ["S", "H", "D", "C"];
const NUM_DECKS = 6;

export function freshDeck(): Card[] {
  const deck: Card[] = [];
  for (let d = 0; d < NUM_DECKS; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) deck.push({ rank, suit });
    }
  }
  return deck;
}

export function cardValue(rank: string): number {
  if (rank === "A") return 11;
  if (["K", "Q", "J", "10"].includes(rank)) return 10;
  return parseInt(rank, 10);
}

/** Best hand total, counting aces as 1 when 11 would bust. */
export function handValue(cards: Card[]): number {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    total += cardValue(c.rank);
    if (c.rank === "A") aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handValue(cards) === 21;
}

export function startGame(
  betCents: number,
  serverSeed: string,
  serverSeedHash: string,
  clientSeed: string,
  nonce: number
): BlackjackState {
  const deck = fairShuffle(freshDeck(), serverSeed, clientSeed, nonce);
  const player = [deck.pop()!, deck.pop()!];
  const dealer = [deck.pop()!, deck.pop()!];

  const hands: Hand[] = [{ cards: player, betCents, doubled: false, done: false }];

  const state: BlackjackState = {
    deck,
    dealer,
    hands,
    active: 0,
    betCents,
    finished: false,
    dealerRevealed: false,
    serverSeed,
    serverSeedHash,
    clientSeed,
    nonce,
    payoutCents: 0,
  };

  // Immediate blackjack resolves the round at once.
  if (isBlackjack(player)) {
    settle(state);
  }
  return state;
}

export function canSplit(state: BlackjackState): boolean {
  const hand = state.hands[state.active];
  return (
    !state.finished &&
    state.hands.length === 1 &&
    hand.cards.length === 2 &&
    cardValue(hand.cards[0].rank) === cardValue(hand.cards[1].rank)
  );
}

export function canDouble(state: BlackjackState): boolean {
  const hand = state.hands[state.active];
  return !state.finished && hand.cards.length === 2 && !hand.done;
}

export function hit(state: BlackjackState): void {
  if (state.finished) return;
  const hand = state.hands[state.active];
  if (hand.done) return;
  hand.cards.push(state.deck.pop()!);
  if (handValue(hand.cards) >= 21) {
    hand.done = true;
    advance(state);
  }
}

export function stand(state: BlackjackState): void {
  if (state.finished) return;
  state.hands[state.active].done = true;
  advance(state);
}

export function double(state: BlackjackState): number {
  if (!canDouble(state)) return 0;
  const hand = state.hands[state.active];
  hand.doubled = true;
  const extra = hand.betCents; // caller must debit this additional bet
  hand.betCents *= 2;
  hand.cards.push(state.deck.pop()!);
  hand.done = true;
  advance(state);
  return extra;
}

export function split(state: BlackjackState): number {
  if (!canSplit(state)) return 0;
  const hand = state.hands[state.active];
  const extra = hand.betCents; // second hand's bet, caller debits it
  const [c1, c2] = hand.cards;
  state.hands = [
    { cards: [c1, state.deck.pop()!], betCents: hand.betCents, doubled: false, done: false },
    { cards: [c2, state.deck.pop()!], betCents: hand.betCents, doubled: false, done: false },
  ];
  state.active = 0;
  return extra;
}

function advance(state: BlackjackState): void {
  // Move to the next unfinished hand, else play the dealer + settle.
  let next = state.active;
  while (next < state.hands.length && state.hands[next].done) next++;
  if (next < state.hands.length) {
    state.active = next;
    return;
  }
  playDealer(state);
  settle(state);
}

function playDealer(state: BlackjackState): void {
  state.dealerRevealed = true;
  // Dealer only draws if at least one hand is still live (not busted).
  const anyLive = state.hands.some((h) => handValue(h.cards) <= 21);
  if (anyLive) {
    while (handValue(state.dealer) < 17) {
      state.dealer.push(state.deck.pop()!);
    }
  }
}

export function settle(state: BlackjackState): void {
  state.dealerRevealed = true;
  state.finished = true;
  const dealerVal = handValue(state.dealer);
  const dealerBJ = isBlackjack(state.dealer);
  let payout = 0;

  for (const hand of state.hands) {
    const val = handValue(hand.cards);
    const playerBJ = isBlackjack(hand.cards) && state.hands.length === 1;

    if (val > 21) {
      hand.outcome = "lose";
    } else if (playerBJ && !dealerBJ) {
      hand.outcome = "blackjack";
      payout += Math.floor(hand.betCents * 2.5); // 3:2 → stake back + 1.5x
    } else if (dealerBJ && !playerBJ) {
      hand.outcome = "lose";
    } else if (dealerVal > 21 || val > dealerVal) {
      hand.outcome = "win";
      payout += hand.betCents * 2; // stake back + 1x
    } else if (val === dealerVal) {
      hand.outcome = "push";
      payout += hand.betCents; // stake back
    } else {
      hand.outcome = "lose";
    }
  }
  state.payoutCents = payout;
}

/**
 * Client-safe view: hide the shoe and the dealer hole card until revealed,
 * and never leak the serverSeed until the round is finished.
 */
export function publicState(state: BlackjackState) {
  return {
    dealer: state.dealerRevealed ? state.dealer : [state.dealer[0], { rank: "?", suit: "?" }],
    dealerValue: state.dealerRevealed ? handValue(state.dealer) : cardValue(state.dealer[0].rank),
    hands: state.hands.map((h) => ({
      cards: h.cards,
      value: handValue(h.cards),
      betCents: h.betCents,
      doubled: h.doubled,
      done: h.done,
      outcome: h.outcome,
    })),
    active: state.active,
    finished: state.finished,
    canSplit: canSplit(state),
    canDouble: canDouble(state),
    payoutCents: state.payoutCents,
    serverSeedHash: state.serverSeedHash,
    clientSeed: state.clientSeed,
    nonce: state.nonce,
    serverSeed: state.finished ? state.serverSeed : undefined,
  };
}
