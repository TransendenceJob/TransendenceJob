import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AchivementsService } from './achivements.service';
import { CreateAchivementDto } from './dto/create-achivement.dto';
import { UpdateAchivementDto } from './dto/update-achivement.dto';

@Controller('achivements')
export class AchivementsController {
  constructor(private readonly achivementsService: AchivementsService) {}

  @Post()
  create(@Body() createAchivementDto: CreateAchivementDto) {
    return this.achivementsService.create(createAchivementDto);
  }

  @Get()
  findAll() {
    return this.achivementsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.achivementsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAchivementDto: UpdateAchivementDto) {
    return this.achivementsService.update(+id, updateAchivementDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.achivementsService.remove(+id);
  }
}
