/**
 * 3-strategy parser for AI-generated JSON responses.
 * 1. Direct JSON.parse
 * 2. Extract first {...} block via regex and parse
 * 3. Repair truncated/unclosed JSON (close brackets, strip trailing commas)
 *
 * Returns parsed object or null if all strategies fail.
 */
function parseAIJson(text) {
  if (!text || typeof text !== 'string') return null;

  // Strategy 1: direct parse
  try {
    return JSON.parse(text);
  } catch (_) {}

  // Strategy 2: regex extract first {...} block
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch (_) {}

  // Strategy 3: repair truncated JSON
  try {
    const match = text.match(/\{[\s\S]*\}?/);
    if (!match) return null;
    let fixed = match[0].replace(/,\s*$/, '');
    const opens = { '{': 0, '[': 0 };
    const closes = { '}': '{', ']': '[' };
    let inString = false;
    let escape = false;
    for (const ch of fixed) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{' || ch === '[') opens[ch]++;
      if (ch === '}' || ch === ']') opens[closes[ch]]--;
    }
    if (inString) fixed += '"';
    for (let i = 0; i < opens['[']; i++) fixed += ']';
    for (let i = 0; i < opens['{']; i++) fixed += '}';
    fixed = fixed.replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(fixed);
  } catch (_) {
    return null;
  }
}

module.exports = { parseAIJson };
