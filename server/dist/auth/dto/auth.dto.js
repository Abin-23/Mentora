"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetPasswordDto = exports.ForgotPasswordDto = exports.LoginDto = exports.RegisterDto = void 0;
class RegisterDto {
    full_name;
    email;
    password;
}
exports.RegisterDto = RegisterDto;
class LoginDto {
    email;
    password;
}
exports.LoginDto = LoginDto;
class ForgotPasswordDto {
    email;
}
exports.ForgotPasswordDto = ForgotPasswordDto;
class ResetPasswordDto {
    token;
    newPassword;
}
exports.ResetPasswordDto = ResetPasswordDto;
//# sourceMappingURL=auth.dto.js.map