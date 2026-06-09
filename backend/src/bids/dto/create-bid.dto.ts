import { IsNumber, Min } from 'class-validator';

export class CreateBidDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsNumber()
  itemId: number;
} 