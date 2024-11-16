import { EMOJI_KEYWORDS } from '../../src';
import untypedComparedEmojiKeywords from './unicode-emoji-keywords.json';

/**
 * Script to compare the Emoogle emoji keywords with the Unicode emoji keywords
 * to ensure the order of the emojis and their names are the same.
 */

const comparedEmojiKeywords: Record<string, string[]> =
	untypedComparedEmojiKeywords;

const emojiKeywordsArray = Object.keys(EMOJI_KEYWORDS).map((emoji) => [
	emoji,
	EMOJI_KEYWORDS[emoji],
]);
const comparedEmojiKeywordsArray = Object.keys(comparedEmojiKeywords).map(
	(emoji) => [emoji, comparedEmojiKeywords[emoji]]
);

let isAllEqual = true;

for (let i = 0; i < emojiKeywordsArray.length; i++) {
	const [emoji, keywords] = emojiKeywordsArray[i];
	const emojiName = keywords[0];
	const [comparedEmoji, comparedKeywords] = comparedEmojiKeywordsArray[i];
	const comparedEmojiName = comparedKeywords[0];

	const isEmojiEqual = emoji === comparedEmoji;
	const isEmojiNameEqual = emojiName === comparedEmojiName;

	if (!isEmojiEqual || !isEmojiNameEqual) {
		isAllEqual = false;
		if (!isEmojiEqual) {
			console.log(`Emoji mismatch at index ${i} (${emojiName})`);
			console.log(`emoji: ${emoji} !== comparedEmoji: ${comparedEmoji}`);
		} else {
			console.log(`Emoji name mismatch at index ${i}`);
			console.log(
				`emojiName: ${emojiName} !== comparedEmojiName: ${comparedEmojiName}`
			);
		}
		break;
	}
}

if (isAllEqual) {
	console.log('All emojis and names are equal');
}
