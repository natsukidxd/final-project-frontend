export class Account {
  id?: string;
  email?: string;
  passwordHash?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  verified?: Date;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpires?: Date;
  passwordReset?: Date;
  created?: Date;
  updated?: Date;
  isVerified?: boolean;
  jwtToken?: string;
  isDeleting?: boolean;
}