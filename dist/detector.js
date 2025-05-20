"use strict";
/**
 * GamblingDetector
 * 
 * Script author: LcfherShell (c) 2025
 * 
 * Description:
 * This script is designed to analyze textual input and detect potentially suspicious content 
 * that indicates the promotion of online gambling (commonly known as “JUDOL” content). 
 * This script performs multi-step analysis using normalization, keyword detection, pattern matching, 
 * number concatenation, and substitution techniques to improve accuracy in identifying obscure terms.
 * 
 * Features:
 * - Support for character normalization to reduce text blurring.
 * Heuristic-based pattern recognition for gambling-related terms.
 * Merge and convert encoded text/numbers into readable words.
 * Customizable pattern, keyword and blocklist support.
 * Works in both browser and Node.js environments.
 * 
 * License:
 * This script is licensed under the MIT License.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
/**
 * GamblingDetector - Advanced text analysis module for detecting gambling-related content
 * Encapsulated in an IIFE to prevent global namespace pollution
 */
const GamblingDetector = (function() {
    /**
     * Normalize and clean text by removing diacritics and standardizing characters
     * @param {string} text - Text to clean
     * @returns {string} Cleaned text
     */
    function cleanText(text) {
        return text
            .normalize('NFKD') // Separate and remove styling
            .replace(/[\u0300-\u036f]/g, '') // Remove accents/diacritics
            .normalize('NFKC'); // Recombine into standard form
    }

    /**
     * Check if text contains mostly non-alphanumeric ASCII symbols (considered "garbage" characters)
     * @param {string} text - Text to evaluate
     * @param {number} [threshold=0.6] - Ratio of "garbage" characters to consider text as mostly garbage
     * @returns {boolean} Returns true if the proportion of garbage characters exceeds the threshold
     */
    function isMostlyAsciiGarbage(text, threshold = 0.6) {
        if (!text || typeof text !== 'string' || text.length === 0) return false;

        const asciiGarbageRegex = /[^a-zA-Z0-9\s\.,!?]/g;
        const garbageMatches = text.match(asciiGarbageRegex) || [];
        const ratio = garbageMatches.length / text.length;

        return ratio >= threshold;
    }

    /**
     * Check if text contains unusually repetitive characters or patterns
     * @param {string} text - Text to analyze
     * @param {number} [threshold=0.4] - Threshold for repetition detection
     * @returns {boolean} Whether the text contains suspicious repetition
     */
    function hasAbnormalRepetition(text, threshold = 0.4) {
        if (!text || text.length < 5) return false;

        // Check for consecutive repeated characters
        const repeatedChars = text.match(/(.)\1{3,}/g);
        if (repeatedChars && repeatedChars.join('').length / text.length > threshold) return true;

        // Check for repeated short sequences
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const uniqueWords = new Set(words);
        if (words.length >= 5 && uniqueWords.size / words.length < 0.5) return true;

        // Check for repeated phrases (3+ words)
        if (words.length >= 9) {
            const phrases = [];
            for (let i = 0; i < words.length - 2; i++) {
                phrases.push(`${words[i]} ${words[i+1]} ${words[i+2]}`);
            }
            const uniquePhrases = new Set(phrases);
            if (phrases.length >= 3 && uniquePhrases.size / phrases.length < 0.7) return true;
        }

        return false;
    }

    function fuzzySearch(list, query, maxDistance = 2, minScore = 0.5) {
        if (!Array.isArray(list)) throw new TypeError('Parameter "list" must be an array');
        if (typeof query !== 'string') throw new TypeError('Parameter "query" must be a string');
        if (query.trim() === '') return [];
    
        const substitutionMap = {
            '1': 'i', '2': 'z', '3': 'e', '4': 'a', '5': 's',
            '6': 'g', '7': 't', '8': 'b', '9': 'g', '0': 'o',
            '!': 'i', '&': 'e', '@': 'a', '#': 'h',
        };
    
        function normalize(text) {
            return text
                .toLowerCase()
                .split('')
                .map(char => substitutionMap[char] || char)
                .join('');
        }
    
        function levenshtein(a, b) {
            if (a === b) return 0;
            if (!a.length) return b.length;
            if (!b.length) return a.length;
            if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;
    
            let prev = Array(b.length + 1).fill(0);
            let curr = Array(b.length + 1).fill(0);
    
            for (let j = 0; j <= b.length; j++) prev[j] = j;
    
            for (let i = 1; i <= a.length; i++) {
                curr[0] = i;
                for (let j = 1; j <= b.length; j++) {
                    const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                    curr[j] = Math.min(
                        curr[j - 1] + 1,
                        prev[j] + 1,
                        prev[j - 1] + cost
                    );
                    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                        curr[j] = Math.min(curr[j], prev[j - 2] + 1);
                    }
                }
                [prev, curr] = [curr, prev];
            }
    
            return prev[b.length];
        }
    
        function calculateScore(q, i, d) {
            if (d === 0) return 1;
            const maxLength = Math.max(q.length, i.length);
            const baseScore = 1 - (d / maxLength);
            const containsBonus = i.includes(q) ? 0.1 : 0;
            const prefixBonus = i.startsWith(q) ? 0.2 : 0;
            return Math.min(1, baseScore + containsBonus + prefixBonus);
        }
    
        const normalizedQueryWords = normalize(query).split(/\s+/);
        const results = [];
    
        for (const word of normalizedQueryWords) {
            for (const item of list) {
                const normalizedItem = normalize(item);
                const distance = levenshtein(word, normalizedItem);
                const score = calculateScore(word, normalizedItem, distance);
    
                if (distance <= maxDistance && score >= minScore) {
                    results.push({
                        matched_word: word,
                        matched_with: item,
                        score: parseFloat(score.toFixed(3)),
                    });
                }
            }
        }
    
        return results.sort((a, b) => b.score - a.score);
    }

    /**
     * Clean the text by removing odd patterns such as excessive spaces, unnecessary punctuation, or misplaced characters.
     * @param {string} text - The text to clean
     * @returns {string} - Cleaned text with weird patterns removed
     */
    function cleanWeirdPatterns(text) {
        // Remove extra spaces (spaces before/after punctuation, multiple spaces)
        text = text.replace(/\s+/g, ' ').trim();

        // Remove dots or punctuation between letters (e.g., 'Z . e . u . s' => 'Zeus')
        text = text.replace(/(\w)\s*\.\s*(\w)/g, '$1$2');

        // Remove common separators between letters
        text = text.replace(/(\w)[\s.*_\-|+=:;,']+(\w)/g, '$1$2');

        // Clean up weird spacing patterns often used to evade detection
        text = text.replace(/\s+(\w)\s+(\w)\s+(\w)\s+/g, '$1$2$3');

        // Fix odd character substitutions
        const charMap = {
            '¢': 'c',
            '€': 'e',
            '£': 'l',
            '¥': 'y',
            '@': 'a',
            '5': 's',
            '3': 'e',
            '1': 'i',
            '0': 'o',
            '4': 'a',
            '7': 't',
            '6': 'g',
            '9': 'g',
            '8': 'b'
        };

        Object.entries(charMap).forEach(([char, replacement]) => {
            text = text.replace(new RegExp(char, 'g'), replacement);
        });

        return text;
    }

    /**
     * This function combines short words (1-3 characters long) that are separated by spaces in the given text.
     * It uses a regular expression to find pairs of words with 1-3 characters and joins them together.
     * The function also keeps words longer than 3 characters intact.
     *
     * @param {string} text - The input string that contains words separated by spaces.
     * @returns {string} - The modified string with short words (1-3 characters) combined.
     */
    function combineShortWords(text) {
        // First pass: combine pairs of short words
        let result = text.replace(/\b([a-zA-Z]{1,3})\s+([a-zA-Z]{1,3})\b/g, '$1$2');

        // Second pass: combine any remaining short words that might have been created
        result = result.replace(/\b([a-zA-Z]{1,3})\s+([a-zA-Z]{1,3})\b/g, '$1$2');

        // Third pass: process sequences of 3 or more short words
        result = result.replace(/\b([a-zA-Z]{1,3})\s+([a-zA-Z]{1,3})\s+([a-zA-Z]{1,3})\b/g, '$1$2$3');

        return result;
    }

    /**
     * Detect suspicious URL patterns that might be obfuscated
     * @param {string} text - Text to analyze
     * @returns {boolean} Whether suspicious URL patterns were found
     */
    function hasSuspiciousUrlPatterns(text) {
        // Look for common URL structures with potential obfuscation
        const patterns = [
            /\b\w+\.(com|net|io|xyz|site|online|id|org|gz|en|uk|int|edu|gov|ren|xin|[A-Z]?[a-zA-Z_+-]{2,8})/gi, // Basic domains
            /\bbit\.ly\/\w+/gi, // URL shorteners
            /\w+\s*\.\s*\w+\s*\/\s*\w+/gi, // Spaced out URLs
            /h\s*t\s*t\s*p\s*s?/gi, // Spaced out http(s)
            /w\s*w\s*w\s*\.\s*\w+/gi, // Spaced out www
            /\b(?:t(?:\.)?me|t(?:\.)?ly|is\.gd|goo\.gl|v\.gd|bit\.ly|tinyurl)/gi, // URL shorteners
            /\bwa\.me\/\d+/gi, // WhatsApp links
            /\bt(?:\.)?g\/\w+/gi, // Telegram links 
            /\blink(?:\.)?in\/bio/gi // Social media bio links
        ];

        // Enhanced pattern: detect domain names with added characters or spaces
        const domainPattern = /\b([a-zA-Z0-9_-]+)[\s.*_\-|+=:;]+([a-zA-Z]{2,5})\b/g;
        const potentialDomains = [...text.matchAll(domainPattern)].map(m => `${m[1]}.${m[2]}`);

        // Common TLDs to check for in potential domains
        const commonTLDs = ['com', 'net', 'org', 'io', 'co', 'xyz', 'site', 'online', 'app', 'vip', 'biz'];

        // Check if any potential domain contains a common TLD
        const hasSuspiciousDomain = potentialDomains.some(domain => {
            const parts = domain.split('.');
            if (parts.length < 2) return false;
            return commonTLDs.includes(parts[parts.length - 1].toLowerCase().replace(/\s+$/, ''));
        });

        return patterns.some(pattern => pattern.test(text)) || hasSuspiciousDomain;
    }

    /**
     * Detect language-specific gambling patterns
     * @param {string} text - Text to analyze
     * @param {string} language - Language code (e.g., 'en', 'id', 'zh')
     * @returns {object} Detection results with score and matched patterns
     */
    function detectLanguageSpecificPatterns(text, language = 'all') {
        const patterns = {
            // English patterns
            en: [
                /\b(?:bet(?:ting)?|wager|casino|poker|slot|roulette|jackpot|gambling)\b/i,
                /\b(?:online\s+gaming|sports\s+betting|odds|bookmaker|bookie)\b/i,
                /\b(?:deposit|withdraw|bonus|free\s+spin|vip\s+member|promo\s+code)\b/i
            ],
            // Indonesian patterns
            id: [
                /\b(?:judi|togel|gacor|maxwin|slot|toto|rolet|kasino|bandar)\b/i,
                /\b(?:taruhan|pasang|daftar|situs|bo|link\s+alternatif|akun|member)\b/i,
                /\b(?:menang|jackpot|deposit|withdraw|bonus|spin|prediksi|bocoran)\b/i
            ],
            // Chinese patterns
            zh: [
                /\b(?:博彩|赌场|赌博|投注|老虎机|轮盘|扑克|百家乐)\b/i,
                /\b(?:押注|下注|返水|彩金|奖金|优惠|免费旋转)\b/i
            ],
            // Vietnamese patterns
            vi: [
                /\b(?:cá\s+cược|đánh\s+bạc|sòng\s+bạc|khe|xổ\s+số|cược)\b/i,
                /\b(?:tiền\s+thưởng|quay\s+miễn\s+phí|đặt\s+cược|trúng)\b/i
            ],
            // Thai patterns
            th: [
                /\b(?:การพนัน|คาสิโน|สล็อต|พนัน|เดิมพัน|แทง)\b/i,
                /\b(?:โบนัส|ฟรีสปิน|ถอนเงิน|ฝากเงิน|สมัคร)\b/i
            ]
        };

        const result = {
            score: 0,
            matches: []
        };

        // Define which language patterns to check
        const languagesToCheck = language === 'all' ?
            Object.keys(patterns) :
            [language];

        // Check each selected language
        languagesToCheck.forEach(lang => {
            if (!patterns[lang]) return;

            patterns[lang].forEach(pattern => {
                const matches = text.match(pattern);
                if (matches && matches.length > 0) {
                    result.score += 0.3 * matches.length;
                    result.matches.push(...matches);
                }
            });
        });

        return result;
    }

    /**
     * Convert numbers and symbols to letters in words based on a substitution map
     * @param {string} comment - Text to process
     * @param {number} ignoreLastDigits - Number of characters at the end of words to skip conversion
     * @returns {string} Processed text
     */
    function convertCommentFixed(comment, ignoreLastDigits = 0) {
        return comment.replace(/\b\w+\b/g, (word) => {
            const len = word.length;
            if (len <= ignoreLastDigits) return word;

            const convertPart = word.slice(0, len - ignoreLastDigits);
            const remainPart = word.slice(len - ignoreLastDigits);

            const converted = convertPart.replace(/[0-9!&@#$?+*_%|]/gi, (match) => {
                const substitutionMap = {
                    '1': 'i',
                    '2': 'z',
                    '3': 'e',
                    '4': 'a',
                    '5': 's',
                    '6': 'g',
                    '7': 't',
                    '8': 'b',
                    '9': 'g',
                    '0': 'o',
                    '!': 'i',
                    '&': 'e',
                    '@': 'a',
                    '#': 'h',
                    '$': 's',
                    '?': 'q',
                    '+': 't',
                    '*': 'x',
                    '_': 'l',
                    '%': 'o',
                    '|': 'l'
                };
                return substitutionMap[match.toLowerCase()] || match;
            });

            return converted + remainPart;
        });
    }

    /**
     * Merge separated numbers that follow words (e.g., "judge 123 456" → "judge123456")
     * @param {string} text - Text to process
     * @returns {string} Processed text
     */
    function mergeTextWithTrailingNumbers(text) {
        return text
            // Standard pattern for words followed by space-separated numbers
            .replace(/\b([A-Z]?[a-zA-Z_+-]{2,}\d{0,10})((?:\s+\d+)+)\b(?!\.)/g, (_, prefix, nums) => {
                const digits = nums.match(/\d+/g)?.join('') || '';
                return prefix + digits;
            })
            // Handle hyphenated or dot-separated numbers
            .replace(/\b([A-Z]?[a-zA-Z_+-]{2,}\d{0,10})[\s.-]+(\d+)\b/g, '$1$2')
            // Handle words with numbers between them
            .replace(/\b([A-Z]?[a-zA-Z_+-]{2,})\s+(\d+)\s+([a-zA-Z_+-]{2,})\b/g, '$1$2$3');
    }

    /**
     * Enhanced version of loadkeywords that supports multiple formats
     * @param {string|Array|Object} source - Path to file, array of patterns, or object with pattern categories
     * @returns {Promise<Object>} Object containing pattern categories
     */
    async function loadkeywords(source) {
        // Default pattern categories
        const patterns = {
            keywords: [],
            domains: [],
            patterns: [],
            allowlist: []
        };

        // Handle different source types
        if (typeof source === 'string') {
            // Load from file
            try {
                let text;

                // Try Node.js file reading first
                try {
                    const fs = require('fs');
                    text = fs.readFileSync(source, 'utf-8');
                } catch (e) {
                    // Fall back to browser fetch API
                    const response = await fetch(source);
                    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
                    text = await response.text();
                }

                // Check if JSON
                if (source.endsWith('.json')) {
                    try {
                        const data = JSON.parse(text);

                        // Process JSON data
                        Object.keys(patterns).forEach(key => {
                            if (Array.isArray(data[key])) {
                                patterns[key] = data[key];
                            }
                        });
                    } catch (e) {
                        console.error("Error parsing JSON:", e);
                    }
                } else {
                    // Process as newline-separated list
                    patterns.keywords = text
                        .split('\n')
                        .map(k => k.trim())
                        .filter(k => k.length > 0 && !k.startsWith('#'));
                }
            } catch (error) {
                console.error("Error loading patterns:", error);
            }
        } else if (Array.isArray(source)) {
            // Use source as keywords list
            patterns.keywords = source;
        } else if (typeof source === 'object' && source !== null) {
            // Use source as pattern categories
            Object.keys(patterns).forEach(key => {
                if (Array.isArray(source[key])) {
                    patterns[key] = source[key];
                }
            });
        }

        return patterns;
    }

    /**
     * Create a RegExp pattern from an array of terms
     * @param {string[]} terms - Array of terms to include in pattern
     * @param {boolean} [loose=false] - Whether to use a more loose matching pattern
     * @returns {RegExp} Compiled regular expression
     */
    function createPatternRegex(terms, loose = false) {
        if (!terms || terms.length === 0) return null;

        const escaped = terms.map(term =>
            term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        ).join('|');

        const pattern = loose ?
            `(?:[a-zA-Z0-9][a-zA-Z0-9_+-]{0,4})?(?:${escaped})(?:[a-zA-Z0-9_+-]{0,4}[a-zA-Z0-9])?\\d*` :
            `\\b(?:[a-zA-Z][a-zA-Z_+-]{0,4})?(?:${escaped})(?:[a-zA-Z_+-]{0,4}[a-zA-Z])?\\d*`;
        return new RegExp(pattern, 'gi');
    }
    function TinyPatternRegex(terms) {
        if (!terms || terms.length === 0) return null;

        const escaped = terms.map(term =>
            term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        ).join('|');

        const pattern = `([a-zA-Z]{2,10})?${escaped}([a-zA-Z]{2,10})?(?:[0-9]{2,5})?`;
        return new RegExp(pattern, 'gi');
    }

    /**
     * Check for common word boundaries that might indicate separation
     * @param {string} text - Text to check
     * @returns {boolean} Whether the text has potential word separations
     */
    function hasSeparatedWords(text) {
        // Check for abnormal spacing or character insertion between letters
        return /\b[a-zA-Z]\s+[a-zA-Z]\b/.test(text) ||
            /\b[a-zA-Z][^a-zA-Z0-9\s]{1,2}[a-zA-Z]\b/.test(text) ||
            /\b([a-zA-Z])[\s.*_\-|+=:;,']([a-zA-Z])\b/.test(text);
    }

    /**
     * Attempt to reconstruct words that may have been deliberately separated
     * @param {string} text - Text to process
     * @returns {string} Text with potentially reconstructed words
     */
    function reconstructSeparatedWords(text) {
        // Remove spaces between single letters that might be separated words
        let result = text
            .replace(/\b([a-zA-Z])\s+([a-zA-Z])\s+([a-zA-Z])\s+([a-zA-Z])\b/gi, '$1$2$3$4')
            .replace(/\b([a-zA-Z])\s+([a-zA-Z])\s+([a-zA-Z])\b/gi, '$1$2$3')
            .replace(/\b([a-zA-Z])\s+([a-zA-Z])\b/gi, '$1$2')
            // Remove common separators between letters
            .replace(/\b([a-zA-Z])[.\-_*|+=:;,']([a-zA-Z])\b/gi, '$1$2')
            .replace(/\b([a-zA-Z])[.\-_*|+=:;,']([a-zA-Z])[.\-_*|+=:;,']([a-zA-Z])\b/gi, '$1$2$3');

        // Process more complex separations (like "s_l_o_t")
        const separatedWordPattern = /\b([a-zA-Z])[.\-_*|+=:;,']([a-zA-Z])[.\-_*|+=:;,']([a-zA-Z])[.\-_*|+=:;,']/g;
        if (separatedWordPattern.test(result)) {
            result = result.replace(/\b([a-zA-Z])([.\-_*|+=:;,'])([a-zA-Z])([.\-_*|+=:;,'])([a-zA-Z])([.\-_*|+=:;,'])([a-zA-Z])\b/gi, '$1$3$5$7');
        }

        return result;
    }

    /**
     * Detect if text contains suspicious code or emoji sequences related to gambling
     * @param {string} text - Text to analyze
     * @returns {boolean} Whether the text contains suspicious code sequences
     */
    function hasSuspiciousCodeSequences(text) {
        // Check for emoji sequences often used in gambling ads
        const emojiPattern = /[🎰🎲🎯🎮🎪🎭💰💸💵💴💶💷🏆🥇🥈🥉🏅🎖️🎗️🎫🎟️🎁🎀😎😍😂🤔🤙🤘🏻🎯🎪🎭🃏♠️♥️♦️♣️🎴🀄️🎨🎬🔢🎱🎳🎾🏈⚽️🏀🏉🎾🎽👑💎💲💹🧧💱📊📈📉🔝🔥⭐️👏👍👌✨🚀]/g;
        
        // Additional gambling-specific emojis
        const gamblingEmojiPattern = /[🎰🎲🎯🎪💰💸💵🏆🎫🎟️🃏♠️♥️♦️♣️🎴🀄️🎱💲💹🧧💱🎯🎭🎨🎬🔝🔥⭐️🚀]/g;
        
        const emojiMatches = text.match(emojiPattern) || [];
        const gamblingEmojiMatches = text.match(gamblingEmojiPattern) || [];

        // Check for code-like sequences (e.g., "S1OT", "J4CKPOT")
        const codePattern = /\b[A-Z][0-9][A-Z0-9]{2,}\b|\b[A-Z]{2,}[0-9]{2,}\b/g;
        
        // Common gambling terms with number substitutions
        const gamblingCodePattern = /\b[Ss][1l][0Oo][Tt]\b|\b[Bb][0Oo][0Oo][Nn][Uu][Ss]\b|\b[Jj][4Aa][Cc][Kk][Pp][0Oo][Tt]\b|\b[Bb][3Ee][Tt]\b|\b[Ww][1lI][Nn]\b|\b[Cc][4Aa][Ss][1lI][Nn][0Oo]\b|\b[Pp][0Oo][Kk][3Ee][Rr]\b/g;
        
        const codeMatches = text.match(codePattern) || [];
        const gamblingCodeMatches = text.match(gamblingCodePattern) || [];

        // Detection logic with weighted scoring
        const hasMultipleEmojis = emojiMatches.length >= 2;
        const hasGamblingSpecificEmojis = gamblingEmojiMatches.length >= 1;
        const hasCodePatterns = codeMatches.length >= 1;
        const hasGamblingCodePatterns = gamblingCodeMatches.length >= 1;

        // Return true if any of the conditions are met
        return hasMultipleEmojis || hasGamblingSpecificEmojis || hasCodePatterns || hasGamblingCodePatterns;
    }

    /**
     * Detect context-specific gambling indicators
     * @param {string} text - Text to analyze
     * @returns {object} Detection results with score and reasons
     */
    function detectContextualGamblingIndicators(text) {
        const indicators = {
            score: 0,
            reasons: []
        };

        // Monetary phrases
        const moneyPhrases = [
            /\b(?:min(?:imum)?\s*dep(?:osit)?|min\s*wd|wd\s*min)\b.*?(?:\d+[kK]?|ribu|juta|rb)/i,
            /\b(?:deposit|withdrawal|cashout|bayar)\b.*?(?:\d+[kK]?|ribu|juta|rb)/i,
            /\b(?:bonus|promo|free)\b.*?(?:\d+%|\d+[kK]?|ribu|juta|rb)/i,
            /\b(?:win|menang|dapat|untung)\b.*?(?:\d+[xX]|\d+[kK]?|ribu|juta|rb)/i
        ];

        moneyPhrases.forEach(pattern => {
            if (pattern.test(text)) {
                indicators.score += 0.05;
                indicators.reasons.push('monetary_phrase');
            }
        });

        // Time-sensitive phrases
        const timePhrases = [
            /\b(?:today|hari\s*ini|sekarang|now|langsung)\b.*?(?:bonus|promo|free)/i,
            /\b(?:limited|terbatas|hanya|only)\b.*?(?:time|waktu|hari|jam)/i
        ];

        timePhrases.forEach(pattern => {
            if (pattern.test(text)) {
                indicators.score += 0.03;
                indicators.reasons.push('urgency_phrase');
            }
        });

        // Customer service indicators
        const csIndicators = [
            /\b(?:cs|customer\s*service|layanan\s*pelanggan|admin|help\s*desk)\b/i,
            /\b(?:wa|whatsapp|telegram|line|chat)\b.*?(?:\d{4,}|online|24\s*(?:jam|hours))/i,
            /\b(?:kontak|contact|hubungi)\b.*?(?:wa|whatsapp|telegram|line|chat)/i
        ];

        csIndicators.forEach(pattern => {
            if (pattern.test(text)) {
                indicators.score += 0.03;
                indicators.reasons.push('cs_indicator');
            }
        });

        // Payment method indicators
        const paymentIndicators = [
            /\b(?:bank|bca|bni|bri|mandiri|dana|ovo|gopay|linkaja|pulsa|e-wallet|wallet|dompet|payment|pembayaran)\b/i,
            /\b(?:all\s*bank|semua\s*bank|bank\s*lokal|local\s*bank)\b/i
        ];

        paymentIndicators.forEach(pattern => {
            if (pattern.test(text)) {
                indicators.score += 0.01;
                indicators.reasons.push('payment_indicator');
            }
        });

        return indicators;
    }

    /**
     * Analyze the probability that a text is trying to evade detection
     * @param {string} text - Text to analyze
     * @returns {object} Analysis results with evasion score and techniques
     */
    function analyzeEvasionTechniques(text) {
        const analysis = {
            score: 0,
            techniques: []
        };

        // Check for character substitution
        const substitutionPatterns = [
            /\b[a-zA-Z]*[0-9!@#$%^&*][a-zA-Z0-9!@#$%^&*]*[a-zA-Z]+[a-zA-Z0-9!@#$%^&*]*\b/g, // Words with numbers mixed in
            /\b[a-zA-Z]+[0-9]{3,}\b/g // Words with many trailing numbers
        ];

        substitutionPatterns.forEach(pattern => {
            const matches = text.match(pattern) || [];
            if (matches.length > 0) {
                analysis.score += 0.3;
                analysis.techniques.push('character_substitution');
            }
        });

        // Check for word separation
        if (hasSeparatedWords(text)) {
            analysis.score += 0.4;
            analysis.techniques.push('word_separation');
        }

        // Check for unusual spacing
        if (/\s{2,}/.test(text) || /[a-zA-Z]\s[a-zA-Z]\s[a-zA-Z]/.test(text)) {
            analysis.score += 0.2;
            analysis.techniques.push('unusual_spacing');
        }

        // Check for mixed case/formatting
        if (/[a-z][A-Z]|[A-Z][a-z][A-Z]/.test(text)) {
            analysis.score += 0.2;
            analysis.techniques.push('mixed_case');
        }

        // Check for reversed text
        const words = text.match(/\b\w{4,}\b/g) || [];
        for (const word of words) {
            const reversed = word.split('').reverse().join('');
            if (text.includes(reversed) && word !== reversed) {
                analysis.score += 0.5;
                analysis.techniques.push('reversed_text');
                break;
            }
        }

        return analysis;
    }

    /**
     * Extract contact information from text
     * @param {string} text - Text to analyze
     * @returns {object} Extracted contact information
     */
    function extractContactInfos(text) {
        const contactInfo = {
            found: false,
            types: [],
            values: []
        };

        // Common contact patterns
        const patterns = [{
                type: 'whatsapp',
                pattern: /\b(?:wa|whatsapp|w4|wea)[\s.:]*(?:\+?\d{8,15}|\+?\d{2,4}[-\s]?\d{2,4}[-\s]?\d{2,5})\b/gi
            },
            {
                type: 'telegram',
                pattern: /\b(?:telegram|tele|t\.me|tg)[\s.:]*(?:@\w+|\+?\d{8,15})/gi
            },
            {
                type: 'phone',
                pattern: /\b(?:tel|telp|hp|phone|hubungi|call)[\s.:]*(?:\+?\d{8,15}|\+?\d{2,4}[-\s]?\d{2,4}[-\s]?\d{2,5})\b/gi
            },
            {
                type: 'instagram',
                pattern: /\b(?:ig|instagram|insta)[\s.:]*(?:@\w+|\w+)/gi
            },
            {
                type: 'line',
                pattern: /\b(?:line|ln)[\s.:]*(?:@\w+|\w+)/gi
            },
            {
                type: 'website',
                pattern: /\b(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+)(?:\.[a-zA-Z0-9-]+)+(?:\/[^\s]*)?/gi
            }
        ];

        // Extract all types of contact information
        patterns.forEach(({
            type,
            pattern
        }) => {
            const matches = text.match(pattern);
            if (matches && matches.length > 0) {
                contactInfo.found = true;
                contactInfo.types.push(type);
                contactInfo.values.push(...matches);
            }
        });

        return contactInfo;
    }

    /**
     * Converts keyword input into two arrays: one for keys (terms) and one for associated scores.
     *
     * @param {(string|object|Array<string|object>)} input - Keyword data which can be:
     *   - A single string keyword
     *   - An object with keys as keywords and values as score (boolean or number)
     *   - An array of strings or objects as described above
     * @returns {[string[], number[]]} A two-dimensional array:
     *   - First array contains keyword strings
     *   - Second array contains numeric scores (1 for true/strings, 0 for false, or custom number)
    */
    function extractKeywordArrays(input) {
        const keys = [];
        const values = [];
    
        const processEntry = (key, val) => {
            if (!key || typeof key !== 'string') return; // Skip invalid keys
            
            let score = 1;
    
            if (typeof val === 'boolean') {
                score = val ? 1 : 0;
            } else if (typeof val === 'number') {
                if (val > 5) {
                    score = 1;
                } else if (val === 4) {
                    score = 0.4;
                } else if (val >= 0 && val <= 1) {
                    score = val;
                } else {
                    score = 1; // fallback
                }
            } else if (typeof val === 'string') {
                // Handle string values that might be numeric
                const numVal = parseFloat(val);
                if (!isNaN(numVal)) {
                    if (numVal > 5) {
                        score = 1;
                    } else if (numVal === 4) {
                        score = 0.4;
                    } else if (numVal >= 0 && numVal <= 1) {
                        score = numVal;
                    }
                }
            } else if (val === null || val === undefined) {
                score = 0; // Handle null/undefined values
            }
    
            keys.push(key);
            values.push(score);
        };
    
        try {
            if (input === null || input === undefined) {
                return [keys, values]; // Return empty arrays for null/undefined input
            } else if (typeof input === 'string') {
                if (input.trim()) { // Only add non-empty strings
                    keys.push(input);
                    values.push(1);
                }
            } else if (Array.isArray(input)) {
                for (const item of input) {
                    if (typeof item === 'string') {
                        if (item.trim()) { // Only add non-empty strings
                            keys.push(item);
                            values.push(1);
                        }
                    } else if (item !== null && typeof item === 'object') {
                        for (const [key, val] of Object.entries(item)) {
                            processEntry(key, val);
                        }
                    }
                }
            } else if (input !== null && typeof input === 'object') {
                for (const [key, val] of Object.entries(input)) {
                    processEntry(key, val);
                }
            }
        } catch (error) {
            console.error("Error in extractKeywordArrays:", error);
            // Continue with what we've collected so far
        }
    
        return [keys, values];
    }
      

    /**
     * Converts an integer input to a corresponding value based on a predefined scale.
     * @param {number} inputInt - The integer input to convert. It should be in the range of 0 to 5.
     * @returns {number} The corresponding converted value from the scale.
     * If input is out of range (less than 0 or greater than 5), the function defaults to returning 0.
     */
    function morpoint(inputInt) {
        if (inputInt <= 0) inputInt = 0;
        const numberx = {
            0: 0,
            1: 5,
            2: 4,
            3: 3,
            4: 2,
            5: 1
        };
        return numberx[inputInt];
    }

    /**
     * Parses a value into a valid number and applies constraints based on the maximum allowed value.
     * @param {string | number} value - The value to parse into a number. Can be a string or a number.
     * @param {number} maxim - The maximum allowed number value.
     * @returns {number} A valid number within the range. If input is invalid or less than 0, it returns 0.
     * If the value exceeds the maximum, it returns the maximum.
     */
    function parseNumber(value, maxim) {
        if (value === "-") return 0;
        let num = Number(value);
        if (isNaN(num)) return 0;
        if (num < 0) return 0;
        if (num > maxim) num = maxim;
        return num;
    }

    /**
     * Main function to detect Gambling patterns in text
     * @param {string} text - The text to analyze
     * @param {object} options - Configuration options
     * @param {(string[]|Object.<string, number>)} [options.keywords] - List of pattern terms to detect [name site]
     * @param {string[]} [options.supportKeywords] - List of supportKeywords to detect
     * @param {string[]} [options.domains] - List of domains to detect
     * @param {string[]} [options.allowlist] - List of terms that should be allowed even if matched
     * @param {number} [options.sensitivityLevel] - Detection sensitivity (1-5, default 3)
     * @param {boolean} [options.includeAnalysis] - Whether to include detailed analysis in results
     * @param {boolean} [options.detectRepetition] - Whether to detect abnormal repetition
     * @param {boolean} [options.detectUrlPatterns] - Whether to detect suspicious URL patterns
     * @param {boolean} [options.detectEvasionTechniques] - Whether to detect evasion techniques
     * @param {boolean} [options.detectContextualIndicators] - Whether to detect contextual indicators
     * @param {boolean} [options.extractContactInfo] - Whether to extract contact information
     * @param {string} [options.language] - Language to analyze ('en', 'id', 'all')
     * @param {boolean} [options.debug] - Whether to output debug information
     * @returns {object} Detection results
     */
    function detect(text = "", options = {}) {
        // Extract options with defaults
        const {
                supportKeywords = [],
                domains = [],
                keywords = [
                    "slot", "casino", "jack", "zeus", "scatter", "toto", "judol", "jodol",
                    "poker", "roulette", "betting", "gamble", "joker"
                ],
                allowlist = [],
                sensitivityLevel = 3,
                includeAnalysis = false,
                detectRepetition = true,
                detectUrlPatterns = true,
                detectEvasionTechniques = true,
                detectContextualIndicators = true,
                extractContactInfo = true,
                language = 'all',
                debug = false
        } = options;
        
        // Extract keyword arrays and validate input
        let [keyword, scorepoint] = extractKeywordArrays(keywords);
        
        // Normalize sensitivity factor and set thresholds
        const sensitivityFactor = Math.max(1, Math.min(5, sensitivityLevel)) / 3;
        const confidenceThresholds = {
            low: Math.max(0.45, 0.5 * sensitivityFactor),
            medium: Math.max(0.9, 0.8 * sensitivityFactor),
            high: Math.max(1.2, 2.5 * sensitivityFactor)
        };
        
        // Get normalized sensitivity for more granular checks
        const sensitivityFactorNorm = morpoint(sensitivityLevel);

        // Track detection metrics
        let detected = false;
        let checkpoint = 0;
        const analysis = includeAnalysis ? {} : null;
        const log = debug ? console.log : () => {};

        // Skip empty or extremely short text
        if (!text || typeof text !== 'string' || text.trim().length < 2) {
            return {
                isGambling: false,
                confidence: "none",
                checkpoint: 0,
                details: "Text too short for analysis",
                comment: text
            };
        }

        // Normalize text for analysis
        const rawText = text.replace(/\n/g, ' ') // Convert newlines to spaces
            .replace(/\./g, ' . ') // Add spaces around periods
            .replace(/\s+/g, ' ') // Normalize multiple spaces
            .trim();

        // Default supportKeywords for detection - comprehensive list
        const defaultSupportKeywords = [
            // English gambling terminology
            "wdp", "wd", "win", "happy", "joyful", "rich", "trustworthy", "lucky", "trust",
            "definitely get", "jp", "jackpot", "proud", "harvest", "smart", "gambli", "great",
            "money back", "trusted", "beautiful", "harvest", "fishing", "bet", "put", "bonus",
            "dp", "pay", "enough", "game", "play", "happy", "deposit", "withdraw", "min", "max",
            "winning", "fortune", "luck", "lucky", "prize", "reward", "vip", "member", "free",
            "register", "sign", "join", "profit", "earn", "money", "cash", "credit", "debit", "join", "login",
            "official", "original", "genuine", "link", "alternative", "customer", "service",
            "provider", "welcome", "promotion", "online", "platform", "app", "application", "alternati", 
            "scatter", "wager", "baccarat", "blackjack", "dice", "spin", "multiplier", "odds",
            // Indonesian gambling terminology
            "menang", "senang", "gacor", "gembira", "kaya", "pasti dapat", "bangga", "panen",
            "beruntung", "untung", "mancing", "uang kembali", "dipercaya", "amanah", "terpercaya",
            "cantik", "pancing", "judi", "taruhan", "pasang", "togel", "hadiah", "bonus", "register",
            "masuk", "dana", "jamin", "aman", "situs", "resmi", "asli", "maxwin", "gampang",
            "bocoran", "prediksi", "jitu", "akurat", "terpercaya", "terbaik", "rekomendasi",
            "main", "permainan", "daftar", "minimal", "maksimal", "pasaran", "nomor", "petaruh",
            "peluang", "kesempatan", "keberuntungan", "ratusan", "ribuan", "jutaan", "hadiah", "alternatif"
        ];

        // Use provided supportKeywords or defaults and ensure all defaults are included
        let keywordList = supportKeywords.length > 0 ? [...supportKeywords] : [...defaultSupportKeywords];
        
        // Ensure all default supportKeywords are included if not specifically replacing them
        if (supportKeywords.length === 0 || (!supportKeywords.includes("wdp") && !supportKeywords.includes("win"))) {
            keywordList = [...new Set([...keywordList, ...defaultSupportKeywords])];
        }

        // Convert domains and allowlist to Sets for faster lookups
        const domainSet = new Set(domains.map(k => k.toLowerCase()));
        const allowSet = new Set(allowlist.map(k => k.toLowerCase()));

        // Remove supportKeywords that are in blocklist
        keywordList = keywordList.filter(word =>
            !domainSet.has(word.toLowerCase()) &&
            word.trim().length > 0
        );

        // --- DETECTION STARTS HERE ---
        
        // 1. Check for excessive "garbage" symbols
        const hasGarbage = isMostlyAsciiGarbage(rawText, 0.45);
        if (hasGarbage) {
            checkpoint += 0.4;
            if (includeAnalysis) analysis.garbageDetected = true;
            log("ASCII garbage detected in text");
        }

        // 2. Check for repetitive patterns
        if (detectRepetition && hasAbnormalRepetition(rawText)) {
            checkpoint += 0.5;
            if (includeAnalysis) analysis.repetitionDetected = true;
            log("Abnormal repetition detected in text");
        }

        // 3. Check for suspicious URL patterns
        if (detectUrlPatterns && hasSuspiciousUrlPatterns(rawText)) {
            checkpoint += 0.7;
            if (includeAnalysis) analysis.suspiciousUrlDetected = true;
            log("Suspicious URL pattern detected");
        }

        // 4. Check for suspicious code sequences or emojis
        if (hasSuspiciousCodeSequences(rawText)) {
            checkpoint += 0.3;
            if (includeAnalysis) analysis.suspiciousCodeSequences = true;
            log("Suspicious code sequences or emojis detected");
        }

        // 5. Analyze evasion techniques
        if (detectEvasionTechniques) {
            const evasionAnalysis = analyzeEvasionTechniques(rawText);
            if (evasionAnalysis.score > 0) {
                checkpoint += evasionAnalysis.score;
                if (includeAnalysis) {
                    analysis.evasionTechniques = evasionAnalysis.techniques;
                    analysis.evasionScore = evasionAnalysis.score;
                }
                log("Evasion techniques detected:", evasionAnalysis.techniques);
            }
        }

        // 6. Detect contextual gambling indicators
        if (detectContextualIndicators) {
            const contextualIndicators = detectContextualGamblingIndicators(rawText);
            if (contextualIndicators.score > 0) {
                checkpoint += contextualIndicators.score;
                if (includeAnalysis) {
                    analysis.contextualIndicators = contextualIndicators.reasons;
                    analysis.contextualScore = contextualIndicators.score;
                }
                log("Contextual gambling indicators detected:", contextualIndicators.reasons);
            }
        }

        // 7. Extract contact information
        let contactInfo = null;
        if (extractContactInfo) {
            contactInfo = extractContactInfos(rawText);
            if (contactInfo.found) {
                checkpoint += 0.4;
                if (includeAnalysis) analysis.contactInfo = contactInfo;
                log("Contact information detected:", contactInfo);
            }
        }

        // 8. Clean and normalize text
        const cleaned = cleanText(rawText);
        if (cleaned !== rawText) {
            checkpoint += 0.3;
            if (includeAnalysis) analysis.containsNonStandardChars = true;
        }
        log("After cleaning:", cleaned);

        // 9. Try to reconstruct deliberately separated words
        const reconstructed = reconstructSeparatedWords(cleaned);
        if (reconstructed !== cleaned) {
            checkpoint += 0.3;
            if (includeAnalysis) analysis.wordSeparationDetected = true;
            log("After reconstruction:", reconstructed);
        }

        // 10. Merge numbers after target words
        const merged = mergeTextWithTrailingNumbers(reconstructed);
        if (merged !== reconstructed) {
            checkpoint -= 0.3; // Reduce checkpoint if numbers need merging (legitimate content)
            if (includeAnalysis) analysis.separatedNumbersDetected = true;
        }
        log("After merging numbers:", merged);

        // 11. Detect language-specific patterns
        const languagePatterns = detectLanguageSpecificPatterns(merged, language);
        if (languagePatterns.score > 0) {
            checkpoint += languagePatterns.score;
            if (includeAnalysis) {
                analysis.languageSpecificMatches = languagePatterns.matches;
                analysis.languageScore = languagePatterns.score;
            }
            log("Language-specific patterns detected:", languagePatterns.matches);
        }

        // Check for domains in blocklist
        const lowerText = merged.toLowerCase();
        const domainMatched = [...domainSet].some(blocked => {
            // More comprehensive domain matching including with and without protocol/www
            return lowerText.includes(blocked) ||
                new RegExp(`\\b(?:https?:\\/\\/)?(?:www\\.)?${blocked.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lowerText);
        });

        if (domainMatched) {
            checkpoint += 0.57; // Increase score when domain is matched
            if (includeAnalysis) analysis.blockedDomainDetected = true;
            log("Domain in blocklist detected, increasing checkpoint");
        }

        // 12. Create pattern regexes - standard and loose versions with optimization
        const standardPatternRegex = new RegExp(
            '\\b([A-Z]?[a-zA-Z_+-]{2,}\\d{2,10}\\b(?!\\.))|(slot|casino|gambling|bet|poker|jackpot|joker|zeus|toto|judi)(?:[a-zA-Z_+-]{0,4}[a-zA-Z])?',
            'gi'
        );
        
        // Create optimized regex patterns
        const customPatternRegex = createPatternRegex(keyword);
        const loosePatternRegex = createPatternRegex(keyword, true);
        const tinyPatternRegex = TinyPatternRegex(keyword);
        
        // Track matches found
        let allMatches = [];
        let matchedTerms = new Set();

        // 13. Multi-pass detection with leet-speak conversion
        const detectionPasses = [
            {
                name: "Direct matching",
                converter: text => text,
                weight: 1.0
            },
            {
                name: "Standard cleaning",
                converter: text => cleanWeirdPatterns(text),
                weight: 0.9
            },
            {
                name: "Advanced cleaning",
                converter: text => combineShortWords(cleanWeirdPatterns(text)),
                weight: 0.8
            }
        ];
        
        // 14. Search fuzzy text from input text, replace, and update checkpoint
        let fuzzyText = fuzzySearch(keyword, text);
        if (fuzzyText && fuzzyText.length > 0) {
            const highConfidenceFuzzyMatches = fuzzyText.filter(fuzzy => fuzzy.score > 0.6);
            if (highConfidenceFuzzyMatches.length > 0) {
                text = text.replace(highConfidenceFuzzyMatches[0].matched_word, highConfidenceFuzzyMatches[0].matched_with);
                log("Applied fuzzy replacement:", highConfidenceFuzzyMatches[0]);
            }
        }
        
        // Check for fuzzy matches in reconstructed text, especially if obfuscation detected
        fuzzyText = fuzzySearch(keyword, reconstructed);
        if (fuzzyText && (analysis?.garbageDetected || analysis?.wordSeparationDetected || analysis?.containsNonStandardChars)) {
            for (const element of fuzzyText) {
                if (element?.matched_with) {
                    const keywordIndex = keyword.indexOf(element.matched_with);
                    if (keywordIndex >= 0) {
                        const scoreIncrement = scorepoint[keywordIndex] >= 1 ? 0.06 : scorepoint[keywordIndex];
                        checkpoint += scoreIncrement;
                        log(`Adding ${scoreIncrement} from fuzzy match of '${element.matched_with}'`);
                        break;
                    }
                }
            }
        }
        
        let fuzzyHistory = [];

        // For each detection pass
        for (const pass of detectionPasses) {
            const processedText = pass.converter(merged);
            log(`Processing with "${pass.name}":`);

            // Loop through different ignoreLastDigits values for leet-speak detection
            for (let ignore = 0; ignore <= 6; ignore++) {
                const textFixed = convertCommentFixed(processedText, ignore);
                const converted = combineShortWords(cleanWeirdPatterns(textFixed));
                log(`Converted text (ignore=${ignore}):`, converted);

                // Try different pattern matching approaches in order of specificity
                const patternApproaches = [
                    {
                        pattern: standardPatternRegex,
                        value: 0.5 * pass.weight,
                        min: 0.014 * pass.weight, 
                        name: "standard"
                    },
                    {
                        pattern: customPatternRegex,
                        value: 0.4 * pass.weight,
                        min: 0.013 * pass.weight, 
                        name: "custom"
                    },
                    {
                        pattern: loosePatternRegex,
                        value: 0.3 * pass.weight,
                        min: 0.011 * pass.weight, 
                        name: "loose"
                    },
                    {
                        pattern: tinyPatternRegex,
                        value: 0.25 * pass.weight,
                        min: 0.005 * pass.weight,
                        name: "tiny"
                    }
                ];

                let foundMatch = false;
                let looseAttempted = 0;
                
                // Try each pattern approach
                for (const approach of patternApproaches) {
                    if (!approach.pattern) continue;
                    
                    // Get initial matches
                    let matches = converted.replace(/\s+/g, '').match(approach.pattern);
                    let filteredMatches = [];
                    
                    // Special handling for loose and tiny patterns
                    if (!matches && (approach.name === "loose" || looseAttempted > 0)) {
                        // Try more aggressive pattern matching for high sensitivity
                        if (sensitivityFactorNorm > 2) {
                            matches = combineShortWords(textFixed).match(/\b[a-zA-Z]{2,3}\d{1,5}\b/gi);
                        }
                        if (!matches && sensitivityFactorNorm > 2) {
                            matches = textFixed.match(/\b[a-zA-Z]{3,}\d{2,}\b/gi);
                            if (matches) {
                                checkpoint += approach.value * 1.2;
                            }
                        }
                    } else if (approach.name !== "tiny") {
                        // Look for potential site identifiers in original text
                        const siteIdMatches = text.toString().trim().match(/\b[a-zA-Z]{3,}\d{2,5}\b/gi);
                        if (siteIdMatches && sensitivityFactorNorm >= 4) {
                            checkpoint += 0.1;
                            log("Site identifier pattern detected at high sensitivity");
                        }
                    }
                    
                    // Check fuzzy history matches
                    if (fuzzyHistory.length > 0) {
                        for (const el of fuzzyHistory) {
                            const historyMatches = el.replace(/\s+/g, '').match(approach.pattern);
                            if (historyMatches && historyMatches.length > 0) {
                                checkpoint += 0.1;
                                log(`History match found in fuzzy history: ${historyMatches}`);
                            }
                        }
                    }

                    // Special handling for "loose" approach to avoid double-counting
                    if (approach.name === "loose") {
                        if (looseAttempted > 0) continue;
                        looseAttempted += 1;
                    } else if (approach.name === "tiny") {
                        // Tiny patterns directly match on processed text
                        matches = processedText.match(tinyPatternRegex);
                        if (matches && matches.length > 0) {
                            checkpoint += 0.03;
                        }
                    }
                    
                    // Process matches if found
                    if (matches && matches.length > 0) {
                        // Filter out matches that are in the allowlist
                        filteredMatches = matches.filter(match => !allowSet.has(match.toLowerCase()));

                        if (filteredMatches.length > 0) {
                            allMatches.push(...filteredMatches);
                            filteredMatches.forEach(m => matchedTerms.add(m.toLowerCase()));
                            
                            // Only increase checkpoint if we're already getting suspicious
                            if (checkpoint > 0.5) { 
                                checkpoint += approach.value;
                                log(`${approach.name.toUpperCase()} MATCH DETECTED (ignoreLastDigits=${ignore}):`, filteredMatches);
                                foundMatch = true;
                                break;
                            }
                        }
                    } else {
                        // Try fuzzy matching if direct matching failed
                        const checkFuzzy = fuzzySearch(keywordList, textFixed);
                        
                        if (checkFuzzy && checkFuzzy.length > 0) {
                            const bestMatch = checkFuzzy[0]; // Take best match
                            
                            if (bestMatch.score > 0.7) {
                                const textSession = textFixed.replace(bestMatch.matched_word, bestMatch.matched_with);
                                log(`Fuzzy replacement: '${bestMatch.matched_word}' → '${bestMatch.matched_with}'`);
                                
                                // Try matching on fuzzy-replaced text
                                const fuzzyMatches = textSession.replace(/\s+/g, '').match(approach.pattern);
                                
                                if (fuzzyMatches && fuzzyMatches.length > 0) {
                                    // Filter out matches that are in the allowlist
                                    const fuzzyFilteredMatches = fuzzyMatches.filter(match => !allowSet.has(match.toLowerCase()));

                                    if (fuzzyFilteredMatches.length > 0) {
                                        allMatches.push(...fuzzyFilteredMatches);
                                        fuzzyFilteredMatches.forEach(m => matchedTerms.add(m.toLowerCase()));
                                        
                                        if (checkpoint > 0.5) { 
                                            checkpoint += 0.08;
                                            log(`FUZZY ${approach.name.toUpperCase()} MATCH DETECTED:`, fuzzyFilteredMatches);
                                            foundMatch = true;
                                            break;
                                        }
                                    }
                                }
                                
                                // Add to fuzzy history for future checks
                                fuzzyHistory.push(textSession);
                            }
                        } else {
                            const checkFuzzy2 = fuzzySearch(keyword, converted);
                            if (checkFuzzy2 && checkFuzzy2.length > 0) {
                                const bestMatch2 = checkFuzzy2[0];
                                if (bestMatch2.score > 0.6) {
                                    const textSession = textFixed.replace(bestMatch2.matched_word, bestMatch2.matched_with);
                                    fuzzyHistory.push(textSession);
                                }
                            }
                            // Slightly reduce checkpoint for failed pattern match
                            checkpoint -= (approach.min - 0.002);
                        }
                        
                        // Limit fuzzy history size
                        if (fuzzyHistory.length > 2) {
                            fuzzyHistory = fuzzyHistory.slice(-2);
                        }
                    }
                }

                if (foundMatch) {
                    // Look for supporting keywords after finding a pattern match
                    const convertedLower = converted.toLowerCase();
                    const keywordMatches = [];

                    // Find supporting keywords
                    for (const keyword of keywordList) {
                        if (!domainSet.has(keyword.toLowerCase()) &&
                            convertedLower.includes(keyword.toLowerCase())) {
                            keywordMatches.push(keyword);
                        }
                    }

                    const keywordMatchCount = keywordMatches.length;

                    if (keywordMatchCount > 0) {
                        // More keywords = higher checkpoint increase
                        const keywordBonus = Math.min(1.5, 0.03 * (keywordMatchCount / 2) + 0.7);
                        
                        if (checkpoint > 0.45) {
                            checkpoint += keywordBonus-0.2;
                            log(`Added ${keywordBonus} from ${keywordMatchCount} supporting keywords`);
                        } else {
                            checkpoint -= 0.01;
                        }
                        
                        if (includeAnalysis) {
                            analysis.supportingKeywords = keywordMatches;
                            analysis.keywordMatchCount = keywordMatchCount;
                        }

                        log(`🔍 Supporting keywords found (${keywordMatchCount}):`, keywordMatches);
                    }

                    detected = true;
                    break;
                }
            }

            if (detected) break; // Break from pass loop if match found
        }

        // 15. Content length and complexity analysis
        const wordCount = (rawText.match(/\b\w+\b/g) || []).length;
        const charCount = rawText.length;

        // Calculate content metrics
        const avgWordLength = wordCount > 0 ? charCount / wordCount : 0;
        const hasGamblingContentLength = (wordCount >= 5 && wordCount <= 50) || (charCount >= 30 && charCount <= 500);

        if (hasGamblingContentLength) {
            // Typical gambling spam has specific length characteristics
            checkpoint += 0.2;
            if (includeAnalysis) analysis.contentLengthSuspicious = true;
            log("Content length matches gambling spam profile");
        }

        if (avgWordLength > 12) {
            // Unusually long avg word length suggests potential obfuscation
            checkpoint += 0.3;
            if (includeAnalysis) analysis.longAvgWordLength = avgWordLength;
            log(`Unusually long average word length: ${avgWordLength}`);
        }
        
        // Apply sensitivity normalization to final checkpoint
        checkpoint = parseNumber(checkpoint, sensitivityFactorNorm);

        // 16. Final evaluation
        let result = {
            isGambling: false,
            confidence: "none",
            checkpoint: parseFloat(checkpoint.toFixed(2)),
            details: "No gambling content detected",
            comment: text
        };

        // Include analysis if requested
        if (includeAnalysis) {
            result.analysis = {
                ...analysis,
                matchedTerms: [...matchedTerms],
                allMatches: allMatches.length > 0 ? [...new Set(allMatches)] : [],
                contentMetrics: {
                    wordCount,
                    charCount,
                    avgWordLength: parseFloat(avgWordLength.toFixed(2))
                }
            };

            if (contactInfo && contactInfo.found) {
                result.analysis.contactInfo = contactInfo;
            }
        }

        // Set final detection result based on checkpoint score
        if (detected || checkpoint >= confidenceThresholds.low) {
            if (checkpoint >= confidenceThresholds.high) {
                result.isGambling = true;
                result.confidence = "high";
                result.details = "✅ Gambling content detected with high confidence";
            } else if (checkpoint >= confidenceThresholds.medium) {
                result.isGambling = true;
                result.confidence = "medium";
                result.details = "✅ Gambling content likely detected";
            } else if (checkpoint >= confidenceThresholds.low) {
                result.isGambling = true;
                result.confidence = "low";
                result.details = "⚠️ Possible gambling content (manual review recommended)";
            }
        } else if (hasGarbage) {
            // Special case for excessive garbage characters
            result.isGambling = true;
            result.confidence = "medium";
            result.details = "⚠️ Suspicious content detected (excessive symbol usage)";
        }

        if (debug) {
            log(`Final checkpoint score: ${checkpoint.toFixed(2)}`);
            log(`Final verdict: ${result.details}`);
        }

        return result;
    }

    /**
     * Create a new detector instance with predefined settings
     * @param {object} options - Default options for the detector
     * @returns {object} Detector instance
     */
    function createDetector(options = {}) {
        return {
            detect: (text, instanceOptions = {}) => {
                // Merge default options with instance options
                const mergedOptions = {
                    ...options,
                    ...instanceOptions
                };
                return detect(text, mergedOptions);
            },
            loadPatterns: async (source) => {
                return await loadkeywords(source);
            },
            version: "1.1.2"
        };
    }

    /**
     * Analyze a batch of texts for gambling content
     * @param {string[]} texts - Array of texts to analyze
     * @param {object} options - Detection options
     * @returns {object[]} Array of detection results
     */
    async function detectBatch(texts, options = {}) {
        if (!Array.isArray(texts)) {
            return [detect(String(texts), options)];
        }

        return texts.map(text => detect(text, options));
    }

    /**
     * Generate common patterns for specific languages
     * @param {string} language - Language code ('en', 'id', 'th', 'vi', etc.)
     * @returns {object} Language-specific supportKeywords
     */
    function getLanguagePatterns(language = 'all') {
        const patterns = {
            en: {
                supportKeywords: [
                    "bet", "casino", "gambling", "jackpot", "poker", "slot", "win", "deposit",
                    "bonus", "spin", "play", "vip", "fortune", "lucky", "prize", "free"
                ],
                domains: [
                    "bet", "casino", "gambling", "play", "game", "win", "luck", "fortune", "vegas"
                ]
            },
            id: {
                supportKeywords: [
                    "judi", "slot", "togel", "maxwin", "gacor", "menang", "jackpot", "deposit",
                    "bonus", "daftar", "situs", "link", "alternatif", "terpercaya", "terbaik", "resmi"
                ],
                domains: [
                    "slot", "togel", "judi", "bet", "toto", "game", "win", "gacor", "maxwin", "untung"
                ]
            },
            vi: {
                supportKeywords: [
                    "cá cược", "đánh bạc", "sòng bạc", "khe", "xổ số", "thắng", "tiền thưởng",
                    "quay miễn phí", "đặt cược", "may mắn", "đăng ký", "người chơi", "vip",
                    " ca cuoc ", " danh bac ", " song bac ", " khe ", " xo so ", " thang ", " tien thuong ",
                    " quay mien phi ", " dat cuoc ", " may man ", " dang ky ", " nguoi choi "
                ],
                domains: [
                    "casino", "bet", "win", "slot", "game", "lucky", "vip", "play", "cược", "thắng"
                ]
            },
            th: {
                supportKeywords: [
                    "การพนัน", "คาสิโน", "สล็อต", "พนัน", "เดิมพัน", "แทง", "โบนัส", "ฟรีสปิน",
                    "ถอนเงิน", "ฝากเงิน", "สมัคร", "รับโบนัส", "โชคดี", "ชนะ", "เล่น"
                ],
                domains: [
                    "คาสิโน", "สล็อต", "พนัน", "เดิมพัน", "แทง", "โบนัส", "ชนะ", "เล่น", "casino", "bet"
                ]
            }
        };

        if (language === 'all') {
            // Combine all language patterns
            const combined = {
                supportKeywords: [],
                domains: []
            };

            Object.values(patterns).forEach(langPatterns => {
                combined.supportKeywords = [...combined.supportKeywords, ...langPatterns.supportKeywords];
                combined.domains = [...combined.domains, ...langPatterns.domains];
            });

            // Remove duplicates
            combined.supportKeywords = [...new Set(combined.supportKeywords)];
            combined.domains = [...new Set(combined.domains)];

            return combined;
        }

        // Return language-specific patterns or English as fallback
        return patterns[language] || patterns.en;
    }

    // Return public API
    return {
        detect,
        detectBatch,
        loadPatterns: async function(filePath) {
            return await loadkeywords(filePath);
        },
        createDetector,
        getLanguagePatterns,
        version: "1.0.2"
    };
})();
// Export for CommonJS environments
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = {
        GamblingDetector, GbDetector:GamblingDetector
    };

} else if (typeof exports !== 'undefined' && typeof exports?.default !== 'undefined') {
    // Export for ES modules
    exports.default = {
        GamblingDetector, GbDetector:GamblingDetector
    };
}