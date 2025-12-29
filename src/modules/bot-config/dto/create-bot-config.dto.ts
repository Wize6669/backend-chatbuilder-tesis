import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBotConfigDto {
  @IsUUID()
  whatsappAccountId: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsBoolean()
  useRag?: boolean;

  @IsOptional()
  @IsBoolean()
  useMcp?: boolean;

  @IsOptional()
  @IsString()
  mcpServerUrl?: string;
}
