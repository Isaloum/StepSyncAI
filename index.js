const fs = require('fs');
const step = process.argv[2];
fs.appendFileSync('steps.log', step + '\n');
console.log('Step saved: ' + step);
