import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAdminDto {
  @IsString()
  @IsNotEmpty()
  full_name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  frontendUrl?: string;
}

