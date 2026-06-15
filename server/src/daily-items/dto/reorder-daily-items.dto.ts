import { ArrayMinSize, IsArray, IsString, Matches } from 'class-validator';

export class ReorderDailyItemsDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  orderedDailyItemIds!: string[];
}
