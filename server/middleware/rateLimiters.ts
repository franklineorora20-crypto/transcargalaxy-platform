import rateLimit from 'express-rate-limit';

// Rate limiters for critical booking and M-Pesa payment APIs
export const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, jaribu tena baada ya dakika 5' },
});

export const stkLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many M-Pesa requests, jaribu tena baada ya dakika 10' },
});

export const verificationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many ticket verification requests. Please wait a moment and try again.' },
});
