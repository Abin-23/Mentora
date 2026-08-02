import { IsEmail, IsString, MinLength, MaxLength, IsStrongPassword, Matches, registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import validateEmail from 'deep-email-validator';

@ValidatorConstraint({ async: true })
export class IsNotDisposableEmailConstraint implements ValidatorConstraintInterface {
  async validate(email: any, args: ValidationArguments) {
    if (typeof email !== 'string') return false;
    try {
      // Validate regex, typo, disposable, and MX records. 
      // We skip SMTP check because it can be slow and unreliable for some domains.
      const res = await validateEmail({
        email: email,
        validateRegex: true,
        validateMx: true,
        validateTypo: true,
        validateDisposable: true,
        validateSMTP: false,
      });
      return res.valid;
    } catch (e) {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return 'The email address is invalid.';
  }
}

export function IsNotDisposableEmail(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotDisposableEmailConstraint,
    });
  };
}

export class RegisterDto {
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters long' })
  @MaxLength(100)
  @Matches(/^[^0-9]+$/, { message: 'Full name cannot contain numbers' })
  full_name!: string;

  @IsEmail()
  @IsNotDisposableEmail()
  email!: string;

  @IsString()
  @IsStrongPassword(
    { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
    { message: 'Password must be at least 8 characters and contain at least 1 uppercase, 1 lowercase, 1 number, and 1 symbol' }
  )
  password!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @IsStrongPassword(
    { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
    { message: 'Password must be at least 8 characters and contain at least 1 uppercase, 1 lowercase, 1 number, and 1 symbol' }
  )
  newPassword!: string;
}
