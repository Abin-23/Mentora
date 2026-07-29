export class RegisterDto {
  full_name!: string;
  email!: string;
  password!: string;
}

export class LoginDto {
  email!: string;
  password!: string;
}

export class ForgotPasswordDto {
  email!: string;
}

export class ResetPasswordDto {
  token!: string;
  newPassword!: string;
}
