import { Controller, Get, Request, Response } from '@nestjs/common';
import { AppService } from './app.service';
import axios from "axios";

const http = require('axios');

@Controller()
export class LobbyController {
  constructor(private readonly appService: AppService) {}
  
  @Get("/bff/lobby")
  async getHello() {
    const response = await axios.get("http://game_service:3001/");
    console.log(response.data)
    return (response.data);
  }
}
