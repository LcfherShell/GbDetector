# 🎰 GbDetector Documentation

## 📌 Overview

**GbDetector** is an advanced text analysis module designed to identify gambling-related content through pattern matching and sophisticated text processing. It is encapsulated in an Immediately Invoked Function Expression (IIFE) to prevent global namespace pollution, offering a clean API for text analysis.

## 🎯 Purpose

This module assists in detecting potential gambling-related content in text, making it useful for content moderation, compliance monitoring, and filtering systems. It leverages various detection mechanisms to identify both overt and obfuscated gambling-related text.

## 🌟 Key Features

* Text normalization and cleaning ✨
* Detection of obfuscated gambling terminology 🕵️‍♂️
* Pattern matching for gambling-related keywords 🎲
* Leet-speak and character substitution handling 🔤
* URL pattern detection 🌐
* Custom keyword list and blocklist support 📃
* Evasion technique detection 🧩
* Contextual indicator analysis 📖
* Contact info extraction 📞
* Multi-language support 🌍
* Fuzzy search detection 🔍

## 🧭 Architecture Flow Diagram

```
[INPUT TEXT] → [INITIAL PREPROCESSING]
       ↓
[GARBAGE/REPETITION CHECK] → [URL PATTERN CHECK]
       ↓
[TEXT NORMALIZATION] → [WORD RECONSTRUCTION]
       ↓
[NUMBER MERGING] → [BLOCKLIST CHECK]
       ↓
[PATTERN MATCHING] → [LEET-SPEAK CONVERSION]
       ↓
[KEYWORD MATCHING] → [CONFIDENCE SCORING]
       ↓
[OUTPUT RESULT]
```

## 🧠 Detection Algorithm

1. **Preprocessing**:

   * Convert newlines to spaces
   * Normalize whitespace
   * Add spaces around dots

2. **Initial Checks**:

   * Detect excessive non-alphanumeric ("garbage") characters
   * Identify abnormal repetition patterns
   * Detect suspicious URL patterns
   * Detect suspicious code or emoji sequences

3. **Evasion Technique Analysis**:

   * Identify evasion methods
   * Score based on detected techniques

4. **Contextual Indicator Detection**:

   * Analyze text context for gambling cues
   * Score based on found indicators

5. **Contact Info Extraction**:

   * Identify and extract potential contact information

6. **Text Normalization**:

   * Remove diacritics and standardize characters
   * Reconstruct intentionally split words
   * Merge numbers with preceding words

7. **Language Pattern Detection**:

   * Apply language-specific pattern checks
   * Score based on matches

8. **Domain Matching**:

   * Check domains in text against blocklist
   * Consider domain format variations

9. **Multi-pass Pattern Matching**:

   * Apply standard and custom regex patterns
   * Detect with varying strictness levels
   * Convert leet-speak with adjustable digit ignore
   * Perform fuzzy matching for obfuscated terms

10. **Supporting Keyword Analysis**:

    * Detect supporting keywords post-pattern match
    * Add bonus based on keyword match count

11. **Content Length & Complexity Analysis**:

    * Count metrics like word/character totals, average word length
    * Identify spammy gambling content characteristics

12. **Final Evaluation**:

    * Normalize checkpoint scores by sensitivity factor
    * Determine confidence level: none, low, medium, high
    * Generate a detailed analysis report if requested

## 🧩 Core Functions

### `detect(text = "", options = {})`

Main function for detecting gambling patterns in text.

**Parameters:**

* `text` *(string)*: The text to be analyzed
* `options` *(object)*: Configuration options

  * `keywords`: Pattern terms to detect (e.g., site names)
  * `supportKeywords`: Supporting keyword list
  * `domains`: List of domains to detect
  * `allowlist`: Whitelisted terms
  * `sensitivityLevel`: Detection sensitivity (1–5, default 3)
  * `includeAnalysis`: Include detailed analysis in results
  * `detectRepetition`, `detectUrlPatterns`, `detectEvasionTechniques`, `detectContextualIndicators`: Boolean toggles for specific detection types
  * `extractContactInfo`: Whether to extract contact info
  * `language`: Language selection ('en', 'id', 'all')
  * `debug`: Show debug info

**Returns:**
An object with detection results:

* `isGambling` *(boolean)*: Whether gambling content is detected
* `confidence` *(string)*: "none", "low", "medium", or "high"
* `checkpoint` *(number)*: Numerical detection score
* `details` *(string)*: Human-readable explanation
* `comment` *(string)*: Original analyzed text
* `analysis` *(object, optional)*: Detailed analysis info

### 🧹 Text Processing

* `cleanText(text)` – Normalize and clean text
* `cleanWeirdPatterns(text)` – Remove odd spacing and punctuation
* `reconstructSeparatedWords(text)` – Reconstruct deliberately split words
* `mergeTextWithTrailingNumbers(text)` – Merge numbers trailing words

### 🧠 Detection Logic

* `isMostlyAsciiGarbage(text, threshold = 0.45)` – Detect non-alphanumeric spam
* `hasAbnormalRepetition(text)` – Detect character/pattern repetition
* `hasSuspiciousUrlPatterns(text)` – Detect obfuscated URLs
* `hasSuspiciousCodeSequences(text)` – Detect suspicious symbols/emoji
* `convertCommentFixed(comment, ignoreLastDigits = 0)` – Convert symbols to characters
* `fuzzySearch(keywords, text)` – Perform fuzzy keyword match

### 🔬 Advanced Analysis

* `analyzeEvasionTechniques(text)`
* `detectContextualGamblingIndicators(text)`
* `extractContactInfos(text)`
* `detectLanguageSpecificPatterns(text, language)`

### 📐 Pattern Matching

* `createPatternRegex(terms, loose = false)` – Create RegExp pattern
* `TinyPatternRegex(terms)` – Create focused RegExp pattern

## 🧮 Mathematical Formulas

### 🎯 Confidence Threshold Calculation

```js
sensitivityFactor = Math.max(1, Math.min(5, sensitivityLevel)) / 3

confidenceThresholds = {
  low: Math.max(0.45, 0.5 * sensitivityFactor),
  medium: Math.max(0.9, 0.8 * sensitivityFactor),
  high: Math.max(1.2, 2.5 * sensitivityFactor)
}
```

### 🧠 Keyword Bonus Calculation

```js
keywordBonus = Math.min(1.5, 0.03 * (keywordMatchCount/2) + 0.7)
```

### 🧹 Garbage Character Ratio

```js
garbageRatio = numberOfGarbageCharacters / totalTextLength
isGarbage = garbageRatio >= threshold (default 0.45)
```

## 💡 Usage Example

```javascript
const examples = [
  "sl0t88 maxwin guaranteed win!",
  "J4ckp0t Zeus99 trusted - sign up now!",
  "c a s i n o online with credit & e-wallet deposit",
  "best online gambling site slot gacor maxwin today",
  "Get rich quick with winning bets at my-gambling-site.com",
  "This is a normal sentence with no gambling content.",
  "Z.e.u.s g.a.c.o.r m.a.x.w.i.n",
  "j*u*d*i o*n*l*i*n*e biggest site"
];

const customConfig = {
  keywords: ["win", "maxwin", "deposit", "withdraw", "gacor"],
  supportKeywords: ["jp", "jackpot", "slot", "judi", "casino"],
  domains: ["scamsite.com", "badword"],
  allowlist: ["normal", "common"],
  sensitivityLevel: 3,
  includeAnalysis: true,
  detectRepetition: true,
  detectUrlPatterns: true,
  detectEvasionTechniques: true,
  detectContextualIndicators: true,
  extractContactInfo: true,
  language: 'all',
  debug: true
};

console.log("=== TESTING EXAMPLES ===");
examples.forEach((example, index) => {
  console.log(`\nExample ${index + 1}: "${example}"`);
  // run detection logic here
});
```

## 🃏 Default Keywords

**GbDetector** comes with a comprehensive set of default keywords for various gambling-related terms in both English and Indonesian:

**🔑 Primary Keywords**:

```javascript
[
  "slot", "casino", "jack", "zeus", "scatter", "toto", "judol", "jodol",
  "poker", "roulette", "betting", "gamble", "joker"
]
```

**🛠️ Supporting Keywords**:

* English gambling terms: `wdp`, `wd`, `win`, `happy`, `joyful`, `rich`, `trustworthy`, `lucky`, `trust`, etc.
* Indonesian gambling terms: `menang`, `senang`, `gacor`, `gembira`, `kaya`, `pasti dapat`, `bangga`, `panen`, etc.

## 📄 License

MIT License
© 2025 Ramsyan-Tungga

## ✅ Conclusion

The **GbDetector** module offers a powerful solution for identifying gambling-related content in text, even when obfuscated. By combining various detection techniques and offering extensive configuration options, the module achieves high accuracy while minimizing false positives. Its modular design ensures easy integration into different systems requiring content moderation or filtering capabilities.
