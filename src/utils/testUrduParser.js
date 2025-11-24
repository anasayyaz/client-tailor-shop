/**
 * Test file for Urdu Speech Parser
 * Run this to test the parser with sample Urdu speech data
 */

import { parseUrduSpeech, validateParsedData } from './urduSpeechParser';

// Test case from the user's example
const sampleSpeech = "نام علی رزا، فون نمبر 03-04-09-89-290، شلوار ساڈے نتالیس، بوٹن پندرہ، شلوار گیرہ ستارہ، شلوار آسن ساڈے سولہ، کمیز کی لینت ساڈے چالیس، چاتی سوا بائیس، کمر سوا بائیس، شلڈر اٹھارہ، بازو ساڈے تیس، گلہ پندرہ، گیرہ پونے تیس، مودہ پونے نو، چاتی 49، کمر 38، سریل نمبر 954A";

console.log('=================================');
console.log('Testing Urdu Speech Parser');
console.log('=================================\n');

console.log('Input Speech:');
console.log(sampleSpeech);
console.log('\n---\n');

const parsed = parseUrduSpeech(sampleSpeech);

console.log('Parsed Data:');
console.log(JSON.stringify(parsed, null, 2));
console.log('\n---\n');

const validation = validateParsedData(parsed);

console.log('Validation Result:');
console.log('Is Valid:', validation.isValid);
if (!validation.isValid) {
  console.log('Errors:', validation.errors);
}

console.log('\n=================================');
console.log('Expected Output:');
console.log('=================================');
console.log({
  customer: {
    name: 'علی رزا',
    phone: '03040989290',
    serialNumber: '954A'
  },
  suitDetails: [
    {
      suitType: 'Shalwar Kameez',
      items: [
        {
          itemName: 'شلوار',
          sizes: [
            { name: 'Length', value: 39.5 },
            { name: 'Bottom', value: 15 },
            { name: 'Ghera', value: 17 },
            { name: 'Aasan', value: 16.5 }
          ]
        },
        {
          itemName: 'قمیض',
          sizes: [
            { name: 'Length', value: 40.5 },
            { name: 'Chest', value: 49 },
            { name: 'Waist', value: 38 },
            { name: 'Shoulder', value: 18 },
            { name: 'Sleeve Length', value: 30.5 },
            { name: 'Neck', value: 15 },
            { name: 'Ghera', value: 29.75 },
            { name: 'Moda', value: 8.75 }
          ]
        }
      ]
    }
  ]
});

console.log('\n=================================');

// Test other samples
const testCases = [
  "نام احمد، فون 0300-1234567، شلوار تیس، بوٹن دس",
  "کمیز لینت پچاس، چاتی بائیس، سریل نمبر 100A",
  "شلوار ساڈے چالیس، کمیز ڈیرھ میٹر"
];

console.log('\nAdditional Test Cases:');
console.log('=================================\n');

testCases.forEach((testCase, index) => {
  console.log(`Test Case ${index + 1}:`);
  console.log(`Input: ${testCase}`);
  const result = parseUrduSpeech(testCase);
  console.log('Output:', JSON.stringify(result, null, 2));
  console.log('---\n');
});

