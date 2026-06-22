import { TextBlock, AdvancedDynamicTexture } from "@babylonjs/gui"
import { Scene, ExecuteCodeAction, ActionManager} from '@babylonjs/core'

interface GameNotificationEntry {
    text: TextBlock,
    pos: number;
}

function generateAnimationAction(notif: GameNotifications) {
    const start = notif.top + notif.spread;
    const end = notif.top;
    return new ExecuteCodeAction({
        trigger: ActionManager.OnEveryFrameTrigger,
    },
    () => {
        if (notif.texts.length == 0)
            return ;

        const speed = notif.scrollSpeed * Math.max(0, notif.texts.length - notif.minNotifs) * 0.35;
        // An alternative, which makes speed changes happen more smoothely
        // const speed = this.scrollSpeed * ((this.texts.length - 1 + this.texts[0].text.alpha) - this.minNotifs) * 0.35;
        
        for (let i = 0; i < notif.texts.length && notif.texts[i]; i++) {
            const entry = notif.texts[i];
            // Fade out
            if (entry.pos <= start) {
                const alpha = (entry.pos - end) / (start - end);
                entry.text.alpha = Math.max(0, Math.min(1, alpha));
            }
            // Move up
            entry.text.top = entry.pos - speed;
            entry.pos -= speed;
            // Delete entries when fully faded
            if (entry.pos < end) {
                entry.text.dispose();
                notif.texts.splice(i, 1);
                i--;
            }
        }
    })
}

/**
 * @param gui GUI element that gets control of the notification text blocks
 * @param canvas_height the height property of the Babylon Canvas (canvas.height)
 * @param scene Scene to use for animating texts to move
 * 
 * @property scene reference to scene
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
 * @property action reference to action that controls the animation and needs to be stored so it can be unregistered later
 *  
 * @function add() Used to add a new notification
 */
export class GameNotifications {
    private scene: Scene;
    public texts: Array<GameNotificationEntry>;
    private buffer: Array<string>;
    private gui: AdvancedDynamicTexture;
    private canvasRef: HTMLCanvasElement;
    private started: boolean;
    public spread: number;
    public top: number;
    public fontSize: number = 24;
    public color: string = "#63a6d0";
    public scrollSpeed: number = 1;
    public minNotifs: number = 2;
    public maxNotifs: number = 50;
    public maxNotifLength = 120;
    public action: ExecuteCodeAction;

    constructor(gui: AdvancedDynamicTexture, canvas: HTMLCanvasElement, scene: Scene) {
        this.scene = scene;
        this.texts = [];
        this.buffer = [];
        this.gui = gui;
        this.canvasRef = canvas;
        this.started = false;
        this.spread = 1.25 * this.fontSize;
        this.top = 0;

        // Animation of texts fading
        this.action = generateAnimationAction(this);
        scene.actionManager.registerAction(this.action);
    }

    /**
     * @brief Sends a new notification to the message system
     * @param text Message to display
     * @warning if message would exceed maxNotifs it is ignored
     * @note cuts off messages if they are longer then maxNotifLength
     * @note Messages will only appear, after start() has been called
     */
    add(text: string) {
        // Limitting input, messages may be swallowed
        if (this.texts.length >= this.maxNotifs) {
            return ;
        }

        if (!this.started) {
            this.buffer.push(text);
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
            this.top + this.spread :
            this.texts[this.texts.length -1].pos + this.spread;
        newest.top = position;
        this.texts.push({text: newest, pos: position});
        this.gui.addControl(newest);
    }


    /**
     * Call this when the canvas is properly set up to make the stored messages appear
     */
    start() {
        this.started = true;
        this.top =  -this.canvasRef.height / 2 + this.fontSize;
        this.scene.actionManager.unregisterAction(this.action);
        this.action = generateAnimationAction(this);
        this.buffer.forEach((text) => {
            this.add(text);
        })
        
    }

    dispose() {
        this.scene.actionManager.unregisterAction(this.action);
        this.started = false;
        this.texts.forEach((text) => {
            text.text.dispose();
        })
        this.texts = [];
        this.buffer = [];
    }
}