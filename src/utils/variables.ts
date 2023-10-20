const { env } = process as { env: { [key: string]: string } };

export const {
  MONGODB_URL: DB_URL,
  MAILTRAP_USER,
  MAILTRAP_PASSWORD,
  VERIFICATION_EMAIL,
  PASSWORD_RESET_LINK,
  SIGN_IN_URL,
  JWT_SECRET,
  CLOUDINARY_NAME,
  CLOUDINARY_KEY,
  CLOUDINARY_SECRET,
} = env;
