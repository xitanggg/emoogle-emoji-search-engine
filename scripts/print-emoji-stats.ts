import { EMOJI_KEYWORDS } from '../src/';
import { preProcessString } from '../src/utils/pre-process-string';

/**
 * Script to print the number of unique words and phrases in the
 * emoji keywords database
 *
 * For comparison (1872 emojis):
 * Unicode (emoji name only) 			1724 words, 1360 phrases
 * CLDR (emoji name + CLDR keywords) 	2802 words, 1459 phrases
 * Notion 								3932 words, 2661 phrases
 * Emojilib before 4.0  				3302 words, 1508 phrases
 * Emojilib 4.0 with augmented data 	5005 words, 1508 phrases
 * Emoogle								5414 words, 2117 phrases
 */

const wordSet = new Set<string>();
const phraseSet = new Set<string>();

for (const [, keywords] of Object.entries(EMOJI_KEYWORDS)) {
	for (let keyword of keywords) {
		keyword = preProcessString(keyword);
		// keyword = keyword.replace(/_/g, ' '); // Used to replace _ with space for Emojilib for equal comparison
		const isPhrase = keyword.includes(' ');
		if (isPhrase) {
			phraseSet.add(keyword);
			const words = keyword.split(' ');
			for (const word of words) {
				wordSet.add(word);
			}
		} else {
			wordSet.add(keyword);
		}
	}
}

const numEmojis = Object.keys(EMOJI_KEYWORDS).length;
const numUniqueWords = wordSet.size;
const numUniquePhrases = phraseSet.size;

console.table({
	'Number of emojis': numEmojis,
	'Number of unique words': numUniqueWords,
	'Number of unique phrases': numUniquePhrases,
});
