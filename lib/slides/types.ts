export interface SlideCard {
  title: string;
  sub?: string;
  body?: string;
  color: string;
  emoji?: string;
  tags?: string[];
}

export interface Slide {
  /** "title" = deck cover / section opener, "content" = everything else */
  layout?: "title" | "content";
  kicker?: string;
  title: string;
  subtitle?: string;
  emoji?: string;
  /** Short markdown-lite bullets (**bold**, `code`) */
  bullets?: string[];
  code?: { title?: string; code: string };
  cards?: SlideCard[];
  cols?: 2 | 3 | 4 | 5;
  table?: { head: string[]; rows: string[][] };
  flow?: { label?: string; color: string; steps: string[] }[];
  chips?: string[];
  callout?: string;
  /** Speaker notes for the presenter */
  notes?: string;
}

export interface Deck {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  gradient: string; // tailwind gradient classes
  accent: string; // hex
  slides: Slide[];
}
