import { fromObject } from "tns-core-modules/data/observable";
import { Frame } from "tns-core-modules/ui/frame";
import * as application from "tns-core-modules/application";


export function onShownModally(args) {
	const context = args.context;
	const frame: Frame = <Frame>args.object;

	frame.bindingContext = fromObject(context);
	application.android.on(
		application.AndroidApplication.activityBackPressedEvent,
		(data: application.AndroidActivityBackPressedEventData) => {
			data.cancel = true;
			frame.closeModal();
		});
}
