import { Page } from "tns-core-modules/ui/page";
import { Switch } from "tns-core-modules/ui/switch";
import { Button } from "tns-core-modules/ui/button";
import * as appSettings from "tns-core-modules/application-settings";
import { VirtualJoystick } from "nativescript-virtual-joystick";


export function onPageLoaded(args) {
	const page: Page = <Page>args.object;
	const context = page.bindingContext;
	const leftStick: VirtualJoystick = <VirtualJoystick>context.controls["left-stick"];
	const rightStick: VirtualJoystick = <VirtualJoystick>context.controls["right-stick"];
	const leftStickFixedCenter: Switch = <Switch>page.getViewById("leftStickFixedCenter");
	const leftStickFullRange: Switch = <Switch>page.getViewById("leftStickFullRange");
	const rightStickFixedCenter: Switch = <Switch>page.getViewById("rightStickFixedCenter");
	const rightSwitchFullRange: Switch = <Switch>page.getViewById("rightSwitchFullRange");
	const closeButton: Button = <Button>page.getViewById("closeButton");

	leftStickFixedCenter.checked = leftStick.fixedCenter;
	leftStickFullRange.checked = !leftStick.buttonStickToBorder;
	rightStickFixedCenter.checked = rightStick.fixedCenter;
	rightSwitchFullRange.checked = !rightStick.buttonStickToBorder;

	leftStickFixedCenter.on("checkedChange", (data) => {
		const toggle: Switch = <Switch>data.object;
		leftStick.fixedCenter = toggle.checked;
		appSettings.setBoolean("left-stick-fixed-center", toggle.checked);
	});
	leftStickFullRange.on("checkedChange", (data) => {
		const toggle: Switch = <Switch>data.object;
		leftStick.buttonStickToBorder = !toggle.checked;
		appSettings.setBoolean("left-stick-full-range", !toggle.checked);
	});
	rightStickFixedCenter.on("checkedChange", (data) => {
		const toggle: Switch = <Switch>data.object;
		rightStick.fixedCenter = toggle.checked;
		appSettings.setBoolean("right-stick-fixed-center", toggle.checked);
	});
	rightSwitchFullRange.on("checkedChange", (data) => {
		const toggle: Switch = <Switch>data.object;
		rightStick.buttonStickToBorder = !toggle.checked;
		appSettings.setBoolean("right-stick-full-range", !toggle.checked);
	});
	closeButton.on("tap", (data) => page.frame.closeModal());
}
