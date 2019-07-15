import { Observable, EventData } from "tns-core-modules/data/observable";
import { Page } from "tns-core-modules/ui/page/page";
import * as application from "tns-core-modules/application";
import * as appSettings from "tns-core-modules/application-settings";
import { AbsoluteLayout } from "tns-core-modules/ui/layouts/absolute-layout";
import { GridLayout, ItemSpec } from "tns-core-modules/ui/layouts/grid-layout";
import { Button } from "tns-core-modules/ui/button";
import { ShowModalOptions } from "tns-core-modules/ui/core/view";
import { GestureEventData, TouchGestureEventData, GestureTypes, PanGestureEventData, PinchGestureEventData } from "tns-core-modules/ui/gestures";
import { Visibility } from "tns-core-modules/ui/enums";
import { prompt, PromptOptions, inputType, capitalizationType, ActionOptions, action, ConfirmOptions, confirm } from "tns-core-modules/ui/dialogs"
import * as platform from "tns-core-modules/platform";
import { VirtualJoystick, VirtualJoystickEventData } from "nativescript-virtual-joystick";
import { BarcodeScanner } from "nativescript-barcodescanner";
import { SocketIO } from "nativescript-socketio";


const OPTIONS = "options/options-root";
const REPEAT_INTERVAL = 40;
const LAST_CONNECTED = "server-last-connected";
const HIDDEN = "hidden-controls";


let CONNECTED: boolean = false;
let EDITING: boolean = false;
let OPTIONS_OPEN: boolean = false;
let HIDE_TIME: number = 0;


export class GamepadModel extends Observable {
	controls: Object = {};
	exclude: string[] = ["gamepad", "main-button", "up-button", "right-button", "down-button", "left-button", "y-button", "x-button", "a-button", "b-button"];
	sio: SocketIO;

	repeat: Object = {};
	locked: Object = {};
	hidden: Set<string> = new Set(JSON.parse(appSettings.getString(HIDDEN, "[]")));

	constructor() {
		super();

		this.controls["main-button"] = new Button();
		this.controls["main-button"].id = "main-button";
		this.controls["main-button"].className = "fas mainBtn";
		this.controls["main-button"].text = String.fromCharCode(0xf11b);
		this.controls["main-button"].on(GestureTypes.longPress, this.showMenu, this);

		this.controls["back-button"] = new Button();
		this.controls["back-button"].id = "back-button";
		this.controls["back-button"].className = "fas ctrlBtn";
		this.controls["back-button"].text = String.fromCharCode(0xf0d9);

		this.controls["start-button"] = new Button();
		this.controls["start-button"].id = "start-button";
		this.controls["start-button"].className = "fas ctrlBtn";
		this.controls["start-button"].text = String.fromCharCode(0xf0da);

		this.controls["left-stick"] = new VirtualJoystick();
		this.controls["left-stick"].id = "left-stick";
		this.controls["left-stick"].className = "stick left";

		this.controls["dpad"] = new GridLayout();
		this.controls["dpad"].id = "dpad";
		this.controls["dpad"].className = "dpad";
		const dpadRow1 = new ItemSpec(1, "auto");
		const dpadRow2 = new ItemSpec(1, "star");
		const dpadRow3 = new ItemSpec(1, "auto");
		const dpadCol1 = new ItemSpec(1, "auto");
		const dpadCol2 = new ItemSpec(1, "star");
		const dpadCol3 = new ItemSpec(1, "auto");
		this.controls["dpad"].addRow(dpadRow1);
		this.controls["dpad"].addRow(dpadRow2);
		this.controls["dpad"].addRow(dpadRow3);
		this.controls["dpad"].addColumn(dpadCol1);
		this.controls["dpad"].addColumn(dpadCol2);
		this.controls["dpad"].addColumn(dpadCol3);
		this.controls["up-button"] = new Button();
		this.controls["up-button"].id = "up-button";
		this.controls["up-button"].className = "fas dpadBtn vertical";
		this.controls["up-button"].text = String.fromCharCode(0xf0d8);
		this.controls["dpad"].addChild(this.controls["up-button"]);
		GridLayout.setRow(this.controls["up-button"], 0);
		GridLayout.setColumn(this.controls["up-button"], 1);
		this.controls["right-button"] = new Button();
		this.controls["right-button"].id = "right-button";
		this.controls["right-button"].className = "fas dpadBtn horizontal";
		this.controls["right-button"].text = String.fromCharCode(0xf0da);
		this.controls["dpad"].addChild(this.controls["right-button"]);
		GridLayout.setRow(this.controls["right-button"], 1);
		GridLayout.setColumn(this.controls["right-button"], 2);
		this.controls["down-button"] = new Button();
		this.controls["down-button"].id = "down-button";
		this.controls["down-button"].className = "fas dpadBtn vertical";
		this.controls["down-button"].text = String.fromCharCode(0xf0d7);
		this.controls["dpad"].addChild(this.controls["down-button"]);
		GridLayout.setRow(this.controls["down-button"], 2);
		GridLayout.setColumn(this.controls["down-button"], 1);
		this.controls["left-button"] = new Button();
		this.controls["left-button"].id = "left-button";
		this.controls["left-button"].className = "fas dpadBtn horizontal";
		this.controls["left-button"].text = String.fromCharCode(0xf0d9);
		this.controls["dpad"].addChild(this.controls["left-button"]);
		GridLayout.setRow(this.controls["left-button"], 1);
		GridLayout.setColumn(this.controls["left-button"], 0);

		this.controls["right-stick"] = new VirtualJoystick();
		this.controls["right-stick"].id = "right-stick";
		this.controls["right-stick"].className = "stick right";

		this.controls["face-buttons"] = new GridLayout();
		this.controls["face-buttons"].id = "face-grid";
		this.controls["face-buttons"].className = "faceGrid";
		const fbRow1 = new ItemSpec(1, "star");
		const fbRow2 = new ItemSpec(1, "star");
		const fbRow3 = new ItemSpec(1, "star");
		const fbCol1 = new ItemSpec(1, "star");
		const fbCol2 = new ItemSpec(1, "star");
		const fbCol3 = new ItemSpec(1, "star");
		this.controls["face-buttons"].addRow(fbRow1);
		this.controls["face-buttons"].addRow(fbRow2);
		this.controls["face-buttons"].addRow(fbRow3);
		this.controls["face-buttons"].addColumn(fbCol1);
		this.controls["face-buttons"].addColumn(fbCol2);
		this.controls["face-buttons"].addColumn(fbCol3);
		this.controls["y-button"] = new Button();
		this.controls["y-button"].id = "y-button";
		this.controls["y-button"].className = "faceButton yBtn vertical";
		this.controls["y-button"].text = "Y";
		this.controls["face-buttons"].addChild(this.controls["y-button"]);
		GridLayout.setRow(this.controls["y-button"], 0);
		GridLayout.setColumn(this.controls["y-button"], 1);
		this.controls["x-button"] = new Button();
		this.controls["x-button"].id = "x-button";
		this.controls["x-button"].className = "faceButton xBtn horizontal";
		this.controls["x-button"].text = "X";
		this.controls["face-buttons"].addChild(this.controls["x-button"]);
		GridLayout.setRow(this.controls["x-button"], 1);
		GridLayout.setColumn(this.controls["x-button"], 0);
		this.controls["b-button"] = new Button();
		this.controls["b-button"].id = "b-button";
		this.controls["b-button"].className = "faceButton bBtn horizontal";
		this.controls["b-button"].text = "B";
		this.controls["face-buttons"].addChild(this.controls["b-button"]);
		GridLayout.setRow(this.controls["b-button"], 1);
		GridLayout.setColumn(this.controls["b-button"], 2);
		this.controls["a-button"] = new Button();
		this.controls["a-button"].id = "a-button";
		this.controls["a-button"].className = "faceButton aBtn vertical";
		this.controls["a-button"].text = "A";
		this.controls["face-buttons"].addChild(this.controls["a-button"]);
		GridLayout.setRow(this.controls["a-button"], 2);
		GridLayout.setColumn(this.controls["a-button"], 1);

		this.controls["left-bumper"] = new Button();
		this.controls["left-bumper"].id = "left-bumper";
		this.controls["left-bumper"].className = "fas bumper left";
		this.controls["left-bumper"].text = `LB    ${String.fromCharCode(0xf3c1)}`;
		// this.controls["left-bumper"].on(GestureTypes.doubleTap, this.onShoulderDoubleTap, this);

		this.controls["left-trigger"] = new Button();
		this.controls["left-trigger"].id = "left-trigger";
		this.controls["left-trigger"].className = "fas trigger left";
		this.controls["left-trigger"].text = `LT ${String.fromCharCode(0xf3c1)}`;
		// this.controls["left-trigger"].on(GestureTypes.doubleTap, this.onShoulderDoubleTap, this);

		this.controls["right-bumper"] = new Button();
		this.controls["right-bumper"].id = "right-bumper";
		this.controls["right-bumper"].className = "fas bumper right";
		this.controls["right-bumper"].text = `RB    ${String.fromCharCode(0xf3c1)}`;
		// this.controls["right-bumper"].on(GestureTypes.doubleTap, this.onShoulderDoubleTap, this);

		this.controls["right-trigger"] = new Button();
		this.controls["right-trigger"].id = "right-trigger";
		this.controls["right-trigger"].className = "fas trigger right";
		this.controls["right-trigger"].text = `RT ${String.fromCharCode(0xf3c1)}`;
		// this.controls["right-trigger"].on(GestureTypes.doubleTap, this.onShoulderDoubleTap, this);
	}

	onLoaded(loadedData: EventData) {
		application.android.on(
			application.AndroidApplication.activityBackPressedEvent,
			(data: application.AndroidActivityBackPressedEventData) => {
				const hidden: Set<string> = new Set(JSON.parse(appSettings.getString(HIDDEN, "[]")));

				data.cancel = true;
				if (EDITING) {
					EDITING = false;
					for (let [controlId, control] of Object.entries(this.controls)) {
						if (!this.exclude.includes(controlId)) {
							control.off(GestureTypes.pan, this.moveControl);
							control.off(GestureTypes.pinch, this.zoomControl);
							control.off(GestureTypes.doubleTap, this.restoreControl);
						}
					}
					for (let controlId of this.hidden) {
						if (!hidden.has(controlId)) {
							this.controls[controlId].visibility = Visibility.visible;
						}
					}
					this.hidden = hidden;
					this.updateLayout();
					this.mainEventsOn();
				} else if (!OPTIONS_OPEN) {
					const page: Page = <Page>this.controls["gamepad"].page;
					// Don't know why but some properties aren't always available
					if (page.frame && page.frame.android && page.frame.android.activity) page.frame.android.activity.finish();
				}
			}, this);
	}

	onLayoutChanged(data: EventData) {
		this.controls["gamepad"] = <AbsoluteLayout> data.object;
		const { width, height } = this.controls["gamepad"].getActualSize();

		this.controls["gamepad"].addChild(this.controls["main-button"]);
		AbsoluteLayout.setTop(this.controls["main-button"], height * 0.15);
		AbsoluteLayout.setLeft(this.controls["main-button"], (width - 48) / 2);

		for (let [ controlId, control ] of Object.entries(this.controls)) {
			if (!this.exclude.includes(controlId)) {
				this.controls["gamepad"].addChild(control);
				if (controlId === "back-button") {
					AbsoluteLayout.setTop(control, height * 0.45);
					AbsoluteLayout.setLeft(control, (width - 48) * 0.4);
				} else if (controlId === "start-button") {
					AbsoluteLayout.setTop(control, height * 0.45);
					AbsoluteLayout.setLeft(control, (width - 48) * 0.6);
				} else if (controlId === "left-stick") {
					AbsoluteLayout.setTop(control, height * 0.45);
					AbsoluteLayout.setLeft(control, -25);
				} else if (controlId === "dpad") {
					AbsoluteLayout.setTop(control, height * 0.65);
					AbsoluteLayout.setLeft(control, width * 0.28);
				} else if (controlId === "right-stick") {
					AbsoluteLayout.setTop(control, height * 0.6);
					AbsoluteLayout.setLeft(control, width * 0.47);
				} else if (controlId === "face-buttons") {
					AbsoluteLayout.setTop(control, height * 0.5);
					AbsoluteLayout.setLeft(control, width * 0.7);
				} else if (controlId === "left-bumper") {
					AbsoluteLayout.setTop(control, height * 0.32);
					AbsoluteLayout.setLeft(control, width * 0.01);
				} else if (controlId === "left-trigger") {
					AbsoluteLayout.setTop(control, height * 0.035);
					AbsoluteLayout.setLeft(control, width * 0.07);
				} else if (controlId === "right-bumper") {
					AbsoluteLayout.setTop(control, height * 0.32);
					AbsoluteLayout.setLeft(control, (width * 0.99) - 192);
				} else if (controlId === "right-trigger") {
					AbsoluteLayout.setTop(control, height * 0.035);
					AbsoluteLayout.setLeft(control, (width * 0.93) - 96);
				}
			}
		}
		this.controls["gamepad"].requestLayout();

		this.mainEventsOn();
		this.updateLayout();
	}

	mainEventsOn() {
		for (let [controlId, control] of Object.entries(this.controls)) {
			if (control instanceof Button) {
				control.on("touch", this.onButtonTouch.bind(this, controlId));
				if (controlId.endsWith("-bumper") || controlId.endsWith("-trigger")) {
					control.on("doubleTap", this.onShoulderDoubleTap, this);
				}
			} else if (controlId.endsWith("-stick")) {
				control.on(VirtualJoystick.moveEvent, (data: VirtualJoystickEventData) => {
					this.emit(`${controlId}-X`, data.xAxis);
					this.emit(`${controlId}-Y`, data.yAxis);
				}, this);
				control.on(GestureTypes.doubleTap, () => {
					this.emit(`${controlId}-press`, 1);
					this.emit(`${controlId}-press`, 0);
				}, this);
			}
		}
		this.controls["left-stick"].enabled = true;
		this.controls["right-stick"].enabled = true;
	}

	mainEventsOff() {
		for (let [controlId, control] of Object.entries(this.controls)) {
			if (control instanceof Button && !this.exclude.includes(controlId)) {
				control.off(GestureTypes.touch);
				if (controlId.endsWith("-bumper") || controlId.endsWith("-trigger")) {
					control.off(GestureTypes.doubleTap, this.onShoulderDoubleTap);
				}
			} else if (controlId.endsWith("-stick")) {
				control.off(VirtualJoystick.moveEvent);
				control.off(GestureTypes.doubleTap);
			}
		}
		this.controls["left-stick"].enabled = false;
		this.controls["right-stick"].enabled = false;
	}

	updateLayout() {
		for (let [controlId, control] of Object.entries(this.controls)) {
			if (!this.exclude.includes(controlId)) {
				control.translateX = appSettings.getNumber(`${controlId}-translate-X`, 0);
				control.translateY = appSettings.getNumber(`${controlId}-translate-Y`, 0);
				control.scaleX = appSettings.getNumber(`${controlId}-scale`, 1);
				control.scaleY = appSettings.getNumber(`${controlId}-scale`, 1);
			}
		}
		for (let controlId of this.hidden) {
			this.controls[controlId].visibility = Visibility.collapse;
		}
		this.controls["left-stick"].fixedCenter = appSettings.getBoolean("left-stick-fixed-center", true);
		this.controls["left-stick"].buttonStickToBorder = appSettings.getBoolean("left-stick-full-range", false);
		this.controls["right-stick"].fixedCenter = appSettings.getBoolean("right-stick-fixed-center", true);
		this.controls["right-stick"].buttonStickToBorder = appSettings.getBoolean("right-stick-full-range", false);
	}

	editLayout() {
		const delta: object = { X: {}, Y: {} };
		const scale: object = {};

		EDITING = true;
		this.mainEventsOff();
		this.controls["gamepad"].on(GestureTypes.longPress, this.showControl, this);
		for (let [controlId, control] of Object.entries(this.controls)) {
			if (!this.exclude.includes(controlId)) {
				control.on(GestureTypes.pan, this.moveControl.bind(this, delta, controlId, control), this);
				control.on(GestureTypes.pinch, this.zoomControl.bind(this, scale, controlId, control), this);
				control.on(GestureTypes.doubleTap, this.restoreControl.bind(this, control), this);
				control.on(GestureTypes.longPress, this.hideControl.bind(this, controlId, control), this);
			}
		}
	}

	saveLayout() {
		EDITING = false;
		for (let [controlId, control] of Object.entries(this.controls)) {
			if (!this.exclude.includes(controlId)) {
				control.off(GestureTypes.pan, this.moveControl);
				control.off(GestureTypes.pinch, this.zoomControl);
				control.off(GestureTypes.doubleTap, this.restoreControl);
				control.off(GestureTypes.longPress, this.hideControl);
				appSettings.setNumber(`${controlId}-translate-X`, control.translateX);
				appSettings.setNumber(`${controlId}-translate-Y`, control.translateY);
				appSettings.setNumber(`${controlId}-scale`, control.scaleX);
			}
		}
		appSettings.setString(HIDDEN, JSON.stringify([...this.hidden]));
		this.controls["gamepad"].off(GestureTypes.longPress);
		this.mainEventsOn();
	}

	moveControl(delta, controlId, control, data: PanGestureEventData) {
		if (data.state === 1) {
			delta.X[controlId] = 0;
			delta.Y[controlId] = 0;
		} else if (data.state === 2) {
			control.translateX += data.deltaX - delta.X[controlId];
			control.translateY += data.deltaY - delta.Y[controlId];

			delta.X[controlId] = data.deltaX;
			delta.Y[controlId] = data.deltaY;
		}
	}

	zoomControl(scale, controlId, control, data: PinchGestureEventData) {
		if (data.state === 1) {
			const newOriginX = data.getFocusX() - control.translateX;
			const newOriginY = data.getFocusY() - control.translateY;
			const oldOriginX = control.originX * control.getMeasuredWidth();
			const oldOriginY = control.originY * control.getMeasuredHeight();

			control.translateX += (oldOriginX - newOriginX) * (1 - control.scaleX);
			control.translateY += (oldOriginY - newOriginY) * (1 - control.scaleY);
			control.originX = newOriginX / control.getMeasuredWidth();
			control.originY = newOriginY / control.getMeasuredHeight();
			scale[controlId] = control.scaleX;
		} else if (data.scale && data.scale !== 1) {
			let newScale = scale[controlId] * data.scale;
			newScale = Math.min(3, newScale);
			newScale = Math.max(0.3, newScale);

			control.scaleX = newScale;
			control.scaleY = newScale;
		}
	}

	restoreControl(control, data: GestureEventData) {
		control.animate({
			translate: { x: 0, y: 0 },
			scale: { x: 1, y: 1 },
			curve: "easeOut",
			duration: 500,
		});
	}

	hideControl(controlId, control, data: GestureEventData) {
		this.hidden.add(controlId);
		HIDE_TIME = data.android.getEventTime();
		control.visibility = Visibility.collapse;
	}

	showControl(data: GestureEventData) {
		const isOverMain = (droidEvent) => {
			const pointX = droidEvent.getRawX();
			const pointY = droidEvent.getRawY();
			// const { x: mainX, y: mainY } = this.controls["main-button"].getLocationOnScreen();
			const mainX = this.controls["main-button"].effectiveLeft;
			const mainY = this.controls["main-button"].effectiveTop;
			// const { width, height } = this.controls["main-button"].getActualSize();
			const width = this.controls["main-button"].getMeasuredWidth();
			const height = this.controls["main-button"].getMeasuredHeight();

			if ((pointX > mainX && pointX < (mainX + width)) && (pointY > mainY && pointY < (mainY + height))) {
				return true;
			}
			return false;
		}
		if (this.hidden.size && (data.android.getEventTime() - HIDE_TIME) > 30 && !isOverMain(data.android)) {
			const option: ActionOptions = {
				title: "Show Control",
				actions: [...this.hidden],
			};
			action(option).then((controlId) => {
				this.hidden.delete(controlId);
				this.controls[controlId].visibility = Visibility.visible;
			});
		}
	}

	showMenu(data) {
		const actions: string[] = [];
		const option: ActionOptions = {
			actions,
		};

		if (CONNECTED) actions.push("Disconnect");
		else actions.push("Connect");
		if (EDITING) actions.push("Save Layout");
		else actions.push("Edit Layout");
		actions.push("Options");
		actions.push("Reset");

		action(option).then((item) => {
			if (item === "Connect") this.promptConnect();
			else if (item === "Disconnect" && this.sio && this.sio.connected) this.sio.disconnect();
			else if (item === "Edit Layout") this.editLayout();
			else if (item === "Save Layout") this.saveLayout();
			else if (item === "Options") {
				const modalOption: ShowModalOptions = {
					context: { controls: this.controls},
					closeCallback: () => {
						setTimeout(() => {
							OPTIONS_OPEN = false;
						}, 50);
					},
				};

				OPTIONS_OPEN = true;
				this.controls["gamepad"].showModal(OPTIONS, modalOption);
			}
			else if (item === "Reset") {
				const confirmOption: ConfirmOptions = {
					message: "This will reset all settings and layout changes.",
					okButtonText: "Reset",
					cancelButtonText: "Cancel",
				};
				confirm(confirmOption).then((result) => {
					if (result) {
						// const sharedPrefs = application.android.context.getSharedPreferences("prefs.db", 0);
						// const prefEditor = sharedPrefs.edit();
						const mStartActivity = new android.content.Intent(application.android.context, application.android.startActivity.getClass());
						const mPendingIntentId = Math.floor(Math.random() * 100000);
						const mPendingIntent = android.app.PendingIntent.getActivity(application.android.context, mPendingIntentId, mStartActivity, android.app.PendingIntent.FLAG_CANCEL_CURRENT);
						const mgr = application.android.context.getSystemService(android.content.Context.ALARM_SERVICE);
						// prefEditor.clear();
						// prefEditor.apply();
						appSettings.clear();
						appSettings.flush();
						mgr.set(android.app.AlarmManager.RTC, java.lang.System.currentTimeMillis() + 100, mPendingIntent);
						android.os.Process.killProcess(android.os.Process.myPid());
					}
				})
			}
		})
	}

	promptConnect() {
		const connectOpts: PromptOptions = {
			title: "Connect",
			message: "Enter address:",
			okButtonText: "Connect",
			cancelButtonText: "Cancel",
			neutralButtonText: "Scan QR Code",
			inputType: inputType.text,
			capitalizationType: capitalizationType.none,
		};
		const handleResult = async (result) => {
			if (result.result === undefined) {
				const addr = await this.scanCode();
				if (addr && addr.text.startsWith("j2dx://")) {
					setTimeout(() => {
						prompt({defaultText: addr.text.replace("j2dx://", "http://"), ...connectOpts}).then(handleResult);
					}, 100);
				} else {
					setTimeout(() => {
						prompt({defaultText: "http://", ...connectOpts}).then(handleResult);
					}, 100);
				}
			} else if (result.result) {
				this.connect(result.text);
			}
		}
		prompt({defaultText: appSettings.getString(LAST_CONNECTED, "http://"), ...connectOpts}).then(handleResult);
	}

	async scanCode() {
		const scanner = new BarcodeScanner();

		const hasPermission = (granted) => {
			if (granted) return scanner.scan({
				formats: "QR_CODE",
				message: " ",
				resultDisplayDuration: 0,
				orientation: "landscape",
			});
			else {
				return scanner.requestCameraPermission().then(() => {
					return scanner.hasCameraPermission().then(hasPermission);
				});
			}
		};
		return scanner.available().then((available) => {
			if (available) return scanner.hasCameraPermission().then(hasPermission);
		});
	}

	connect(url: string) {
		this.sio = new SocketIO(url, {
			reconnection: false,
			forceNew: true,
		});
		this.sio.on("connect", () => {
			CONNECTED = true;
			this.controls["main-button"].addPseudoClass("connected");
			appSettings.setString(LAST_CONNECTED, url);
			this.sio.emit("intro", { device: platform.device.model });
		});
		this.sio.on("disconnect", () => {
			CONNECTED = false;
			this.controls["main-button"].deletePseudoClass("connected");
			this.sio = null;
		});
		this.sio.connect();
	}

	onShoulderDoubleTap(data: GestureEventData) {
		const button = <Button> data.view;
		if (this.locked[button.id]) {
			button.text = button.text.replace(String.fromCharCode(0xf023), String.fromCharCode(0xf3c1));
			this.locked[button.id] = false;
		} else {
			button.text = button.text.replace(String.fromCharCode(0xf3c1), String.fromCharCode(0xf023));
			this.locked[button.id] = true;
		}
	}

	emit(key: string, value: number) {
		if (this.sio) {
			this.sio.emit("input", { key, value });
		}
	}

	onButtonTouch(name: string, data: TouchGestureEventData) {
		if (this.locked[name] && (name.endsWith("bumper") || name.endsWith("trigger"))) {
			if (data.action === "down") {
				if (this.repeat[name]) {
					clearInterval(this.repeat[name]);
					this.repeat[name] = null;
					this.emit(name, 0);
				} else {
					this.emit(name, 1);
					if (!this.repeat[name]) {
						this.repeat[name] = setInterval(() => {
							this.emit(name, 2);
						}, REPEAT_INTERVAL);
					}
				}
			}
		} else {
			if (["down", "move"].includes(data.action)) {
				this.emit(name, 1);
				if (this.repeat[name]) {
					clearInterval(this.repeat[name]);
				}
				this.repeat[name] = setInterval(() => {
					this.emit(name, 2);
				}, REPEAT_INTERVAL);
			} else {
				clearInterval(this.repeat[name]);
				this.repeat[name] = null;
				this.emit(name, 0);
			}
		}
	}
}
