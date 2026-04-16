import * as BABYLON from "@babylonjs/gui"

https://playground.babylonjs.com/#VIOI4J

class GameNotifications {
    private texts: Array<BABYLON.GUI.TextBlock>;
    private gui: BABYLON.GUI.AdvancedDynamicTexture;
    private canvas: HTMLCanvasElement;
    public topPosition: number;
    public fontSize: number = 24;
    public color: string = "#63a6d0";
    public spread: number = 1.5 * this.fontSize;
    public scrollSpeed: number = 0.5;

    constructor(gui: BABYLON.GUI.AdvancedDynamicTexture, canvas: HTMLCanvasElement) {
        this.gui = gui;
        this.canvas = canvas;
        this.texts = [];
        this.topPosition = -canvas.height / 2;
    }

    add(text: string) {
        const newest = new BABYLON.GUI.TextBlock("notification", text);
        newest.top = this.topPosition;
        newest.fontSize = this.fontSize;
        newest.color = this.color;
        newest.top = this.topPosition + this.fontSize / 2 + this.texts.length * this.spread;

        this.texts.push(newest);
        this.gui.addControl(newest);
    }
}