/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import { EventData } from "tns-core-modules/data/observable";
import { Page } from "tns-core-modules/ui/page";
import * as app from "tns-core-modules/application";
import { GamepadModel } from "./gamepad-view-model";


export function navigatingTo(args: EventData) {
	const page = <Page>args.object;

	page.bindingContext = new GamepadModel();

	if (app.android) {
		const window = app.android.startActivity.getWindow();
		window.addFlags(
			android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN
			| android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
		);
	}
}
