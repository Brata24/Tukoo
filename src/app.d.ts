// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { User } from "$lib/server/auth-handler/user";
import type { Session } from "$lib/server/auth-handler/session";
import type { Merchant } from "$lib/server/merchant";

import type { IStaticMethods} from "preline/dist";
import type { PosUserData } from "$lib/server/pos";

declare global {

	interface Window {
		_;
		$: typeof import('jquery');
		jQuery: typeof import('jquery');
		DataTable;
		Dropzone;
		VanillaCalendarPro;
		HSStaticMethods: IStaticMethods;
		HSOverlay?: any;
		HSPinInput?: any;
		
	}
	namespace App {
		// interface Error {}
		interface Locals {
			user: User | null;
			session: Session | null;
			merchant: Merchant | null;
			isPOSRequest: boolean;
			userPos: PosUserData | null;
			sessionPos: Session | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export { };
