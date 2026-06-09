import { IsString, IsNumber, Min, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateItemDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  startingPrice: number;

  @IsDate()
  @Type(() => Date)
  endTime: Date;
} 