import { expect, test, describe } from 'vitest';
import {
	EMOJI_KEYWORDS,
	KEYWORD_MOST_RELEVANT_EMOJI,
	searchBestMatchingEmojis,
	searchEmojis,
	preProcessString,
} from './';
import { WORD_TO_TOP_1000_WORDS_IDX, type Options } from './constants';

const emojis = Object.keys(EMOJI_KEYWORDS);

test('preProcessString', () => {
	// Remove “”
	expect(preProcessString('Japanese “here” button')).toBe(
		'japanese here button'
	);

	// Remove :
	expect(preProcessString('person: blond hair')).toBe('person blond hair');

	// Remove ()
	expect(preProcessString('LLAP (live long and prosper)')).toBe(
		'llap live long and prosper'
	);

	// Remove .
	expect(preProcessString('Mrs. Claus')).toBe('mrs claus');

	// Remove ";,.!?
	expect(preProcessString('abc";,.!?def')).toBe('abcdef');

	// Replace - with space
	expect(preProcessString('upside-down face')).toBe('upside down face');

	// Replace ’ with '
	expect(preProcessString('twelve o’clock')).toBe("twelve o'clock");

	// Convert to lowercase
	expect(preProcessString('AI')).toBe('ai');
});

describe('searchEmojis - single word input - keyword match', () => {
	test('single word keyword exact match', () => {
		const singleWordInput = 'abacus';
		expect(EMOJI_KEYWORDS['🧮'][0]).toBe(singleWordInput);
		expect(searchEmojis(singleWordInput)).toContain('🧮');
	});

	test('single word keyword prefix match', () => {
		const singleWordInput = 'abacus';
		for (let idx = 1; idx < singleWordInput.length; idx++) {
			const prefixInput = singleWordInput.slice(0, idx);
			expect(searchEmojis(prefixInput, Infinity)).toContain('🧮');
		}
	});

	test('phrase/multiple words keyword exact match', () => {
		expect(EMOJI_KEYWORDS['🩹'][0]).toBe('adhesive bandage');

		let singleWordInput = 'adhesive';
		expect(searchEmojis(singleWordInput)).toContain('🩹');

		singleWordInput = 'bandage';
		expect(searchEmojis(singleWordInput)).toContain('🩹');
	});

	test('phrase/multiple words keyword prefix match', () => {
		const singleWordInputs = ['adhesive', 'bandage'];
		for (const singleWordInput of singleWordInputs) {
			for (let idx = 1; idx < singleWordInput.length; idx++) {
				const prefixInput = singleWordInput.slice(0, idx);
				expect(searchEmojis(prefixInput, Infinity)).toContain('🩹');
			}
		}
	});

	test('no match', () => {
		const unknownWord = 'abacusabacus';
		expect(searchEmojis(unknownWord)).toEqual([]);
	});

	test('customEmojiKeywords match', () => {
		const unknownWord = 'abacusabacus';
		expect(
			searchEmojis(unknownWord, undefined, {
				customEmojiKeywords: {
					'❓': [unknownWord],
				},
			})
		).toEqual(['❓']);
	});
});

describe('searchEmojis - single word input - ranking order', () => {
	const assertEmojiOrder = (firstEmoji: string, secondEmoji: string) => {
		expect(emojis.indexOf(firstEmoji)).toBeLessThan(
			emojis.indexOf(secondEmoji)
		);
	};

	const assertSearchOrder = (
		searchInput: string,
		firstEmoji: string,
		secondEmoji: string,
		options?: Options
	) => {
		const results = searchEmojis(searchInput, undefined, options);
		expect(results.indexOf(firstEmoji)).not.equal(-1);
		expect(results.indexOf(secondEmoji)).not.equal(-1);
		expect(results.indexOf(firstEmoji)).toBeLessThan(
			results.indexOf(secondEmoji)
		);
	};

	test('exact match ranks first', () => {
		// Default sort order is based on emoji order, so 🦾 then 🔑
		assertEmojiOrder('🦾', '🔑');

		expect(EMOJI_KEYWORDS['🦾']).toContain('accessibility');
		expect(EMOJI_KEYWORDS['🔑']).toContain('access');

		assertSearchOrder('access', '🔑', '🦾');
	});

	test('exact match ranks first (phrase)', () => {
		assertEmojiOrder('💪', '🧴');

		expect(EMOJI_KEYWORDS['💪']).toContain('bodybuilding');
		expect(EMOJI_KEYWORDS['🧴']).toContain('body wash');

		assertSearchOrder('body', '🧴', '💪');
	});

	test('exact match - most relevant emoji ranks first', () => {
		assertEmojiOrder('🏠', '📍');

		expect(EMOJI_KEYWORDS['🏠']).toContain('address');
		expect(EMOJI_KEYWORDS['📍']).toContain('address');

		assertSearchOrder('address', '📍', '🏠');
	});

	test('exact match - custom most relevant emoji ranks first', () => {
		assertEmojiOrder('🏠', '📍');

		expect(EMOJI_KEYWORDS['🏠']).toContain('address');
		expect(EMOJI_KEYWORDS['📍']).toContain('address');
		expect(KEYWORD_MOST_RELEVANT_EMOJI['address']).toBe('📍');

		assertSearchOrder('address', '🏠', '📍', {
			customKeywordMostRelevantEmoji: {
				address: '🏠',
			},
		});
	});

	test('exact match - emoji name keyword ranks first', () => {
		assertEmojiOrder('🤘', '🪨');

		expect(EMOJI_KEYWORDS['🤘']).toContain('rock');
		expect(EMOJI_KEYWORDS['🪨'][0]).toBe('rock');

		assertSearchOrder('rock', '🪨', '🤘');
	});

	test('exact match - single word keyword ranks first', () => {
		// Default sort order is based on emoji order, so 🦣 then 🏛️
		assertEmojiOrder('🦣', '🏛️');

		expect(EMOJI_KEYWORDS['🦣']).toContain('ancient animal');
		expect(EMOJI_KEYWORDS['🏛️']).toContain('ancient');

		assertSearchOrder('ancient', '🏛️', '🦣');
	});

	test('prefix match - sorted by recently searched input', () => {
		// help is sorted alphabetically after hello but ranks higher in top 1000 words
		expect('help' > 'hello');
		expect(
			WORD_TO_TOP_1000_WORDS_IDX['help'] < WORD_TO_TOP_1000_WORDS_IDX['hello']
		);

		expect(EMOJI_KEYWORDS['🤝']).toContain('help');
		expect(EMOJI_KEYWORDS['👋']).toContain('hello');

		assertSearchOrder('h', '🤝', '👋');
		assertSearchOrder('h', '👋', '🤝', { recentlySearchedInputs: ['hello'] });
	});

	test('prefix match - single word keyword ranks first', () => {
		assertEmojiOrder('😑', '♠️');

		expect(WORD_TO_TOP_1000_WORDS_IDX['poker'] === undefined);

		expect(EMOJI_KEYWORDS['😑']).toContain('poker face');
		expect(EMOJI_KEYWORDS['♠️']).toContain('poker');

		assertSearchOrder('poke', '♠️', '😑');
	});

	test('prefix match - sorted by top 1000 words', () => {
		// help is sorted alphabetically after hello but ranks higher in top 1000 words
		expect('help' > 'hello');
		expect(
			WORD_TO_TOP_1000_WORDS_IDX['help'] < WORD_TO_TOP_1000_WORDS_IDX['hello']
		);

		expect(EMOJI_KEYWORDS['🤝']).toContain('help');
		expect(EMOJI_KEYWORDS['👋']).toContain('hello');

		assertSearchOrder('h', '🤝', '👋');
	});

	test('prefix match - sorted alphabetically', () => {
		assertEmojiOrder('🏛️', '📏');

		expect(WORD_TO_TOP_1000_WORDS_IDX['architecture'] === undefined);
		expect(WORD_TO_TOP_1000_WORDS_IDX['architect'] === undefined);

		expect(EMOJI_KEYWORDS['🏛️']).toContain('architecture');
		expect(EMOJI_KEYWORDS['📏']).toContain('architect');

		assertSearchOrder('archit', '📏', '🏛️');
	});

	test('prefix match - most relevant emoji ranks first', () => {
		assertEmojiOrder('🏠', '📍');

		expect(EMOJI_KEYWORDS['🏠']).toContain('address');
		expect(EMOJI_KEYWORDS['📍']).toContain('address');

		assertSearchOrder('addre', '📍', '🏠');
	});

	test('prefix match - custom most relevant emoji ranks first', () => {
		assertEmojiOrder('🏠', '📍');

		expect(EMOJI_KEYWORDS['🏠']).toContain('address');
		expect(EMOJI_KEYWORDS['📍']).toContain('address');
		expect(KEYWORD_MOST_RELEVANT_EMOJI['address']).toBe('📍');

		assertSearchOrder('addre', '🏠', '📍', {
			customKeywordMostRelevantEmoji: {
				address: '🏠',
			},
		});
	});
});

describe('searchEmojis - phrase/multiple words input - keyword match', () => {
	test('multiple words keyword match', () => {
		const phraseInput = 'grinning face';
		expect(EMOJI_KEYWORDS['😀']).toContain('grinning face');
		expect(searchEmojis(phraseInput)).toContain('😀');
	});

	test('multiple words keyword match (subset)', () => {
		const phraseInput = 'grinning face';
		expect(EMOJI_KEYWORDS['😄']).toContain('grinning face with smiling eyes');
		expect(searchEmojis(phraseInput)).toContain('😄');
	});

	test('jointed keywords match', () => {
		const phraseInput = 'wow amazing';
		expect(EMOJI_KEYWORDS['🤩']).toContain('wow');
		expect(EMOJI_KEYWORDS['🤩']).toContain('amazing');
		expect(searchEmojis(phraseInput)).toContain('🤩');
	});
});

describe('searchBestMatchingEmojis - keyword match', () => {
	test('single word input', () => {
		const wordInput = 'raining';
		expect(EMOJI_KEYWORDS['🌧️']).toContain(wordInput);
		expect(searchBestMatchingEmojis(wordInput)).toContain('🌧️');
	});

	test('phrase input', () => {
		const phraseInput = 'cloud with rain';
		expect(EMOJI_KEYWORDS['🌧️']).toContain(phraseInput);
		expect(searchBestMatchingEmojis(phraseInput)).toContain('🌧️');
	});

	test('phrase input variation', () => {
		const phraseInput = 'precipitation weather';
		expect(EMOJI_KEYWORDS['🌧️']).toContain('precipitation');
		expect(EMOJI_KEYWORDS['🌧️']).toContain('weather');
		expect(searchBestMatchingEmojis(phraseInput)).toContain('🌧️');
	});

	test('stem word match', () => {
		const wordInput = 'rained';
		expect(EMOJI_KEYWORDS['🌧️']).toContain('raining');
		expect(EMOJI_KEYWORDS['🌧️']).not.toContain(wordInput);
		expect(searchBestMatchingEmojis(wordInput)).toContain('🌧️');
	});
});

describe('README example', () => {
	test('Basic usage', () => {
		expect(searchEmojis('amazing')).toEqual(['🤩', '💯', '🙌', '🌈']);
	});

	test('With max limit', () => {
		const maxLimit = 2; // Default is 24
		expect(searchEmojis('amazing', maxLimit)).toEqual(['🤩', '💯']);
	});

	test('Personalize with custom emoji keywords', () => {
		const customEmojiKeywords = {
			'🏆': ['amazing'],
		};
		expect(searchEmojis('amazing', undefined, { customEmojiKeywords })).toEqual(
			['🤩', '💯', '🙌', '🌈', '🏆']
		);
	});

	test('Personalize with user preferred keyword to emoji', () => {
		const customKeywordMostRelevantEmoji = {
			amazing: '💯',
		};
		expect(
			searchEmojis('amazing', undefined, { customKeywordMostRelevantEmoji })
		).toEqual(['💯', '🤩', '🙌', '🌈']);
	});

	test('Personalize with user recently searched inputs', () => {
		expect(searchEmojis('h', 4)).toEqual(['🤝', '🙏', '🆘', '📈']);
		const recentlySearchedInputs = ['hello'];
		expect(searchEmojis('h', 4, { recentlySearchedInputs })).toEqual([
			'👋',
			'🫂',
			'🤝',
			'🙏',
		]);
	});

	test('Search for best match', () => {
		const maxLimit = 4; // Default is 24
		expect(searchBestMatchingEmojis('hello world', maxLimit)).toEqual([
			'👋',
			'🫂',
			'🌍',
			'🌎',
		]);
	});

	test('Emoji keywords', () => {
		const [firstEmoji, firstEmojiKeywords] = Object.entries(EMOJI_KEYWORDS)[0];
		expect(firstEmoji).toBe('😀');
		expect(firstEmojiKeywords).toEqual(
			expect.arrayContaining([
				'grinning face',
				'happy',
				'smile',
				'joy',
				'cheerful',
			])
		);
	});
});
