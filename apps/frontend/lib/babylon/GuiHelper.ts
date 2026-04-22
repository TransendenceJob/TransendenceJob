// @ts-ignore
import { AdvancedDynamicTexture } from '@babylonjs/gui';
import { GameNotifications } from './notifications/GameNotifications';

export class GuiHelper {
	public textGui: AdvancedDynamicTexture;
	public buttonGui: AdvancedDynamicTexture;
	public notifications: GameNotifications;
	constructor(input: {
		textGui: AdvancedDynamicTexture;
		buttonGui: AdvancedDynamicTexture;
		notifications	: GameNotifications;
	}) {
		this.textGui = input.textGui;
		this.buttonGui = input.buttonGui;
		this.notifications = input.notifications;
	}

	dispose() {
		this.textGui.dispose();
		this.buttonGui.dispose();
		this.notifications.dispose();
	}
}