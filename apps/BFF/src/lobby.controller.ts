import { Controller, Get } from '@nestjs/common';
import axios from 'axios';

// For type safety of the axios Response
type LobbyResponse = {
  data: string;
};

@Controller()
export class LobbyController {
  constructor() {}
  @Get('/bff/lobby')
  async getHello(): Promise<string> {
    let url: string =
      process.env.GAME_SERVICE_HTTP_URL ?? 'https://localhost:3001';
    url += '/lobby';
    // Prototype the response.data datatype to be a string for type
    const response: LobbyResponse = await axios.get<string>(url);
    return response.data;
  }
}
