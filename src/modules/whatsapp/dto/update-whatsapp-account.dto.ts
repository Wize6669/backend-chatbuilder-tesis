import { PartialType } from '@nestjs/mapped-types';
import { CreateWhatsappAccountDto } from './create-whatsapp-account.dto';

export class UpdateWhatsappAccountDto extends PartialType(
  CreateWhatsappAccountDto,
) {}
