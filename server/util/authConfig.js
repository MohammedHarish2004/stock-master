const JWT_SECRET = process.env.JWT_SECRET;

if (typeof JWT_SECRET !== 'string' || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters before starting the server.');
}

export { JWT_SECRET };
