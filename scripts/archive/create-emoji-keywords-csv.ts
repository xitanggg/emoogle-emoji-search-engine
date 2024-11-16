import fs from 'fs';
import { EMOJI_KEYWORDS } from '../../src';

/**
 * Script to create a CSV file for the Emoogle Emoji Keywords Database
 * Hosted at: emoogle.org/database
 */

const FILE_PATH = './scripts/archive/emoogle-emoji-keywords.csv';

const rows = [
	`🎉Welcome to the world's largest emoji keywords database with 5,400+ unique keywords for 1,872 emojis`,
	`"💡If you notice a keyword missing for an emoji, feel free to improve it by adding the keyword to that emoji's row. Together, we can make it much easier to search for and find the right emojis🫶"`,
	'🐶Emoji,📛Emoji Name,🔠Emoji Keywords',
];

for (const [emoji, keywords] of Object.entries(EMOJI_KEYWORDS)) {
	const [emojiName, ...emojiKeywords] = keywords;
	rows.push(`${emoji},${emojiName},"${emojiKeywords.join(', ')}"`);
}

// Add UTF-8 BOM (\uFEFF) at the beginning so emojis can display properly
const csvContent = '\uFEFF' + rows.join('\n');
fs.writeFileSync(FILE_PATH, csvContent);
