import { ValidationOptions, ValidatorConstraintInterface } from 'class-validator';
import { TeachingPreference } from '@prisma/client';
export declare class IsInternationalPhoneNumberConstraint implements ValidatorConstraintInterface {
    validate(phone: string): boolean;
    defaultMessage(): string;
}
export declare function IsInternationalPhoneNumber(validationOptions?: ValidationOptions): (object: any, propertyName: string) => void;
export declare class UpdateProfileDto {
    full_name?: string;
    phone?: string;
    teaching_preference?: TeachingPreference;
}
