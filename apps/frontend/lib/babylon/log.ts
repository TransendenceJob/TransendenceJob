export function log(
	DEBUG: boolean, 
	payload: string) {
	if (DEBUG)
		console.log("BABYLON: ", payload)
}
