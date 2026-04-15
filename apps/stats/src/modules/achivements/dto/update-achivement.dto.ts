import { PartialType } from '@nestjs/mapped-types';
import { CreateAchivementDto } from './create-achivement.dto';

export class UpdateAchivementDto extends PartialType(CreateAchivementDto) {}
