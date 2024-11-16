import { type Options, EMOJI_KEYWORDS } from './constants';
import { preProcessString } from './utils/pre-process-string';

/**
 * Search emojis for an input phrase that contains multiple words, e.g. dog face
 */
export const searchEmojisForMultipleWordsInput = (
	inputWords: string,
	options: Options
) => {
	const customEmojiKeywords = options.customEmojiKeywords || {};
	const customKeywordMostRelevantEmoji =
		options.customKeywordMostRelevantEmoji || {};

	const emojisAttributes: [emoji: string, attributes: Attributes][] = [];

	const inputWordsArray = inputWords.split(' ');

	// Loop through each emoji and its keywords to get emoji's best matching attributes
	for (const [emoji, keywords] of Object.entries(EMOJI_KEYWORDS)) {
		const allKeywords = !customEmojiKeywords[emoji]
			? keywords
			: keywords.concat(customEmojiKeywords[emoji]);

		const emojiBestAttributes = getEmojiBestAttributes(
			inputWords,
			inputWordsArray,
			emoji,
			allKeywords,
			customKeywordMostRelevantEmoji
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
	isMultipleWordsKeywordMatch: boolean; // True = multiple words keyword match, False = jointed keywords match
	isMultipleWordsKeywordInOrderMatch: boolean; // True = multiple words keyword match in order, False = match in different order
	isMultipleWordsKeywordInOrderMatchExactMatch: boolean; // True = exact match, False = partial match
	isCustomMostRelevantEmoji: boolean;
	numExactMatches: number;
	numPrefixMatches: number;
	numWordsInMultipleWordsKeyword: number; // Number of words in the multiple words keyword
}

/**
 * Get the best attributes for the emoji based on its keywords matching against the input words.
 * If there is no match, return undefined.
 */
const getEmojiBestAttributes = (
	inputWords: string,
	inputWordsArray: string[],
	emoji: string,
	keywords: string[],
	customKeywordMostRelevantEmoji: Record<string, string> = {}
) => {
	let emojiBestAttributes: undefined | Attributes = undefined;

	keywords = keywords.map((keyword) => preProcessString(keyword));

	// First, attempt to find a match against a multiple words keyword by looping through all the multiple words keywords
	const multipleWordsKeywords = keywords.filter((keyword) =>
		keyword.includes(' ')
	);
	for (const keyword of multipleWordsKeywords) {
		// Check if there is an in order match exact match
		if (keyword === inputWords) {
			const isCustomMostRelevantEmoji =
				customKeywordMostRelevantEmoji[keyword] === emoji;
			const attributes = {
				isMultipleWordsKeywordMatch: true,
				isMultipleWordsKeywordInOrderMatch: true,
				isMultipleWordsKeywordInOrderMatchExactMatch: true,
				isCustomMostRelevantEmoji,
				numExactMatches: 0, // Not used
				numPrefixMatches: 0, // Not used
				numWordsInMultipleWordsKeyword: 0, // Not used
			};
			if (
				emojiBestAttributes === undefined ||
				compareAttributes(attributes, emojiBestAttributes) < 0
			) {
				emojiBestAttributes = attributes;
			}
		}
		// Check if there is an in order match partial match
		// Note: we don't use includes(inputWords) because it could have false positive matching behavior, e.g."man artist" also matches "woman artist"
		else if (
			keyword.startsWith(inputWords) ||
			keyword.includes(' ' + inputWords)
		) {
			const keywordWordsArray = keyword.split(' ');
			const isCustomMostRelevantEmoji =
				customKeywordMostRelevantEmoji[keyword] === emoji;
			const attributes = {
				isMultipleWordsKeywordMatch: true,
				isMultipleWordsKeywordInOrderMatch: true,
				isMultipleWordsKeywordInOrderMatchExactMatch: false,
				isCustomMostRelevantEmoji,
				numExactMatches: 0, // Not used
				numPrefixMatches: 0, // Not used
				numWordsInMultipleWordsKeyword: keywordWordsArray.length,
			};
			if (
				emojiBestAttributes === undefined ||
				compareAttributes(attributes, emojiBestAttributes) < 0
			) {
				emojiBestAttributes = attributes;
			}
		}
		// Check if there is an out of order match
		else {
			const keywordWordsArray = keyword.split(' ');

			// Skip if the keyword has fewer number of words than the input words
			// as there won't be a match against all input words this way
			if (keywordWordsArray.length < inputWordsArray.length) {
				continue;
			}

			const { numExactMatches, numPrefixMatches } = getNumMatches(
				inputWordsArray,
				keywordWordsArray
			);
			if (numExactMatches === 0 && numPrefixMatches === 0) {
				continue;
			}

			const attributes = {
				isMultipleWordsKeywordMatch: true,
				isMultipleWordsKeywordInOrderMatch: false,
				isMultipleWordsKeywordInOrderMatchExactMatch: false, // not used in out of order match
				isCustomMostRelevantEmoji: false, // not used
				numExactMatches,
				numPrefixMatches,
				numWordsInMultipleWordsKeyword: keywordWordsArray.length,
			};

			if (
				emojiBestAttributes === undefined ||
				compareAttributes(attributes, emojiBestAttributes) < 0
			) {
				emojiBestAttributes = attributes;
			}
		}
	}

	// If there isn't a multiple words keyword match, search through the jointed keywords
	if (!emojiBestAttributes) {
		const jointedKeywordsArray = keywords.join(' ').split(' ');

		const { numExactMatches, numPrefixMatches } = getNumMatches(
			inputWordsArray,
			jointedKeywordsArray
		);

		if (numExactMatches !== 0 || numPrefixMatches !== 0) {
			const attributes = {
				isMultipleWordsKeywordMatch: false,
				isMultipleWordsKeywordInOrderMatch: false, // not used
				isMultipleWordsKeywordInOrderMatchExactMatch: false, // not used
				isCustomMostRelevantEmoji: false, // not used
				numExactMatches,
				numPrefixMatches,
				numWordsInMultipleWordsKeyword: 0, // not used
			};

			emojiBestAttributes = attributes;
		}
	}

	return emojiBestAttributes;
};

/**
 * Return the number of exact matches and prefix matches between the input words and the keywords.
 * If there is no match, return 0 for both.
 */
const getNumMatches = (inputWordsArray: string[], keywordsArray: string[]) => {
	let numExactMatches = 0;
	let numPrefixMatches = 0;

	// Loop through all the input words to see if they match against the words in keyword
	for (const inputWord of inputWordsArray) {
		let bestMatchType: undefined | 'Exact' | 'Prefix' = undefined;
		for (const keyword of keywordsArray) {
			if (keyword === inputWord) {
				bestMatchType = 'Exact';
				// Break out of the keyword loop if there is an exact match, since that is the best match type
				break;
			} else if (keyword.startsWith(inputWord)) {
				bestMatchType = 'Prefix';
				// Continue keyword loop in case there is a better match type
			}
		}

		// Skip checking the rest of the input words if there is no match for the current input word
		if (!bestMatchType) {
			return {
				numExactMatches: 0,
				numPrefixMatches: 0,
			};
		}

		if (bestMatchType === 'Exact') {
			numExactMatches++;
		} else {
			numPrefixMatches++;
		}
	}

	return { numExactMatches, numPrefixMatches };
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
 * The ranking criteria of multiple words input search are as follows:
 * 1. Multiple words keyword match is ranked higher than jointed keywords match
 *
 * If both are multiple words keyword match or jointed keywords match, then a separate tie-breaking
 * logic is applied to each match type
 *
 * Multiple words keyword match additional ranking criteria:
 * 2. In order match is ranked higher than out of order match (e.g. if input is "dog face", "dog face" is ranked higher than "face dog")
 *  In order match additional ranking criteria:
 *  3. Exact match is ranked higher than prefix match
 *  4. Custom most relevant emoji is ranked higher
 *  5. Having less number of words in multiple words keyword is ranked higher
 *  Out of order match additional ranking criteria:
 *  3. Having more number of exact matches is ranked higher
 *  4. Having more number of prefix matches is ranked higher
 *  5. Having less number of words in multiple words keyword is ranked higher
 *
 * Jointed keywords match additional ranking criteria:
 * 2. Having more number of exact matches is ranked higher
 * 3. Having more number of prefix matches is ranked higher
 *
 * Jointed keywords match has fewer ranking criteria because it is sort of like fuzzy search in nature, so
 * there isn't much to ranked/optimized for
 */
const compareAttributes = (a: Attributes, b: Attributes) => {
	if (a.isMultipleWordsKeywordMatch !== b.isMultipleWordsKeywordMatch) {
		return a.isMultipleWordsKeywordMatch ? -1 : 1;
	}

	if (a.isMultipleWordsKeywordMatch) {
		if (
			a.isMultipleWordsKeywordInOrderMatch !==
			b.isMultipleWordsKeywordInOrderMatch
		) {
			return a.isMultipleWordsKeywordInOrderMatch ? -1 : 1;
		}

		if (a.isMultipleWordsKeywordInOrderMatch) {
			if (
				a.isMultipleWordsKeywordInOrderMatchExactMatch !==
				b.isMultipleWordsKeywordInOrderMatchExactMatch
			) {
				return a.isMultipleWordsKeywordInOrderMatchExactMatch ? -1 : 1;
			}

			if (a.isCustomMostRelevantEmoji !== b.isCustomMostRelevantEmoji) {
				return a.isCustomMostRelevantEmoji ? -1 : 1;
			}
		} else {
			if (a.numExactMatches !== b.numExactMatches) {
				return a.numExactMatches > b.numExactMatches ? -1 : 1;
			}

			if (a.numPrefixMatches !== b.numPrefixMatches) {
				return a.numPrefixMatches > b.numPrefixMatches ? -1 : 1;
			}
		}

		if (a.numWordsInMultipleWordsKeyword !== b.numWordsInMultipleWordsKeyword) {
			return a.numWordsInMultipleWordsKeyword < b.numWordsInMultipleWordsKeyword
				? -1
				: 1;
		}

		return 0;
	} else {
		if (a.numExactMatches !== b.numExactMatches) {
			return a.numExactMatches > b.numExactMatches ? -1 : 1;
		}

		if (a.numPrefixMatches !== b.numPrefixMatches) {
			return a.numPrefixMatches > b.numPrefixMatches ? -1 : 1;
		}

		return 0;
	}
};
