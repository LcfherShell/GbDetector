# GbDetector Documentation

## Overview
GbDetector is an advanced text analysis module designed to identify gambling-related content through sophisticated pattern matching and text processing techniques. The module is encapsulated in an Immediately Invoked Function Expression (IIFE) to prevent global namespace pollution, providing a clean API for text analysis.

## Purpose
This module helps detect potential gambling-related content in text, which can be useful for content moderation, compliance monitoring, and filtering systems. It employs various detection mechanisms to identify both obvious and obfuscated gambling-related text.

## Core Features
- Text normalization and cleaning
- Detection of obfuscated gambling terminology
- Pattern matching for gambling-related keywords
- Identification of leet-speak and character substitutions
- URL pattern detection
- Support for custom keyword lists and blocklists

## Architecture Flowchart

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
[KEYWORD MATCHING] → [CONFIDENCE CALCULATION]
       ↓
[OUTPUT RESULT]
```

## Detection Algorithm

1. **Preprocessing**: Convert newlines to spaces, normalize spaces
2. **Initial Checks**: 
   - Check for excessive non-alphanumeric characters ("garbage")
   - Check for abnormal repetitive patterns
   - Check for suspicious URL patterns
3. **Text Normalization**:
   - Remove diacritics and standardize characters
   - Reconstruct deliberately separated words
   - Merge trailing numbers with preceding words
4. **Pattern Matching**:
   - Apply standard pattern regex
   - Apply custom pattern regex
   - Apply loose pattern regex
5. **Leet-Speak Detection**:
   - Convert numbers and symbols to letters
   - Clean unusual patterns from text
6. **Keyword Analysis**:
   - Check for supporting gambling keywords
   - Filter against allowlist/blocklist
7. **Confidence Scoring**:
   - Calculate checkpoint score based on detection results
   - Determine confidence level (none, low, medium, high)

## Key Functions

### Text Processing

#### `cleanText(text)`
Normalizes and cleans text by removing diacritics and standardizing characters.
```javascript
function cleanText(text) ...
```

#### `cleanWeirdPatterns(text)`
Cleans text by removing odd patterns like excessive spaces and unnecessary punctuation.
```javascript
function cleanWeirdPatterns(text) ...
```

#### `reconstructSeparatedWords(text)`
Attempts to reconstruct words that may have been deliberately separated.
```javascript
function reconstructSeparatedWords(text) ...
```

### Detection Logic

#### `isMostlyAsciiGarbage(text, threshold = 0.6)`
Checks if text contains mostly non-alphanumeric ASCII symbols.
```javascript
function isMostlyAsciiGarbage(text, threshold = 0.6) ...
```

#### `hasAbnormalRepetition(text, threshold = 0.4)`
Checks if text contains unusually repetitive characters or patterns.
```javascript
function hasAbnormalRepetition(text, threshold = 0.4) ...
```

#### `hasSuspiciousUrlPatterns(text)`
Detects suspicious URL patterns that might be obfuscated.

#### `convertCommentFixed(comment, ignoreLastDigits = 0)`
Converts numbers and symbols to letters in words based on a substitution map.

### Pattern Matching

#### `createPatternRegex(terms, loose = false)`
Creates a RegExp pattern from an array of terms.
```javascript
function createPatternRegex(terms, loose = false) ...
```

### Main Detection Function

#### `detect(text = "", options = {})`

**Parameters:**

* `text` (string): The text to analyze
* `options` (object): Configuration options

  - `keywords` (string\[]): List of pattern terms to detect \[name site]
  - `supportKeywords` (string\[]): List of supportKeywords to detect
  - `domains` (string\[]): List of domains to detect
  - `allowlist` (string\[]): List of terms that should be allowed even if matched
  - `sensitivityLevel` (number): Detection sensitivity (1–5, default is 3)
  - `includeAnalysis` (boolean): Whether to include detailed analysis in results
  - `detectRepetition` (boolean): Whether to detect abnormal repetition
  - `detectUrlPatterns` (boolean): Whether to detect suspicious URL patterns
  - `detectEvasionTechniques` (boolean): Whether to detect evasion techniques
  - `detectContextualIndicators` (boolean): Whether to detect contextual indicators
  - `extractContactInfo` (boolean): Whether to extract contact information
  - `language` (string): Language to analyze ('en', 'id', 'all')
  - `debug` (boolean): Whether to output debug information


**Returns:**
An object containing detection results:
- `isGambling` (boolean): Whether gambling content was detected
- `confidence` (string): Confidence level ("none", "low", "medium", "high")
- `checkpoint` (number): Numerical score representing detection certainty
- `details` (string): Human-readable description of detection result
- `comment` (string): Original text analyzed
- `analysis` (object, optional): Detailed analysis information if requested

## Mathematical Formulas

### Confidence Threshold Calculation
```
sensitivityFactor = max(1, min(5, sensitivityLevel)) / 3

confidenceThresholds = {
  low: 0.5 * sensitivityFactor,
  medium: 0.8 * sensitivityFactor,
  high: 2.5 * sensitivityFactor
}
```

### Garbage Character Ratio
```
garbageRatio = numberOfGarbageCharacters / totalTextLength
isGarbage = garbageRatio >= threshold (default 0.6)
```

### Keyword Match Bonus Calculation
```
keywordBonus = min(1.5, 0.3 * keywordMatchCount + 0.7)
```

## Usage Example

```javascript
// Basic usage
// Example usage with various options
const examples = [
  "sl0t88 maxwin dijamin menang!",
  "J4ckp0t Zeus99 terpercaya - daftar sekarang!",
  "c a s i n o online terbaik dengan deposit dana & pulsa",
  "situs judi online slot gacor maxwin hari ini",
  "Get rich quick with winning bets at my-gambling-site.com",
  "This is a normal sentence with no gambling content.",
  "Z.e.u.s g.a.c.o.r m.a.x.w.i.n",
  "j*u*d*i o*n*l*i*n*e terbesar"
];

// Custom configuration with advanced options
const customConfig = {
  keywords: ["menang", "maxwin", "deposit", "withdraw", "gacor"],
  blocklist: ["scamsite.com", "badword"],
  allowlist: ["normal", "common"],
  customPatterns: ["slot", "zeus", "jackpot", "casino", "poker", "joker"],
  sensitivityLevel: 3,     // Higher sensitivity (1-5)
  includeAnalysis: true,   // Include detailed analysis info
  detectRepetition: true,  // Detect abnormal character repetition
  detectUrlPatterns: true, // Look for URLs that might be gambling sites
  debug: true
};

// Test each example
console.log("=== TESTING EXAMPLES ===");
examples.forEach((example, index) => {
  console.log(`\nExample ${index + 1}: "${example}"`);
  const result = GbDetector.detect(example, customConfig);
  console.log(`Result: ${result.details} (Score: ${result.checkpoint}, Confidence: ${result.confidence})`);
  
  if (result.analysis) {
    console.log("Analysis highlights:", 
      Object.keys(result.analysis)
      .filter(key => result.analysis[key] === true || (Array.isArray(result.analysis[key]) && result.analysis[key].length > 0))
      .join(", ")
    );
  }
})
```

## Lisensi

MIT License
© 2025 LcfherShell

## Conclusion

The GbDetector module provides a robust solution for identifying gambling-related content in text, even when attempts are made to obfuscate it. By combining multiple detection techniques and offering extensive configuration options, it achieves high accuracy while minimizing false positives. The modular design allows for easy integration into different systems requiring content moderation or filtering capabilities.


## Contact
Email: 