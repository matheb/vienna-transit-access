import type { messages } from "./en";

// The shape of en.ts with every text widened to string, so another language can satisfy it with its own words.
type WidenTexts<Shape> = { [Key in keyof Shape]: Shape[Key] extends string ? string : WidenTexts<Shape[Key]> };
export type Messages = WidenTexts<typeof messages>;
