import { IsString, IsUUID } from 'class-validator';

export class CreateWhatsappAccountDto {
  @IsString()
  name: string;

  @IsString()
  phoneNumber: string;

  @IsUUID()
  userId: string;
}
