import fs from 'fs';
import stringify from 'json-stringify-pretty-compact';

/**
 * Script to process and create a list of the top 1000 words by frequency
 *
 * The initial data is sourced from Word frequency data that contains
 * the top 5000 words by frequency in English language and is not included
 * in this repository.
 * Reference: https://www.wordfrequency.info/samples.asp
 */

const file = fs.readFileSync('./scripts/archive/word-frequency.csv');

// Skip words that are not useful for emoji match
// prettier-ignore
const SKIP_WORDS = ['be', 'have', 'do', 'get', 'can', 'will', 'would', 'other', 'could', 'need', 'should',
					'try', 'let', 'may', 'happen', 'might', 'bring', 'lot', 'must', 'different', 'percent', 
					'only', 'set', 'able', 'possible', 'pull', 'term', 'current', 'likely', 'general', 'common',
					'century', 'mile', 'floor', 'bit', 'crime', 'occur', 'september', 'various', 'particular',
					'total', 'sunday', 'owner', 'shall', 'voter', 'june', 'far', 'reader', 'march', 'november',
					'senator', 'july', 'senate', 'weekend', 'while', 'tend', 'edge', 'october', 'just',
					'governor', 'interested', 'saturday', 'willing', 'april', 'want', 'writer', 'lack',
					'very', 'murder', 'additional', 'prison', 'attempt', 'thousand', 'monday', 'average'
					]

const lines = file.toString().split('\n');
const posToCount: Record<string, number> = {};

const top1000Words = [];

for (let line of lines) {
	line = line.trim();
	if (!line) {
		continue;
	}

	const [_, word, pos] = line.split(',');
	// Only keep verbs, nouns, adjectives, numbers, and interjections (e.g. oh, yes, um)
	if (!['v', 'n', 'j', 'm', 'u'].includes(pos)) {
		continue;
	}

	// Skip words that are not useful for emoji match
	if (SKIP_WORDS.includes(word)) {
		continue;
	}

	if (!posToCount[pos]) {
		posToCount[pos] = 0;
	}
	posToCount[pos] = posToCount[pos] + 1;

	if (!top1000Words.includes(word)) {
		top1000Words.push(word);
	}

	if (top1000Words.length === 1000) {
		break;
	}
}

console.log(posToCount);

fs.writeFileSync(
	'./data/top-1000-words-by-frequency.json',
	stringify(top1000Words)
);
