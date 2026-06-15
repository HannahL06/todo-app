import { IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const itemTypes = ['task', 'note', 'appointment'] as const;

export class CreateItemDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsOptional()
  @IsIn(itemTypes)
  type?: (typeof itemTypes)[number];

  @IsOptional()
  @IsBoolean()
  isRolling?: boolean;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  scheduledDate!: string;
}
