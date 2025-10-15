// backend/services/quizGenerator.js
// Utility to generate random/hybrid quizzes with optional seeding for reproducibility.

/**
 * Mulberry32 seeded PRNG
 * @param {number} a seed
 * @returns {() => number} PRNG in [0,1)
 */
function mulberry32(a) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Shuffle an array in place using Fisher-Yates and provided rng()
 */
function shuffleInPlace(arr, rng = Math.random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Sample k unique items from array using rng()
 */
function sample(arr, k, rng = Math.random) {
  if (k <= 0) return [];
  if (k >= arr.length) return [...arr];
  const copy = [...arr];
  shuffleInPlace(copy, rng);
  return copy.slice(0, k);
}

/**
 * Build a hybrid quiz from a pool of questions (already normalized)
 * Each question must include a 'type' ('multiple-choice' | 'true-false' | 'fill-blank').
 * @param {Array} pool - array of { question, type, options?, correctAnswer, explanation? }
 * @param {Object} counts - { mcq, tf, fill }
 * @param {Object} opts - options { seed?: string|number, shuffleQuestions?: boolean, shuffleOptions?: boolean, title?: string, subject?: string }
 */
function generateHybrid(pool, counts, opts = {}) {
  const seed = opts.seed != null ? String(opts.seed) : null;
  const seedNum = seed ? Array.from(seed).reduce((acc, c) => (acc * 31 + c.charCodeOf ? c.charCodeOf(0) : c.charCodeAt(0)) >>> 0, 0xA5F3C1) : Math.floor(Math.random() * 2**31);
  const rng = mulberry32(seedNum);
  const byType = {
    'multiple-choice': pool.filter(q => q.type === 'multiple-choice'),
    'true-false': pool.filter(q => q.type === 'true-false'),
    'fill-blank': pool.filter(q => q.type === 'fill-blank' || q.type === 'identification'),
  };

  const wantMcq = Math.max(0, counts?.mcq || 0);
  const wantTf = Math.max(0, counts?.tf || 0);
  const wantFill = Math.max(0, counts?.fill || 0);

  const picked = [
    ...sample(byType['multiple-choice'], wantMcq, rng),
    ...sample(byType['true-false'], wantTf, rng),
    ...sample(byType['fill-blank'], wantFill, rng),
  ];

  // If insufficient questions for any category, top up randomly from remaining pool
  const need = wantMcq + wantTf + wantFill - picked.length;
  if (need > 0) {
    const remaining = pool.filter(q => !picked.includes(q));
    picked.push(...sample(remaining, need, rng));
  }

  if (opts.shuffleOptions) {
    picked.forEach(q => {
      if (q.type === 'multiple-choice' && Array.isArray(q.options)) {
        shuffleInPlace(q.options, rng);
      }
      if (q.type === 'true-false' && !Array.isArray(q.options)) {
        q.options = ['True', 'False'];
      }
    });
  }

  const questions = opts.shuffleQuestions ? shuffleInPlace(picked, rng) : picked;

  return {
    title: opts.title || 'Hybrid Quiz',
    subject: opts.subject || 'General',
    quizType: 'hybrid',
    questions,
    hybridConfig: {
      counts: { mcq: wantMcq, tf: wantTf, fill: wantFill },
      seed: seedNum,
      shuffleQuestions: !!opts.shuffleQuestions,
      shuffleOptions: !!opts.shuffleOptions,
    },
  };
}

module.exports = {
  generateHybrid,
  mulberry32,
  shuffleInPlace,
  sample,
};
