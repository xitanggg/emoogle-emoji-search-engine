import fs from 'fs';
import stringify from 'json-stringify-pretty-compact';
import untypedUnicodeEmojiKeywords from './unicode-emoji-keywords.json';

/**
 * Script to supplement the Unicode emoji keywords with additional CLDR emoji keywords
 */

const unicodeEmojiKeywords = untypedUnicodeEmojiKeywords as Record<
	string,
	string[]
>;

/**
 * CLDR repo (English annotation)
 * https://github.com/unicode-org/cldr-json/blob/c62b6e101f0369acb4abd44de34a75acb224cbc1/cldr-json/cldr-annotations-full/annotations/en/annotations.json
 */
const CLDR_DATA_URL =
	'https://raw.githubusercontent.com/unicode-org/cldr-json/c62b6e101f0369acb4abd44de34a75acb224cbc1/cldr-json/cldr-annotations-full/annotations/en/annotations.json';

const fetchJson = async (url: string) => {
	const res = await fetch(url);
	const text = await res.json();
	return text;
};

interface EmojiData {
	default: string[]; // Keywords
	tts: string; // Text-to-Speech or short name
}

type CLDREmojiData = Record<string, EmojiData>;

interface CLDRData {
	annotations: {
		annotations: CLDREmojiData;
	};
}

const getEmojiData = (
	cldrEmojiData: CLDREmojiData,
	unicodeEmoji: string,
	name: string,
	nameToCldrEmoji: Record<string, string>
) => {
	let emojiData = cldrEmojiData[unicodeEmoji];
	if (!emojiData) {
		if (name === 'kiss: person, person') {
			name = 'kiss';
		} else if (name === 'couple with heart: person, person') {
			name = 'couple with heart';
		}
		emojiData = cldrEmojiData[nameToCldrEmoji[name]];
	}
	return emojiData;
};

(async () => {
	const cldrData = (await fetchJson(CLDR_DATA_URL)) as CLDRData;
	const cldrEmojiData = cldrData.annotations.annotations;
	const nameToCldrEmoji = Object.entries(cldrEmojiData).reduce(
		(acc, [emoji, emojiData]) => {
			acc[emojiData.tts] = emoji;
			return acc;
		},
		{} as Record<string, string>
	);

	const cldrEmojiKeywords = JSON.parse(JSON.stringify(unicodeEmojiKeywords));

	let numberEmojiNotFoundInCLDR = 0;
	Object.entries(unicodeEmojiKeywords).forEach(([unicodeEmoji, keywords]) => {
		const name = keywords[0];
		const emojiData = getEmojiData(
			cldrEmojiData,
			unicodeEmoji,
			name,
			nameToCldrEmoji
		);
		if (emojiData) {
			const newEmojiKeywords = emojiData.default.filter(
				(keyword) =>
					!name.startsWith(keyword) &&
					!name.split(' ').some((word) => word.startsWith(keyword))
			);
			cldrEmojiKeywords[unicodeEmoji].push(...newEmojiKeywords);
		} else {
			numberEmojiNotFoundInCLDR++;
		}
	});

	fs.writeFileSync(
		'scripts/archive/cldr-emoji-keywords.json',
		stringify(cldrEmojiKeywords, { maxLength: 300, indent: 2 })
	);
	console.log(
		`Number of emojis not found in CLDR: ${numberEmojiNotFoundInCLDR}`
	);
})();
