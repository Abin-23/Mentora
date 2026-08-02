import { ValidationOptions, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
export declare class IsNotDisposableEmailConstraint implements ValidatorConstraintInterface {
    validate(email: any, args: ValidationArguments): Promise<boolean>;
    defaultMessage(args: ValidationArguments): string;
}
export declare function IsNotDisposableEmail(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
export declare class RegisterDto {
    full_name: string;
    email: string;
    password: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ResetPasswordDto {
    token: string;
    newPassword: string;
}
