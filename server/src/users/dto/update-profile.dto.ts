import {
  IsOptional,
  IsString,
  MaxLength,
  Matches,
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isValidPhoneNumber } from 'libphonenumber-js';

@ValidatorConstraint({ async: false })
export class IsInternationalPhoneNumberConstraint implements ValidatorConstraintInterface {
  validate(phone: string) {
    try {
      return isValidPhoneNumber(phone);
    } catch {
      return false;
    }
  }

  defaultMessage() {
    return 'Phone number must be a valid international phone number starting with a country code (+).';
  }
}

export function IsInternationalPhoneNumber(
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsInternationalPhoneNumberConstraint,
    });
  };
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z\s]*$/, {
    message: 'Name can only contain letters and spaces',
  })
  @MaxLength(100)
  full_name?: string;

  @IsOptional()
  @IsString()
  @IsInternationalPhoneNumber()
  @MaxLength(20)
  phone?: string;
}
