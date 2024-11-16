// prettier-ignore
const PRONOUNS = [
    'i', 'you', 'he', 'she', 'it', 'we', 'they', // subject pronouns
    'me', 'you', 'him', 'her', 'it', 'us', 'them', // object pronouns
    'my', 'your', 'his', 'her', 'its', 'our', 'their', // possessive adjectives
    'mine', 'yours', 'his', 'hers', 'its', 'ours', 'theirs', // possessive pronouns (not used in emoji keywords)
    'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'themselves', 'yourselves', // reflexive pronouns (not used in emoji keywords)
    'this', 'that', 'these', 'those', // demonstrative pronouns
    'who', 'whom', 'which', 'what', // interrogative pronouns
];

// prettier-ignore
const PREPOSITIONS = [
    'about', 'across', 'after', 'against', 'along', 'among', 'around', 'as', 'at', // removed above
    'before', 'behind', 'beneath', 'beside', 'between', 'beyond', 'by', // removed below
    'despite', 'during', 'except', 'for', 'from', 'in', 'inside', 'into', 'near', // removed down, like
    'of', 'on', 'onto', 'out', 'outside', 'over', 'since', 'than', 'through', 'throughout', 'to', 'toward', // removed off
    'under', 'until', 'upon', 'via', 'with', 'within', 'without', // removed up
];

const CONJUNCTIONS = ['for', 'and', 'nor', 'but', 'or', 'yet', 'so'];

const ARTICLES = ['a', 'an', 'the'];

const PREDETERMINERS = ['all', 'both'];
const PREDETERMINERS_EXCEPTIONS_PREVIOUS_WORDS = ['calling'];

// prettier-ignore
const OTHERS = [
    'is', 'are', 'was', 'were', 'if', 'will', "would", 'be', 'being', 'one', 
    'have', 'has', 'had', 'can', 'more', 'then', 'do', "don't", 'first', 'even',
    'there', 'only', 'also', 'such', 'each', 'because', 'however', 'very',
    'must', 'due'];
// "not" is not included for now

const PRONOUNS_SET = new Set(PRONOUNS);
const PREPOSITIONS_SET = new Set(PREPOSITIONS);
const CONJUNCTIONS_SET = new Set(CONJUNCTIONS);
const ARTICLES_SET = new Set(ARTICLES);
const PREDETERMINERS_SET = new Set(PREDETERMINERS);
const PREDETERMINERS_EXCEPTIONS_PRE_WORDS_SET = new Set(
	PREDETERMINERS_EXCEPTIONS_PREVIOUS_WORDS
);
const OTHERS_SET = new Set(OTHERS);

/**
 * Filter out words that are pronouns, prepositions, conjunctions, articles or some others.
 */
export const filterPartsOfSpeech = (words: string[]) => {
	return words.filter((word, idx) => {
		const previousWord = words[idx - 1];
		return !(
			PRONOUNS_SET.has(word) ||
			PREPOSITIONS_SET.has(word) ||
			CONJUNCTIONS_SET.has(word) ||
			ARTICLES_SET.has(word) ||
			(PREDETERMINERS_SET.has(word) &&
				!PREDETERMINERS_EXCEPTIONS_PRE_WORDS_SET.has(previousWord)) ||
			OTHERS_SET.has(word)
		);
	});
};
