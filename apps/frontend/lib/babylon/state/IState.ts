export interface IState {
	enter(): void;
	exit(): void;
	tick(): void;
}