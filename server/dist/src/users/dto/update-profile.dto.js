"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProfileDto = exports.IsInternationalPhoneNumberConstraint = void 0;
exports.IsInternationalPhoneNumber = IsInternationalPhoneNumber;
const class_validator_1 = require("class-validator");
const libphonenumber_js_1 = require("libphonenumber-js");
let IsInternationalPhoneNumberConstraint = class IsInternationalPhoneNumberConstraint {
    validate(phone) {
        try {
            return (0, libphonenumber_js_1.isValidPhoneNumber)(phone);
        }
        catch {
            return false;
        }
    }
    defaultMessage() {
        return 'Phone number must be a valid international phone number starting with a country code (+).';
    }
};
exports.IsInternationalPhoneNumberConstraint = IsInternationalPhoneNumberConstraint;
exports.IsInternationalPhoneNumberConstraint = IsInternationalPhoneNumberConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ async: false })
], IsInternationalPhoneNumberConstraint);
function IsInternationalPhoneNumber(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsInternationalPhoneNumberConstraint,
        });
    };
}
class UpdateProfileDto {
    full_name;
    phone;
}
exports.UpdateProfileDto = UpdateProfileDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[a-zA-Z\s]*$/, {
        message: 'Name can only contain letters and spaces',
    }),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "full_name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    IsInternationalPhoneNumber(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "phone", void 0);
//# sourceMappingURL=update-profile.dto.js.map