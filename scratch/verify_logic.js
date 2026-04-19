const { v7: uuidv7, version: uuidVersion } = require('uuid');
const { getAgeGroup, getTopCountry } = require('../src/apiHelpers');
const { validateName } = require('../src/validators');


console.log('--- UUID v7 Check ---');
const id = uuidv7();
console.log('Generated ID:', id);
console.log('UUID Version (should be 7):', uuidVersion(id));

if (uuidVersion(id) !== 7) {
  console.error('CRITICAL: UUID is not version 7!');
  process.exit(1);
}

console.log('\n--- Age Group Classification Check ---');
const ages = [10, 12, 13, 19, 20, 59, 60, 85];
const expectedGroups = ['child', 'child', 'teenager', 'teenager', 'adult', 'adult', 'senior', 'senior'];

ages.forEach((age, i) => {
  const group = getAgeGroup(age);
  console.log(`Age ${age} -> ${group} (Expected: ${expectedGroups[i]})`);
  if (group !== expectedGroups[i]) {
    console.error(`Mismatch for age ${age}`);
  }
});

console.log('\n--- Top Country Classification Check ---');
const countries = [
  { country_id: 'US', probability: 0.1 },
  { country_id: 'NG', probability: 0.8 },
  { country_id: 'GB', probability: 0.1 }
];
const top = getTopCountry(countries);
console.log('Top country:', top.country_id, '(Expected: NG)');

console.log('\n--- Validator Check ---');
const testNames = [
  { val: 'John', expected: { valid: true } },
  { val: '', expected: { status: 400 } },
  { val: '   ', expected: { status: 400 } },
  { val: 123, expected: { status: 422 } },
  { val: null, expected: { status: 400 } }
];

testNames.forEach(test => {
  const res = validateName(test.val);
  const pass = res.valid === test.expected.valid || res.status === test.expected.status;
  console.log(`Input ${JSON.stringify(test.val)} -> Status ${res.status || 'valid'} (${pass ? 'PASS' : 'FAIL'})`);
});

console.log('\n--- VERIFICATION COMPLETE ---');
