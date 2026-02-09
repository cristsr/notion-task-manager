import { IsNumber, IsOptional, IsString } from 'class-validator';
import { NotifierTypes } from '../types';

export class NotificationInput {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  url: string;

  @IsString()
  @IsOptional()
  urlTitle: string;

  @IsNumber()
  @IsOptional()
  ttl?: number;

  @IsString()
  @IsOptional()
  provider?: NotifierTypes;

  constructor(input: NotificationInput) {
    Object.assign(this, input);
  }
}
