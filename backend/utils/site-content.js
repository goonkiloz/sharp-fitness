// These explicit keys define the safe editing surface: no HTML, scripts, URLs or pricing controls.
const CONTENT_FIELDS = {
  'home.heroTitle': 100, 'home.heroDescription': 450, 'home.introTitle': 120,
  'home.strengthDescription': 500, 'home.onlineDescription': 500, 'home.lifelongDescription': 500,
  'home.introDescription': 500, 'home.ctaTitle': 100,
  'about.title': 110, 'about.intro': 700, 'about.storyTitle': 120, 'about.story': 1300,
  'about.credential1': 180, 'about.credential2': 180, 'about.credential3': 180, 'about.credential4': 180,
  'training.title': 110, 'training.intro': 600, 'training.strengthTitle': 100,
  'training.strengthDescription': 500, 'training.onlineTitle': 100,
  'training.onlineDescription': 500, 'training.lifelongTitle': 100,
  'training.lifelongDescription': 500,
  'pricing.title': 110, 'pricing.intro': 500,
  'pricing.program1Description': 500, 'pricing.program2Description': 500, 'pricing.program3Description': 500,
  'contact.title': 110, 'contact.intro': 500
};
const IMAGE_FIELDS = ['home.heroImage', 'about.portrait', 'training.photo'];
const fields = new Set(Object.keys(CONTENT_FIELDS));
const images = new Set(IMAGE_FIELDS);
function validateTextChanges(changes) {
  if (!changes || Array.isArray(changes) || typeof changes !== 'object') return 'Changes must be an object.';
  for (const [key, value] of Object.entries(changes)) {
    if (!fields.has(key)) return 'Unknown editable text field: ' + key;
    if (typeof value !== 'string' || !value.trim() || value.length > CONTENT_FIELDS[key]) {
      return 'Invalid text for ' + key + '. Maximum ' + CONTENT_FIELDS[key] + ' characters.';
    }
  }
  return null;
}
module.exports = { CONTENT_FIELDS, IMAGE_FIELDS, images, validateTextChanges };
