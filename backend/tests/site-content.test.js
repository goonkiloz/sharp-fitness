const test = require('node:test');
const assert = require('node:assert/strict');
const { CONTENT_FIELDS, IMAGE_FIELDS, validateTextChanges } = require('../utils/site-content');

test('allows editable body copy', () => {
  assert.equal(validateTextChanges({
    'home.heroTitle': 'Train with purpose.',
    'pricing.program1Description': 'Your training plan, built for you.'
  }), null);
});

test('rejects arbitrary or script-capable field names', () => {
  assert.match(validateTextChanges({ 'admin.isTrainer': 'true' }), /Unknown editable/);
  assert.match(validateTextChanges({ 'home.heroImage': 'https://example.com/image.jpg' }), /Unknown editable/);
  assert.match(validateTextChanges({ '__proto__.secret': 'x' }), /Unknown editable/);
});

test('rejects empty text, wrong types and oversized values', () => {
  assert.match(validateTextChanges({ 'home.heroTitle': ' ' }), /Invalid text/);
  assert.match(validateTextChanges({ 'home.heroTitle': 42 }), /Invalid text/);
  assert.match(validateTextChanges({ 'home.heroTitle': 'a'.repeat(101) }), /Invalid text/);
});

test('rejects unexpected payload shapes', () => {
  assert.match(validateTextChanges(null), /object/);
  assert.match(validateTextChanges([]), /object/);
  assert.match(validateTextChanges('hello'), /object/);
});

test('known media fields are separate from free-text edits', () => {
  assert.deepEqual(IMAGE_FIELDS, ['home.heroImage', 'about.portrait', 'training.photo']);
  assert.ok(Object.keys(CONTENT_FIELDS).length >= 25);
});
