import { EMOJI_SET, type Options } from './constants';
import { preProcessString } from './utils/pre-process-string';
import { searchEmojisForMultipleWordsInput } from './search-emojis-multiple-words-input';
import { searchEmojisForSingleWordInput } from './search-emojis-single-word-input';
import { stemWord } from './utils/nlp/stem-word';
import { searchBestMatchingEmojisForMultipleWordsInput } from './search-best-matching-emojis';

/**
 * Search emojis util that is optimized for the search as you type experience.
 *
 * The more characters/words a user types, the narrower the set of emojis return.
 *
 * For input that contains a phrase of multiple words, it performs an AND operation
 * and returns only emojis that match all input words.
 */
export const searchEmojis = (
	input: string,
	maxLimit: number = 24,
	options: Options = {
		customEmojiKeywords: {},
		customKeywordMostRelevantEmoji: {},
		recentlySearchedInputs: [],
	}
) => {
	input = preProcessString(input).trim();

	if (!input) return [];

	// Return the input itself if it is an emoji
	if (EMOJI_SET.has(input)) {
		return [input];
	}

	const isSingleWordInput = !input.includes(' ');
	if (isSingleWordInput) {
		return searchEmojisForSingleWordInput(input, options).slice(0, maxLimit);
	}

	return searchEmojisForMultipleWordsInput(input, options).slice(0, maxLimit);
};

/**
 * Search emojis util that is optimized for the best matching experience. This is
 * used to find the best matching emojis for a sentence or a bullet point list item.
 *
 * Unlike the searchEmojis util, this is a more forgiving search that would also
 * match the stemmed input words by stripping off the suffixes, e.g. -s, -ing,
 * -ed, etc.
 *
 * For input with multiple words, it strips off some parts of speeches (e.g.
 * pronouns, prepositions) and then performs an OR operation and returns all
 * emojis that contain a match with any of the remaining words.
 *
 * Note: Treat this more as a beta util as the ranking algorithm stills needs some
 * refinements. For next iteration, it might be helpful to prioritize certain parts
 * of speech (verb, adjective, noun) words over others. More testing is needed.
 */
export const searchBestMatchingEmojis = (
	input: string,
	maxLimit: number = 24,
	options: Options = {
		customEmojiKeywords: {},
		customKeywordMostRelevantEmoji: {},
		recentlySearchedInputs: [],
	}
) => {
	input = preProcessString(input).trim();

	if (!input) return [];

	const isSingleWordInput = !input.includes(' ');
	if (isSingleWordInput) {
		const emojisForSingleWordInput = searchEmojisForSingleWordInput(
			input,
			options
		).slice(0, maxLimit);

		if (emojisForSingleWordInput.length > 0) {
			return emojisForSingleWordInput;
		}

		const stemmedInput = stemWord(input);

		if (stemmedInput === input) return [];

		return searchEmojisForSingleWordInput(stemmedInput, options).slice(
			0,
			maxLimit
		);
	}

	const emojisForMultipleWordsInput = searchEmojisForMultipleWordsInput(
		input,
		options
	).slice(0, maxLimit);

	if (emojisForMultipleWordsInput.length > 0) {
		return emojisForMultipleWordsInput;
	}

	return searchBestMatchingEmojisForMultipleWordsInput(input, options).slice(
		0,
		maxLimit
	);
};
