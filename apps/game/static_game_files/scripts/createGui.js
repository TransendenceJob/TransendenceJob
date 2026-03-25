export function createGui(scene, canvas, socket)
{
	let count = 0;
	const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI(
		"GUI",
		true,
		scene,
	);

	const socket_status = new BABYLON.GUI.TextBlock("socket_status", "Connection Status: Disconnected");
	socket_status.fontSize = 24;
	socket_status.color = "red";
	const size = socket_status.fontSize.replace('px', '');
	socket_status.top =  -1 * ((canvas.height - size) / 2);
	gui.addControl(socket_status);

	const receiveButton = BABYLON.GUI.Button.CreateSimpleButton("receive", "No Messages received");
	setButtonSize(receiveButton, canvas, 0.8, 0.2);
	setButtonPos(receiveButton, canvas, 1, 1);
	receiveButton.color = "#FFF";
	gui.addControl(receiveButton);

	const button = BABYLON.GUI.Button.CreateSimpleButton("send", "SEND");
	setButtonSize(button, canvas, 0.2, 0.2);
	setButtonPos(button, canvas, -1, 1);
	button.color = "#FFF";
	button.onPointerUpObservable.add(() => {
		count++;
		const data = {
			type: "User clicked",
			timestamp: Date.now(),
			message: `User pressed button for the ${count} time`,
			};
			if (socket && socket.connected) {
				socket.emit('msgToServer', JSON.stringify(data));
			} else {
				console.warn("No Websocket Connection established");
			}
		})
	gui.addControl(button);

	return (gui)
}
