import { searchEmojis } from '../src/';

/**
 * Script to perform an one off search for emojis using
 * the cli, e.g. npm run search hello
 */

const [input] = process.argv.slice(2);

const startTime = Date.now();
const results = searchEmojis(input);
const timeToSearchInMs = Date.now() - startTime;

console.log({
	input,
	results,
	timeToSearchInMs,
});
