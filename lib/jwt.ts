import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key'; // Ensure you store this in env variables

export const generateToken = (userId: string) => {
  return jwt.sign({ userId }, SECRET_KEY, { expiresIn: '7d' }); // 7 days expiry
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, SECRET_KEY) as { userId: string };
  } catch (error) {
  console.log(error, "ERROR")
    return null; // Invalid token
  }
};
