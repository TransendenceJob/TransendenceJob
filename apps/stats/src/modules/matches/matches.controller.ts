import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { UUID } from 'node:crypto';
import { CreateMatchDto } from './dto/create.match.dto';
import { UpdateMatchDto } from './dto/update.match.dto';
import { UpdateMatchParticipantDto } from './dto/update.match.participant.dto';

@Controller('match')
export class MatchesController {
  constructor(private matchService: MatchesService) {}

  /* add match */
  @Post()
  createMatch(@Body() matchDto: CreateMatchDto) {
    return this.matchService.createMatch(matchDto);
  }

  @Get()
  getAllMatch() {
    return this.matchService.getMatches();
  }

  @Get(':matchId')
  getMathById(@Param('matchId', ParseUUIDPipe) matchId: string) {
    return this.matchService.getMatchById(matchId);
  }

  @Get(':matchId/members')
  getParticipants(@Param('matchId') matchId: string) {
    return this.matchService.getParicipants(matchId);
  }

  @Patch(':matchId')
  updateMatch(
    @Param('matchId') matchId: string,
    @Body() updateMatchDto: UpdateMatchDto,
  ) {
    return this.matchService.updateMatch(matchId, updateMatchDto);
  }

  @Post(':matchId/participants/:userId')
  addParticipant(
    @Param('matchId') matchId: string,
    @Param('userId') userId: string,
    @Body() participantData?: UpdateMatchParticipantDto,
  ) {
    return this.matchService.addParticipant(matchId, userId, participantData);
  }

  @Patch(':matchId/participants/:userId')
  updateParticipant(
    @Param('matchId') matchId: string,
    @Param('userId') userId: string,
    @Body() updateParticipantDto: UpdateMatchParticipantDto,
  ) {
    return this.matchService.updateParticipant(
      matchId,
      userId,
      updateParticipantDto,
    );
  }

  /* Delete match by id */
  @Delete(':matchId')
  removeById(@Param('matchId', ParseUUIDPipe) matchId: string) {
    return this.matchService.removeMatchById(matchId);
  }

  /* delete a paricipant from a match: left the loby */
  @Delete(':matchId/participants/:userId')
  removeParticipant(
    @Param('matchId') matchId: string,
    @Param('userId') userId: string,
  ) {
    return this.matchService.removeParticipant(matchId, userId);
  }

  // update the

  @Delete()
  deleteAll() {
    return this.matchService.deleteAll();
  }
}
