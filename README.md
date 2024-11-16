# 🐶Emoogle Emoji Search Engine

Emoogle Emoji Search Engine is the ultimate open-source emoji search engine that provides a set of simple and powerful utils that allow people to easily find the emojis they want and use emojis joyfully.

It is created by and powers [Emoogle](https://www.emoogle.org/), the best emoji desktop app for emoji fans.

<img src="https://i.ibb.co/cbbsynq/emoogle-emoji-picker.gif" alt="Emoogle Emoji Picker" width="298"/>

(Demo with the [Emoogle Emoji Picker](https://github.com/xitanggg/emoogle-emoji-picker))

## ✨Features

- 🗃️World's largest emoji keywords database with 5,400+ unique keywords for 1,872 emojis in ~200kb bundle size
- 🏆Advanced ranking algorithm with 10+ rules to sort most relevant results first
- ⚡Blazingly fast search-as-you-type experience (~10ms on Intel i7 @ 2.6GHz, ~5ms on Apple M2)
- ⚙️Customizable options to personalize search experience
  - Including custom keywords, user preferred most relevant emoji and user recently searched inputs
- 💻Work locally and run offline
- ⛓️‍💥No dependencies
- ✅Available in ES Module and CommonJS
- 🔖[Emoji v15.1](https://unicode.org/Public/emoji/15.1/emoji-test.txt)

⚠️Limitation: only works for English words

## ❓How it works

### 🔍Search engine

At its core, the emoji search engine contains two key components: 1. keyword database, and 2. ranking algorithm. When given an input query, the search engine first loops through all emojis and their keywords in the keyword database to search for matching emojis and then sorts the matching emojis using the ranking algorithms before returning the results - all while happening blazingly fast.

### 🗃️Keyword database

The Emoogle keyword database is the world's largest emoji keywords database with 5,400+ unique keywords for 1,872 emojis. It was first created with [Unicode's CLDR emoji keywords list](https://github.com/unicode-org/cldr-json/blob/c62b6e101f0369acb4abd44de34a75acb224cbc1/cldr-json/cldr-annotations-full/annotations/en/annotations.json) and then manually curated from various sources, including top 1,000 frequently used English words from the [Word frequency data](https://www.wordfrequency.info/samples.asp) and books, to ensure common day to day words are mapped to emojis.

### 🏆Ranking algorithm

The ranking algorithm ranks the search results and sorts the most relevant results first. When comparing the ranks of 2 emojis, it functions similarly to the [Algolia's tie-breaking algorithm](https://www.algolia.com/doc/guides/managing-results/must-do/custom-ranking/#how-tie-breaking-works) and checks rule iteratively until there is a break, in which case the emoji that meets the rule ranks higher. The ranking algorithm contains 10+ ranking rules. For the primary use case where the input is a single word, there are 7 key rules. The below table lists these 7 rules with examples to demonstrate ranking orders

| <div style="width:320px">**Ranking Rule**</div>                                 | **Example**                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Exact match ranks higher than prefix match**                               | “arm” matches 3 emojis: 💪 (arm), 🛡️ (armour), 🪖 (army). 💪 (**arm**) ranks higher because it is an exact match, while 🛡️ (**arm**our) and 🪖 (**arm**y) are prefix matches.                                                                                                                                                                                       |
| **2. Default most relevant emoji ranks higher**                                 | "clean" exactly matches 4 emojis: 🛀, 🚿, 🧹, 🧼. 🧹 ranks higher because clean is more commonly refers to cleaning rooms and spaces than showering. This ranking is based on a curated list of default most relevant emoji for keywords. See emoogle-keyword-most-relevant-emoji.json for the full list of 500+ most relevant keyword to emoji match.              |
| **3. User preferred most relevant emoji ranks higher**                          | This rule is similar to the previous one and allows user preference to take higher precedence over the default most relevant emoji to personalize search result. Using the same example of the input word “clean”, say a user prefers using the 🧼 emoji to denote it, 🧼 would rank first in the result.                                                           |
| **4. Keyword in emoji name ranks higher**                                       | “1” matches 1️⃣, ☝️, 🕐. 1️⃣ ranks higher, because it’s emoji name “keycap: 1” contains “1”.                                                                                                                                                                                                                                                                          |
| **5. Single word keyword ranks higher than phrase keyword with multiple words** | “bookmark” matches 🔖(bookmark) and 📑 (bookmark tabs). 🔖 ranks higher because it has 1 word only.                                                                                                                                                                                                                                                                 |
| **6. Keyword that is more commonly used ranks higher (Prefix match only)**      | “h” matches and ranks 🤝(**h**elp), 📈(**h**igh), 🏠(**h**ome) higher than 💧(**h**2o), 😆(**h**aha), 💇(**h**aircut), because the formers follow the order of the top 1000 words by usage frequency top-1000-words-by-frequency.json, a subset list derived from the free top 5000 words of the [Word frequency data](https://www.wordfrequency.info/samples.asp). |
| **7. Keyword that is recently searched ranks higher (Prefix match only)**       | This rule is similar to the previous one and allows user's recent usage to take higher precedence over the common usage to personalize search result. Using the same example of the input “h”, say a user recently searches and uses “hello” 👋, “h” would rank 👋(**h**ello) first followed by 🤝(**h**elp), 📈(**h**igh), 🏠(**h**ome).                           |

A more detailed walkthrough of how the Emoogle Emoji Search Engine is built can be found in the blog post [🔍Building The Best Emoji Search Engine](https://emoogle.org/blog/building-the-best-emoji-search-engine).

## 📦Installation

```bash
npm install emoogle-emoji-search-engine
```

## 📖Usage

**Examples** - perfect for search-as-you-type use case

```typescript
import { searchEmojis } from 'emoogle-emoji-search-engine';

// Basic usage
searchEmojis('amazing');
// => ['🤩', '💯', '🙌', '🌈']

// With max limit
const maxLimit = 2; // Default is 24
searchEmojis('amazing', maxLimit);
// => ['🤩', '💯']

// Personalize with custom emoji keywords
const customEmojiKeywords = {
	'🏆': ['amazing'],
};
searchEmojis('amazing', undefined, { customEmojiKeywords });
// => ['🤩', '💯', '🙌', '🌈', '🏆']

// Personalize with user preferred keyword to emoji
const customKeywordMostRelevantEmoji = {
	amazing: '💯',
};
searchEmojis('amazing', undefined, { customKeywordMostRelevantEmoji });
// => ['💯', '🤩', '🙌', '🌈']

// Personalize with user recently searched inputs
searchEmojis('h', 4);
// => ['🤝', '🙏', '🆘', '📈']
const recentlySearchedInputs = ['hello'];
searchEmojis('h', 4, { recentlySearchedInputs });
// => ['👋', '🫂', '🤝', '🙏']
```

**Search for best match examples** - great for phrases or sentences matching

```typescript
import { searchBestMatchingEmojis } from 'emoogle-emoji-search-engine';

const maxLimit = 4; // Default is 24
searchBestMatchingEmojis('hello world', maxLimit);
// => ['👋', '🫂', '🌍', '🌎']
```

**Emoji keywords database example** - if you need access to the keyword database

```typescript
import { EMOJI_KEYWORDS } from 'emoogle-emoji-search-engine';

const [firstEmoji, firstEmojiKeywords] = Object.entries(EMOJI_KEYWORDS)[0];
// firstEmoji => 😀
// firstEmojiKeywords => ['grinning face', 'happy', 'smile', 'joy', 'cheerful', ...]
```

## 📁Project Structure

| <div style="width:150px">**Code Path**</div> | **Description**                                                                                                                                                                                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| /src/search-emojis.ts                        | Code entry point to the 2 main emoji search engine utils: `searchEmojis`, `searchBestMatchingEmojis`                                                                                                                                                                           |
| /src/utils                                   | Folder with utils for word pre-processing and nlp operations, e.g. parts of speech, [Snowball stemming](https://github.com/snowballstem/snowball-website/blob/main/js/base-stemmer.js)                                                                                         |
| /data                                        | Folder for various data files <ul><li>emoogle-emoji-keywords.json - Emoogle emoji keywords database</li><li>emoogle-keyword-most-relevant-emoji.json - Default most relevant keyword to emoji mapping</li></ul>                                                                |
| /scripts                                     | Folder for various scripts <ul><li>search-emojis-cli.ts - script to do one off search in cli for testing, e.g. `npm run search hello` </li><li>print-emoji-stats.ts - script to compute the number of unique keywords in the emoji keywords database `npm run stats`</li></ul> |

## 🫶Contribution

**Emoji keywords database**

While the emoji keywords database contains 5,400+ unique keywords, the average person speaks much more words, ranging from 7k to 20k words according to [wordmetrics.org](https://worldmetrics.org/average-words-spoken-per-day/).

If you notice a keyword missing for an emoji, feel free to help improve it and add it to the database.

If you prefer to contribute with a simple no code solution, you can simply add the keyword to the [database spreadsheet](https://emoogle.org/database), which will sync with this repo on a recurring basis.

If you prefer to update in code, you can update `emoogle-emoji-keywords.json` directly. Before submitting a PR, please kindly run the glossary script `npm run glossary` to regenerate `emoogle-emoji-glossary.json` and `alphabet-glossary.json`, which map the keywords/alphabets to search emojis results. These two files serve as a snapshot result and should also be updated, so we can compare and verify the changes in search results when adding new emoji keywords or updating the search engine algorithm.

## ⚖️License

MIT License

## 🐶Sponsor

<img src="https://i.ibb.co/9ZPNhzS/emoogle.gif" alt="Emoogle" width="275"/>

Emoogle Emoji Search Engine is created as the core search engine to power [Emoogle](https://www.emoogle.org/), the best emoji desktop app for emoji fans.

At Emoogle, we believe that emoji enables us to be more expressive and add fun, color, and personality to the internet. If you’re as excited about emoji as we are, give [Emoogle](https://www.emoogle.org/) a try and let’s make the internet more fun and expressive together🙌
