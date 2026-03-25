export function setButtonSize(button, canvas, size_x, size_y)
{
	button.widthInPixels = canvas.width * size_x;
	button.heightInPixels = canvas.height * size_y;
}

export function setButtonPos(button, canvas, pos_x, pos_y)
{
	button.left =  pos_x * ((canvas.width - button.widthInPixels) / 2);
	button.top =  pos_y * ((canvas.height - button.heightInPixels) / 2);
}
