import { langchainDeck } from "./langchain";
import { langgraphDeck } from "./langgraph";
import { crewaiDeck } from "./crewai";
import { landscapeDeck } from "./landscape";
import type { Deck } from "./types";

export const DECKS: Deck[] = [langchainDeck, langgraphDeck, crewaiDeck, landscapeDeck];
export const DECK_MAP: Record<string, Deck> = Object.fromEntries(DECKS.map((d) => [d.id, d]));
export type { Deck, Slide } from "./types";
