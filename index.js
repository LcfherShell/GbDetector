const { GB } = require("./dist/");

// Inisialisasi modul deteksi
GB.init();

/**
 * Contoh kalimat yang akan dianalisis
 */
const testSentences = [
  "yu88 maxwin dijamin menang!",
  "J4ckp0t Zeus99 terpercaya - daftar sekarang!",
  "c a s i n o online terbaik dengan deposit dana & pulsa",
  "situs judi online slot gacor maxwin hari ini",
  "Get rich quick with winning bets at my-gambling-site.com",
  "This is a normal sentence with no gambling content.",
  "Z.e.u.s g.a.c.o.r m.a.x.w.i.n",
  "j*u*d*i o*n*l*i*n*e terbesar",
  "halo kawanku, online dana"
];

/**
 * Konfigurasi deteksi lanjutan (advanced detection config)
 */
const detectionConfig = {
  keywords: ["menang", "maxwin", "deposit", "withdraw", "gacor"],
  domains: ["scamsite.com", "badword"], // renamed blocklist → domains
  allowlist: [],                        // whitelist domain jika ada
  customPatterns: [
    "slot", "zeus", "jackpot", "casino", "poker", "joker",
    "togel", "judi", "jack", "bet", "scatter", "wild"
  ],
  sensitivityLevel: 2,                // 1–5 (semakin rendah semakin sensitif)
  includeAnalysis: true,              // Sertakan info analisis
  detectRepetition: true,             // Deteksi pengulangan karakter mencurigakan
  detectUrlPatterns: true,            // Deteksi pola URL mencurigakan
  detectEvasionTechniques: true,      // Deteksi obfuscation karakter
  detectContextualIndicators: true,   // Deteksi konteks kalimat
  extractContactInfo: true,           // Ekstraksi info kontak (jika ada)
  language: 'id',                     // Fokus bahasa Indonesia
  debug: false,                       // Debug mode
  ...GB.GamblingDetector.getLanguagePatterns('id')
};

/**
 * Fungsi utama untuk menguji deteksi pada tiap contoh
 */
function testGamblingDetection(sentences, config) {
  console.log("=== HASIL DETEKSI KONTEN ===\n");

  sentences.forEach((sentence, index) => {
    console.log(`\n[Contoh ${index + 1}] "${sentence}"`);
    
    const result = GB.GamblingDetector.detect(sentence, config);

    console.log(`→ Skor: ${result.checkpoint}`);
    console.log(`→ Kepercayaan: ${result.confidence}`);
    console.log(`→ Rincian: ${result.details}`);

    if (result.analysis) {
      const highlights = Object.entries(result.analysis)
        .filter(([_, val]) => val === true || (Array.isArray(val) && val.length > 0))
        .map(([key]) => key);

      if (highlights.length) {
        console.log(`→ Analisis: ${highlights.join(', ')}`);
      }
    }
  });

  console.log("\n=== SELESAI ===");
}

// Jalankan tes deteksi
testGamblingDetection(testSentences, detectionConfig);
