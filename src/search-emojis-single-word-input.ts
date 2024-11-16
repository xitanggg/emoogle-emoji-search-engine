import {
	type Options,
	EMOJI_KEYWORDS,
	KEYWORD_MOST_RELEVANT_EMOJI,
	WORD_TO_TOP_1000_WORDS_IDX,
} from './constants';
import { preProcessString } from './utils/pre-process-string';

/**
 * Search emojis for a single word input, e.g. dog
 */
export const searchEmojisForSingleWordInput = (
	inputWord: string,
	options: Options
) => {
	const customEmojiKeywords = options.customEmojiKeywords || {};
	const customKeywordMostRelevantEmoji =
		options.customKeywordMostRelevantEmoji || {};
	const recentlySearchedInputs = options.recentlySearchedInputs || [];
	const wordToRecentlySearchedInputIdx =
		recentlySearchedInputs.length > 0
			? recentlySearchedInputs.reduce(
					(acc, input, idx) => {
						acc[input] = idx;
						return acc;
					},
					{} as Record<string, number>
				)
			: undefined;

	const emojisAttributes: [emoji: string, attributes: Attributes][] = [];

	// Loop through each emoji and its keywords to get emoji's best matching attributes
	for (const [emoji, keywords] of Object.entries(EMOJI_KEYWORDS)) {
		const allKeywords = !customEmojiKeywords[emoji]
			? keywords
			: keywords.concat(customEmojiKeywords[emoji]);

		const emojiBestAttributes = getEmojiBestAttributes(
			inputWord,
			emoji,
			allKeywords,
			customKeywordMostRelevantEmoji,
			wordToRecentlySearchedInputIdx
		);

		// If the emoji has a matching attributes, add it to emojisAttributes
		if (emojiBestAttributes) {
			emojisAttributes.push([emoji, emojiBestAttributes]);
		}
	}

	// Sort emojisAttributes from best attributes to lowest
	emojisAttributes.sort((a, b) => compareAttributes(a[1], b[1]));

	const results = emojisAttributes.map((item) => item[0]);

	return results;
};

interface Attributes {
	isExactMatch: boolean; // True = exact match, False = prefix match
	isCustomMostRelevantEmoji: boolean;
	isMostRelevantEmoji: boolean;
	isEmojiName: boolean;
	isSingleWord: boolean;
	matchWord: string;
	prefixMatchRecentlySearchedInputsIdx?: number;
	prefixMatchTop1000WordsIdx?: number;
}

/**
 * Get the best attributes for the emoji based on its keywords matching against the input word.
 * If there is no match, return undefined.
 */
const getEmojiBestAttributes = (
	inputWord: string,
	emoji: string,
	keywords: string[],
	customKeywordMostRelevantEmoji: Record<string, string> = {},
	wordToRecentlySearchedInputIdx?: Record<string, number>
) => {
	let emojiBestAttributes: undefined | Attributes = undefined;
	const hasRecentlySearchedInputs =
		wordToRecentlySearchedInputIdx !== undefined;

	// Loop through all keywords to compute the best ranked attributes
	for (let i = 0; i < keywords.length; i++) {
		const keyword = preProcessString(keywords[i]);

		const isEmojiName = i === 0; // First keyword is always the emoji name
		const isSingleWord = !keyword.includes(' ');

		if (isSingleWord) {
			const isExactMatch = computeIsExactMatch(inputWord, keyword);

			// Skip if there is no keyword match
			if (isExactMatch === undefined) continue;

			const isMostRelevantEmoji =
				KEYWORD_MOST_RELEVANT_EMOJI[keyword] === emoji;
			const isCustomMostRelevantEmoji =
				customKeywordMostRelevantEmoji[keyword] === emoji;
			const attributes = {
				isExactMatch,
				isCustomMostRelevantEmoji,
				isMostRelevantEmoji,
				isEmojiName,
				isSingleWord,
				matchWord: keyword,
				prefixMatchRecentlySearchedInputsIdx:
					hasRecentlySearchedInputs && !isExactMatch
						? wordToRecentlySearchedInputIdx[keyword]
						: undefined,
				prefixMatchTop1000WordsIdx: !isExactMatch
					? WORD_TO_TOP_1000_WORDS_IDX[keyword]
					: undefined,
			};

			// Update best attributes if current attributes is better
			if (
				emojiBestAttributes === undefined ||
				compareAttributes(attributes, emojiBestAttributes) < 0
			) {
				emojiBestAttributes = attributes;
			}
		} else {
			const words = keyword.split(' ');
			for (const word of words) {
				const isExactMatch = computeIsExactMatch(inputWord, word);

				// Skip if there is no keyword match
				if (isExactMatch === undefined) continue;

				const isMostRelevantEmoji = KEYWORD_MOST_RELEVANT_EMOJI[word] === emoji;
				const isCustomMostRelevantEmoji =
					customKeywordMostRelevantEmoji[word] === emoji;
				const attributes = {
					isExactMatch,
					isCustomMostRelevantEmoji,
					isMostRelevantEmoji,
					isEmojiName,
					isSingleWord,
					matchWord: word,
					prefixMatchRecentlySearchedInputsIdx:
						hasRecentlySearchedInputs && !isExactMatch
							? wordToRecentlySearchedInputIdx[keyword]
							: undefined,
					prefixMatchTop1000WordsIdx: !isExactMatch
						? WORD_TO_TOP_1000_WORDS_IDX[keyword]
						: undefined,
				};

				// Update best attributes if current attributes is better
				if (
					emojiBestAttributes === undefined ||
					compareAttributes(attributes, emojiBestAttributes) < 0
				) {
					emojiBestAttributes = attributes;
				}
			}
		}
	}

	return emojiBestAttributes;
};

/**
 * Return true if inputWord is same as keyword, false if inputWord is a prefix match of keyword,
 * and undefined if there is no match.
 */
const computeIsExactMatch = (inputWord: string, keyword: string) => {
	if (inputWord === keyword) {
		return true;
	} else if (keyword.startsWith(inputWord)) {
		return false;
	}
	return undefined;
};

/**
 * compareAttributes is the ranking function that compares 2 attributes and decides which one
 * should be ranked higher. For attributes a and b, it can return -1, 0 or 1, where -1 means
 * a is ranked higher and should be sorted first, 0 means equal rank, and 1 means b is ranked higher.
 *
 * The way ranking works is via a tie-breaking algorithm. Essentially, there are a list of ranking
 * criteria it goes through in order. If a criterion reveals a different rank between a and b, it stops
 * and returns. Otherwise, it continues to go to the next criterion and check the rank again until
 * there is no tie, i.e. it breaks the tie. This is very similar to Algolia's ranking strategy:
 * https://www.algolia.com/doc/guides/managing-results/must-do/custom-ranking/#the-ranking-criteria
 *
 * The ranking criteria of single word input search are as follows:
 * 1. Exact match is ranked higher than prefix match
 *
 * If both are exact match or prefix match, then a separate tie-breaking logic is applied to each match type
 *
 * Exact match additional ranking criteria:
 * 2. Custom most relevant emoji is ranked higher (this is user's preferred keyword emoji match)
 * 3. Most relevant emoji is ranked higher (this is the default most relevant keyword emoji match)
 *    e.g. arm's most relevant emoji is 💪, so 💪 is ranked higher than 🦾
 * 4. Keyword in emoji name is ranked higher
 * 5. Single word keyword is ranked higher than multiple words keyword
 *
 * Prefix match additional ranking criteria:
 * 2. Recently searched input is ranked higher
 * 3. Single word keyword is ranked higher than multiple words keyword
 * 4. Sort by top 1000 words if keyword is in the list
 * 5. Sort alphabetically otherwise
 * 6. Custom most relevant emoji is ranked higher
 * 7. Most relevant emoji is ranked higher
 *
 * Prefix match is for search as you type experience, so it doesn't take into account of keyword in
 * emoji name but instead uses alphabetical sort as a higher ranking criterion to give a better search
 * as you type experience.
 */
const compareAttributes = (a: Attributes, b: Attributes) => {
	if (a.isExactMatch !== b.isExactMatch) {
		return a.isExactMatch ? -1 : 1;
	}

	if (a.isExactMatch) {
		if (a.isCustomMostRelevantEmoji !== b.isCustomMostRelevantEmoji) {
			return a.isCustomMostRelevantEmoji ? -1 : 1;
		}

		if (a.isMostRelevantEmoji !== b.isMostRelevantEmoji) {
			return a.isMostRelevantEmoji ? -1 : 1;
		}

		if (a.isEmojiName !== b.isEmojiName) {
			return a.isEmojiName ? -1 : 1;
		}

		if (a.isSingleWord !== b.isSingleWord) {
			return a.isSingleWord ? -1 : 1;
		}

		return 0;
	} else {
		if (
			a.prefixMatchRecentlySearchedInputsIdx !==
			b.prefixMatchRecentlySearchedInputsIdx
		) {
			if (a.prefixMatchRecentlySearchedInputsIdx === undefined) return 1;
			if (b.prefixMatchRecentlySearchedInputsIdx === undefined) return -1;
			return a.prefixMatchRecentlySearchedInputsIdx <
				b.prefixMatchRecentlySearchedInputsIdx
				? -1
				: 1;
		}

		if (a.isSingleWord !== b.isSingleWord) {
			return a.isSingleWord ? -1 : 1;
		}

		if (a.prefixMatchTop1000WordsIdx !== b.prefixMatchTop1000WordsIdx) {
			if (a.prefixMatchTop1000WordsIdx === undefined) return 1;
			if (b.prefixMatchTop1000WordsIdx === undefined) return -1;
			return a.prefixMatchTop1000WordsIdx < b.prefixMatchTop1000WordsIdx
				? -1
				: 1;
		}

		if (a.matchWord !== b.matchWord) {
			return a.matchWord.localeCompare(b.matchWord);
		}

		if (a.isCustomMostRelevantEmoji !== b.isCustomMostRelevantEmoji) {
			return a.isCustomMostRelevantEmoji ? -1 : 1;
		}

		if (a.isMostRelevantEmoji !== b.isMostRelevantEmoji) {
			return a.isMostRelevantEmoji ? -1 : 1;
		}

		return 0;
	}
};
