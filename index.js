const { GB } = require("./dist/");
const { GamblingDetector} = require("./dist/detector");
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = {
      GB,
      GamblingDetector,
      GbDetector:GamblingDetector
    };

} else if (typeof exports !== 'undefined' && typeof exports?.default !== 'undefined') {
    // Export for ES modules
    exports.default = {
      GB,
      GamblingDetector,
      GbDetector:GamblingDetector
    };
};