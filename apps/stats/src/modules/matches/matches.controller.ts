import { Body, Controller, Param, Post } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { UUID } from 'node:crypto';
import { CreateMatchDto } from './dto/create.match.dto';

@Controller('match')
export class MatchesController {
  constructor(private matchService: MatchesService) {}
  @Post()
  createMatch(@Body() matchDto: CreateMatchDto) {
    console.log('MATCH: ', matchDto);
    console.log('CAME TO THE MATHCH CONTROLLER');
    return this.matchService.createMatch(matchDto);
  }
}
