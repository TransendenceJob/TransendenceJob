import { TextBlock, AdvancedDynamicTexture } from "@babylonjs/gui"
import { Scene, ExecuteCodeAction, ActionManager} from '@babylonjs/core'

interface GameNotificationEntry {
    text: TextBlock,
    pos: number;
}
/**
 * @param gui GUI element that gets control of the notification text blocks
 * @param canvas_height the height property of the Babylon Canvas (canvas.height)
 * @param scene Scene to use for animating texts to move
 * 
 * @property texts Array of each notifications GUI text object and its height
 * @property gui Reference to the GUI element this is displayed on
 * @property canvas reference to the canvas of this page, needed for some values
 * @property spread amount of distance between each notification
 * @property topPosition highest possible position the texts may have before being deleted
 * @property starfFadePosition height at which to start making texts fade 
 * @property endFadePosition height at which fading completes
 * @property fontSize size of font in pixels
 * @property color string with HEX code
 * @property scrollSpeed multiplier for how fast notifications move
 * @property minNotifs amount of notifications that should be left on screen
 * @property maxNotifs amount of messages that may be handled, before adding gets ignored
 *  
 * @function add() Used to add a new notification
 */
export class GameNotifications {
    private texts: Array<GameNotificationEntry>;
    private gui: AdvancedDynamicTexture;
    public spread: number;
    public topPosition: number;
    public startFadePosition: number;
    public endFadePosition: number;
    public fontSize: number = 24;
    public color: string = "#63a6d0";
    public scrollSpeed: number = 1;
    public minNotifs: number = 2;
    public maxNotifs: number = 25;
    public maxNotifLength = 120;

    constructor(gui: AdvancedDynamicTexture, canvas_height: number, scene: Scene) {
        this.texts = [];
        this.gui = gui;
        this.spread = 1.25 * this.fontSize;
        this.topPosition =  -canvas_height / 2 + this.fontSize;
        this.startFadePosition = -canvas_height / 2 + this.spread + this.fontSize;
        this.endFadePosition = -canvas_height / 2 + this.fontSize * 1;

        // Animation of texts fading
        scene.actionManager.registerAction(new ExecuteCodeAction({
            trigger: ActionManager.OnEveryFrameTrigger,
        },
        () => {
            if (this.texts.length == 0)
                return ;
            const start = this.startFadePosition;
            const end = this.endFadePosition;
            const speed = this.scrollSpeed * Math.max(0, this.texts.length - this.minNotifs) * 0.35;
            // An alternative, which makes speed changes happen more smoothely
            // const speed = this.scrollSpeed * ((this.texts.length - 1 + this.texts[0].text.alpha) - this.minNotifs) * 0.35;
           
            for (let i = 0; i < this.texts.length && this.texts[i]; i++) {
                const entry = this.texts[i];
                // Fade out
                if (entry.pos <= start && entry.pos >= end) {
                    entry.text.alpha = 1 - (entry.pos - start) / (end - start);
                }
                // Move up
                entry.text.top = entry.pos - speed;
                entry.pos -= speed;
                // Delete entries when fully faded
                if (entry.pos < this.topPosition) {
                    entry.text.dispose();
                    this.texts.splice(i, 1);
                    i--;
                }
            }
        }));
    }

    /**
     * @brief Sends a new notification to the message system
     * @param text Message to display
     * @warning if message would exceed maxNotifs it is ignored
     * @note cuts off messages if they are longer then maxNotifLength
     */
    add(text: string) {
        // Limitting input, messages may be swallowed
        if (this.texts.length >= this.maxNotifs) {
            return ;
        }
        // Cut off messages, maximum has to at least allow 3 characters
        const maxLength = (this.maxNotifLength >= 3) ?
            this.maxNotifLength :
            3;
        const newest = (text.length >= maxLength) ?
            new TextBlock("notification", text.slice(0, maxLength - 3) + "..."):
            new TextBlock("notification", text);
        newest.fontSize = this.fontSize;
        newest.color = this.color;
        const position = (this.texts.length == 0) ?
            this.topPosition + this.spread :
            this.texts[this.texts.length -1].pos + this.spread;
        newest.top = position;
        this.texts.push({text: newest, pos: position});
        this.gui.addControl(newest);
    }
}