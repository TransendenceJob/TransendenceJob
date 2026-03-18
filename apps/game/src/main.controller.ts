import { Controller, Get } from '@nestjs/common';

/**
 * Generic Controller
 */
@Controller()
export class MainController {
	@Get()
	helloWorld() {
		return ("Hello World from the Game Service");
	}
}