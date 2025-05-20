const { GB } = require("../dist/");

// Initialize gambling detector
GB.init();

// Test configuration
const detectionConfig = {
  sensitivityLevel: 2,
  includeAnalysis: true,
  detectRepetition: true,
  detectUrlPatterns: true,
  detectEvasionTechniques: true,
  detectContextualIndicators: true,
  extractContactInfo: true,
  debug: false,
  ...GB.GamblingDetector.getLanguagePatterns('all')
};

// Test comments
const testComments = [
  {
    text: "This is a normal comment with no gumbling content.",
    expectGambling: false
  },
  {
    text: "Main judi online sekarang di situs kami, bonus 100%!",
    expectGambling: true
  },
  {
    text: "Dapatkan bonus deposit 100rb, link di bio wa 08123456789",
    expectGambling: true
  },
  {
    text: "B3tting g4m3s av4il4ble now with b0nus in our w3bsite",
    expectGambling: true
  },
  {
    text: "I really enjoyed this video! Thanks for sharing.",
    expectGambling: false
  },
  {
    text: "Try our s-l-o-t games at slt.site/win contact WA +6281234567",
    expectGambling: true
  },
  {
    text: "hanya di garuda123",
    expectGambling: true
  },
  {
    text: "berapa angka 12 + 22?.",
    expectGambling: false
  }
];

// Run tests
console.log("=== GAMBLING DETECTOR TEST ===\n");

testComments.forEach((test, index) => {
  console.log(`Test #${index + 1}: ${test.text.substring(0, 50)}${test.text.length > 50 ? '...' : ''}`);
  
  // Run detection
  const result = GB.GamblingDetector.detect(test.text, detectionConfig);
  
  // Calculate simplified checkpoint
  let checkpoint = 0;
  checkpoint += result.isGambling ? 1 : 0;
  checkpoint += result.confidence?.match(/high|medium/gi) ? 1 : 0;
  checkpoint += result.checkpoint > 0.6 ? 0.5 : 0;
  
  // Determine if it would be flagged
  const wouldFlag = checkpoint > 1.6;
  
  // Print results
  console.log(`- Is Gambling: ${result.isGambling}`);
  console.log(`- Confidence: ${result.confidence}`);
  console.log(`- Checkpoint: ${result.checkpoint}`);
  console.log(`- Would Flag: ${wouldFlag}`);
  console.log(`- Expected: ${test.expectGambling}`);
  console.log(`- Test ${wouldFlag === test.expectGambling ? 'PASSED' : 'FAILED'}`);
  
  if (result.analysisDetails) {
    console.log("- Analysis Details:");
    console.log(`  - Gambling Terms: ${result.analysisDetails.gamblingTerms?.join(', ') || 'None'}`);
    console.log(`  - URLs: ${result.analysisDetails.urls?.join(', ') || 'None'}`);
    console.log(`  - Contact Info: ${result.analysisDetails.contactInfo?.join(', ') || 'None'}`);
  }
  
  console.log("\n---\n");
});

console.log("=== TEST COMPLETED ===");