import emojiKeywords from '../data/emoogle-emoji-keywords.json';
import keywordToMostRelevantEmoji from '../data/emoogle-keyword-most-relevant-emoji.json';
import emojiGlossary from '../data/emoogle-emoji-glossary.json';
import top1000WordsByFrequency from '../data/top-1000-words-by-frequency.json';

type EmojiKeywords = Record<string, string[]>;
type KeywordMostRelevantEmoji = Record<string, string>;

export interface Options {
	customEmojiKeywords?: EmojiKeywords;
	customKeywordMostRelevantEmoji?: KeywordMostRelevantEmoji;
	recentlySearchedInputs?: string[];
}

/**
 * EMOJI_KEYWORDS is a map from emoji to its keywords
 * e.g. {"➕": ["plus", "add", "sum", "and", "increase", "positive", "math"]}
 */
export const EMOJI_KEYWORDS = emojiKeywords;

/**
 * KEYWORD_MOST_RELEVANT_EMOJI is a map from keyword to the most relevant emoji
 * e.g. {"a": "🅰️"}
 */
export const KEYWORD_MOST_RELEVANT_EMOJI = keywordToMostRelevantEmoji;

/**
 * EMOJI_GLOSSARY is a map from keyword to emojis that match the keyword
 * e.g. {"0": ["0️⃣", "✊"]}
 */
export const EMOJI_GLOSSARY = emojiGlossary;

/**
 * EMOJI_SET is a set of all emojis
 */
export const EMOJI_SET = new Set(Object.keys(EMOJI_KEYWORDS));

const TOP_1000_WORDS_BY_FREQUENCY = top1000WordsByFrequency;
export const WORD_TO_TOP_1000_WORDS_IDX = TOP_1000_WORDS_BY_FREQUENCY.reduce(
	(acc, word, idx) => {
		acc[word] = idx;
		return acc;
	},
	{} as Record<string, number>
);
