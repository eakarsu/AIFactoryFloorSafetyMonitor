const rateLimit = require('express-rate-limit');

let ipKeyGenerator;
try {
  ({ ipKeyGenerator } = require('express-rate-limit'));
} catch (_) {
  ipKeyGenerator = null;
}

const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: (req, res) => {
    if (req.user && req.user.id) return `user:${req.user.id}`;
    if (ipKeyGenerator) return ipKeyGenerator(req, res);
    return req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI analysis requests. Please try again after an hour.' }
});

module.exports = { aiRateLimiter };
