"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateEnrollmentDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_enrollment_dto_1 = require("./create-enrollment.dto");
class UpdateEnrollmentDto extends (0, mapped_types_1.PartialType)(create_enrollment_dto_1.CreateEnrollmentDto) {
}
exports.UpdateEnrollmentDto = UpdateEnrollmentDto;
//# sourceMappingURL=update-enrollment.dto.js.map