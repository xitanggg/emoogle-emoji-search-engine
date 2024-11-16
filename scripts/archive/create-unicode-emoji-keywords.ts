import fs from 'fs';
import stringify from 'json-stringify-pretty-compact';

/**
 * Script to create the Unicode emoji keywords from the Unicode emoji data file
 */

/**
 * Unicode emoji data file URL. This is obtained from the following steps:
 * 1. Visit https://www.unicode.org/emoji/charts/
 * 2. Select "Emoji List"
 * 3. Select "Unicode Emoji data files" and redirect to https://unicode.org/Public/emoji/15.1/
 * 4. Copy link of "emoji-test.txt"
 */
const UNICODE_EMOJI_TEST_DATA_URL =
	'https://unicode.org/Public/emoji/15.1/emoji-test.txt';

const fetchText = async (url: string) => {
	const res = await fetch(url);
	const text = res.text();
	return text;
};

interface EmojiData {
	codePoints: string;
	status: string;
	emoji: string;
	version: string;
	name: string;
}

const createGroupToEmojiData = (emojiTestLines: string[]) => {
	const groupToEmojiData: Record<string, EmojiData[]> = {};
	let currentGroup = '';

	for (const line of emojiTestLines) {
		if (line.startsWith('# group:')) {
			currentGroup = line.split(': ')[1];
			groupToEmojiData[currentGroup] = [];
		}

		// Skip comments and empty lines
		if (line.startsWith('#') || line.trim() === '') {
			continue;
		}

		// Extract 5 props from each line: codePoints, status, emoji, version, name
		const [codePointsStatus, emojiVersionName] = line.split('# ');
		const codePointsStatusArray = codePointsStatus.split('; ');
		// codePoints (e.g. 1F600, 1F636 200D 1F32B FE0F)
		const codePoints = codePointsStatusArray[0].trim();
		// status (e.g. fully-qualified, minimally-qualified, unqualified)
		const status = codePointsStatusArray[1].trim();
		const emojiVersionNameArray = emojiVersionName.trim().split(' ');
		// emoji (e.g. 😀, 😶‍🌫)
		const emoji = emojiVersionNameArray[0].trim();
		// version (e.g. 1.0, 13.1)
		const version = emojiVersionNameArray[1].trim().slice(1);
		// name (e.g. grinning face, face in clouds)
		const name = emojiVersionNameArray.slice(2).join(' ');

		// Skip non fully-qualified emojis
		if (status !== 'fully-qualified') {
			continue;
		}

		// Only keep 1 emoji from each of the 4 family variants
		// This is because family emojis start become silhouette style in March 2024 for Mac
		// Reference: https://www.mobiletechjournal.com/the-family-emojis-are-now-equally-useless-for-everyone/
		if (name.includes('family')) {
			// Discard the family emoji as it is duplicated by "👨‍👩‍👦"
			if (name === 'family') {
				continue;
			}

			if (
				![
					'family: man, woman, boy', // parents with child
					'family: man, woman, girl, boy', // parents with children
					'family: woman, boy', // parent with child
					'family: woman, girl, boy', // parent with children
				].includes(name)
			) {
				continue;
			}
		}

		// Only keep the non skin tone variant emoji
		if (name.includes('skin tone')) {
			continue;
		}

		groupToEmojiData[currentGroup].push({
			codePoints,
			status,
			emoji,
			version,
			name,
		});
	}

	return groupToEmojiData;
};

/**
 * Rename some emojis with better names
 */
const getFinalEmojiName = (name: string) => {
	if (name === 'kiss') {
		name = 'kiss: person, person';
	} else if (name === 'couple with heart') {
		name = 'couple with heart: person, person';
	} else if (name === 'family: man, woman, boy') {
		name = 'family: parents, child';
	} else if (name === 'family: man, woman, girl, boy') {
		name = 'family: parents, children';
	} else if (name === 'family: woman, boy') {
		name = 'family: parent, child';
	} else if (name === 'family: woman, girl, boy') {
		name = 'family: parent, children';
	}
	return name;
};

(async () => {
	const emojiTestData = (await fetchText(
		UNICODE_EMOJI_TEST_DATA_URL
	)) as string;
	const emojiTestLines = emojiTestData.split('\n');
	const groupToEmojiData = createGroupToEmojiData(emojiTestLines);
	const emojiKeywords = Object.values(groupToEmojiData)
		.flat()
		.reduce(
			(acc, emojiData) => {
				acc[emojiData.emoji] = [getFinalEmojiName(emojiData.name)];
				return acc;
			},
			{} as Record<string, string[]>
		);
	fs.writeFileSync(
		'scripts/archive/unicode-emoji-keywords.json',
		stringify(emojiKeywords, { maxLength: 300, indent: 2 })
	);
})();
