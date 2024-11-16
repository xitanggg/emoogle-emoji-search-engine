import cliProgress from 'cli-progress';
import stringify from 'json-stringify-pretty-compact';
import fs from 'fs';
import { EMOJI_KEYWORDS, searchEmojis } from '../src';
import { preProcessString } from '../src/utils/pre-process-string';
import { EXCLUDED_GLOSSARY_KEYWORDS } from './excluded-glossary-keywords';

/**
 * Script to create emoogle-emoji-glossary.json by looping through
 * each keyword and search the best matching emojis for it. It also
 * creates alphabet-glossary.json that contains emojis for each
 * alphabet letter.
 *
 * Both files are useful and serve as a snapshot result of the
 * the current emoji keywords and search engine. It can be used
 * to compare and verify the search results when adding new emoji
 * keywords and updating the search engine algorithm.
 */

/**
 * Extract all emoji keywords and sort them alphabetically
 */
const getAllEmojiKeywords = () => {
	const keywordsSet = new Set<string>();

	const addKeywordToSet = (keyword: string) => {
		if (!EXCLUDED_GLOSSARY_KEYWORDS.has(keyword)) {
			keywordsSet.add(keyword);
		}
	};

	for (const [emoji, keywords] of Object.entries(EMOJI_KEYWORDS)) {
		if (keywords.length !== new Set(keywords).size) {
			throw new Error(`Found duplicate keywords for ${emoji}`);
		}
		for (let keyword of keywords) {
			keyword = preProcessString(keyword);
			addKeywordToSet(keyword);

			const isPhrase = keyword.includes(' ');
			if (isPhrase) {
				const words = keyword.split(' ');
				for (const word of words) {
					addKeywordToSet(word);
				}
			}
		}
	}

	const keywords = Array.from(keywordsSet);
	keywords.sort();
	return keywords;
};

const keywords = getAllEmojiKeywords();
const numKeywords = keywords.length;
const glossary: Record<string, string[]> = {};

const progressBar = new cliProgress.SingleBar(
	{
		format:
			'Creating emoji glossary: [{bar}] {percentage}% | {value}/{total} keywords',
	},
	cliProgress.Presets.shades_classic
);
progressBar.start(numKeywords, 0);

const startTime = Date.now();
for (let i = 0; i < numKeywords; i++) {
	progressBar.update(i + 1);
	const keyword = keywords[i];
	glossary[keyword] = searchEmojis(keyword);
}
const durationMs = Date.now() - startTime;

progressBar.stop();

fs.writeFileSync(
	'./data/emoogle-emoji-glossary.json',
	stringify(glossary, { maxLength: 300, indent: 2 })
);

const searchSpeedMsPerKeyword = Math.round(durationMs / numKeywords);
const durationSec = Math.round(durationMs / 1000);
console.log(
	`Created emoogle-emoji-glossary.json successfully for ${numKeywords} keywords in ${durationSec} seconds (search speed: ${searchSpeedMsPerKeyword}ms/keyword)`
);

const alphabetGlossary: Record<string, string[]> = {};
const lowercaseAlphabet = Array.from({ length: 26 }, (_, i) =>
	String.fromCharCode(97 + i)
);
for (const letter of lowercaseAlphabet) {
	alphabetGlossary[letter] = searchEmojis(letter);
}
fs.writeFileSync(
	'./data/alphabet-glossary.json',
	stringify(alphabetGlossary, { maxLength: 300, indent: 2 })
);
