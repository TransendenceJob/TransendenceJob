// @ts-ignore
import { Button} from "@babylonjs/gui";

export function setButtonSize(
	button: Button, 
	canvas: any, 
	size_x: number, 
	size_y: number)
{
	button.widthInPixels = canvas.width * size_x;
	button.heightInPixels = canvas.height * size_y;
}

export function setButtonPos(
	button: Button, 
	canvas: any, 
	pos_x: number, 
	pos_y: number)
{
	button.left =  pos_x * ((canvas.width - button.widthInPixels) / 2);
	button.top =  pos_y * ((canvas.height - button.heightInPixels) / 2);
}
