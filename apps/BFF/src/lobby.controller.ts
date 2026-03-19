import { Controller, Get} from '@nestjs/common';
import axios from "axios";

const http = require('axios');

@Controller()
export class LobbyController {
  constructor() {}
  
  @Get("/bff/lobby")
  async getHello() {
    var url: string = process.env.GAME_SERVICE_HTTP_URL ?? "https://localhost:3001";
    url += "/lobby"
    const response = await axios.get(url);
    console.log(response.data);
    return (response.data);
  }
}
