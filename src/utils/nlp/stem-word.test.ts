import { test, expect } from 'vitest';
import { CUSTOM_RULES, stemWord } from './stem-word';

const CUSTOM_RULES_TEST_CASES = [
	['happy', 'happy'],
	['DIY', 'DIY'],
	['crying', 'cry'],
	['carryings', 'carry'],
	['smiling', 'smil'],
	['codings', 'cod'],
	['blazingly', 'blaz'],
	['disability', 'disabi'],
	['capabilities', 'capabi'],
	['candys', 'candy'],
	['coolest', 'cool'],
];

test.each(CUSTOM_RULES_TEST_CASES)(
	'stemWord(%s) === %s',
	(word, expectedStemmedWord) => {
		const stemmedWord = stemWord(word);
		expect(stemmedWord).toBe(expectedStemmedWord);
	}
);

test('# of test cases matches', () => {
	expect(CUSTOM_RULES.length === CUSTOM_RULES_TEST_CASES.length).toBe(true);
});
