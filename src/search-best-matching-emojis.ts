import { type Options, EMOJI_KEYWORDS } from './constants';
import { preProcessString } from './utils/pre-process-string';
import { filterPartsOfSpeech } from './utils/nlp/parts-of-speech';
import { stemWord } from './utils/nlp/stem-word';

export const searchBestMatchingEmojisForMultipleWordsInput = (
	inputWords: string,
	options: Pick<Options, 'customEmojiKeywords'> = {
		customEmojiKeywords: {},
	}
) => {
	const { customEmojiKeywords = {} } = options;

	const emojisAttributes: [emoji: string, attributes: Attributes][] = [];

	const inputWordsArray = filterPartsOfSpeech(inputWords.split(' '));
	const stemmedInputWordsArray = inputWordsArray.map((word) => stemWord(word));

	// Loop through each emoji and its keywords to get emoji's best matching attributes
	for (const [emoji, keywords] of Object.entries(EMOJI_KEYWORDS)) {
		const allKeywords = !customEmojiKeywords[emoji]
			? keywords
			: keywords.concat(customEmojiKeywords[emoji]);

		const emojiBestAttributes = getEmojiBestAttributes(
			inputWordsArray,
			stemmedInputWordsArray,
			allKeywords
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
	numExactWordMatches: number;
	numExactStemmedWordMatches: number;
	numPrefixWordMatches: number;
	numPrefixStemmedWordMatches: number;
}

/**
 * Get the best attributes for the emoji based on its keywords matching against the input words.
 * If there is no match, return undefined.
 */
const getEmojiBestAttributes = (
	inputWordsArray: string[],
	stemmedInputWordsArray: string[],
	keywords: string[]
) => {
	let emojiBestAttributes: undefined | Attributes = undefined;

	keywords = keywords.map((keyword) => preProcessString(keyword));

	const jointedKeywordsArray = keywords.join(' ').split(' ');
	const jointedKeywordsSet = new Set(jointedKeywordsArray);

	const {
		numExactWordMatches,
		numExactStemmedWordMatches,
		numPrefixWordMatches,
		numPrefixStemmedWordMatches,
	} = getNumMatches(
		inputWordsArray,
		stemmedInputWordsArray,
		jointedKeywordsArray,
		jointedKeywordsSet
	);

	if (
		numExactWordMatches !== 0 ||
		numExactStemmedWordMatches !== 0 ||
		numPrefixWordMatches !== 0 ||
		numPrefixStemmedWordMatches !== 0
	) {
		const attributes = {
			numExactWordMatches,
			numExactStemmedWordMatches,
			numPrefixWordMatches,
			numPrefixStemmedWordMatches,
		};

		emojiBestAttributes = attributes;
	}

	return emojiBestAttributes;
};

const getNumMatches = (
	inputWordsArray: string[],
	stemmedInputWordsArray: string[],
	keywordsArray: string[],
	keywordsSet: Set<string>
) => {
	let numExactWordMatches = 0;
	let numExactStemmedWordMatches = 0;
	let numPrefixWordMatches = 0;
	let numPrefixStemmedWordMatches = 0;

	// Loop through all the input words to see if they match against the words in keyword
	for (let i = 0; i < inputWordsArray.length; i++) {
		const inputWord = inputWordsArray[i];
		const stemmedInputWord = stemmedInputWordsArray[i];

		if (keywordsSet.has(inputWord)) {
			numExactWordMatches++;
		}
		// ~37% words are in its stemmed form already, so we skip this check if word is same as stemmed word
		else if (
			inputWord !== stemmedInputWord &&
			keywordsSet.has(stemmedInputWord)
		) {
			numExactStemmedWordMatches++;
		}
		// If there isn't exact match, loop through keywords to check prefix match
		else {
			let prefixMatchStemmedWord = false;
			for (const keyword of keywordsArray) {
				if (keyword.startsWith(stemmedInputWord)) {
					prefixMatchStemmedWord = true;
					if (keyword.startsWith(inputWord)) {
						numPrefixWordMatches++;
						// Reset prefixMatchStemmedWord if there is a prefix match with the input word
						prefixMatchStemmedWord = false;
						break;
					}
				}
			}
			if (prefixMatchStemmedWord) {
				numPrefixStemmedWordMatches++;
			}
		}
	}

	return {
		numExactWordMatches,
		numExactStemmedWordMatches,
		numPrefixWordMatches,
		numPrefixStemmedWordMatches,
	};
};

const compareAttributes = (a: Attributes, b: Attributes) => {
	const aNumExactMatches = a.numExactWordMatches + a.numExactStemmedWordMatches;
	const bNumExactMatches = b.numExactWordMatches + b.numExactStemmedWordMatches;

	if (aNumExactMatches !== bNumExactMatches) {
		return aNumExactMatches > bNumExactMatches ? -1 : 1;
	}

	if (a.numExactWordMatches !== b.numExactWordMatches) {
		return a.numExactWordMatches > b.numExactWordMatches ? -1 : 1;
	}

	if (a.numPrefixWordMatches !== b.numPrefixWordMatches) {
		return a.numPrefixWordMatches > b.numPrefixWordMatches ? -1 : 1;
	}

	if (a.numPrefixStemmedWordMatches !== b.numPrefixStemmedWordMatches) {
		return a.numPrefixStemmedWordMatches > b.numPrefixStemmedWordMatches
			? -1
			: 1;
	}

	return 0;
};
