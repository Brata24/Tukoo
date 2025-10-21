import { encodeBase64 } from "@oslojs/encoding";
import { createTOTPKeyURI } from "@oslojs/otp";
import { redirect, json } from "@sveltejs/kit";
import { renderSVG } from "uqr";

export function GET(event) {
    if (event.locals.session === null || event.locals.user === null) {
        throw redirect(302, "/auth/login");
    }
    if (!event.locals.user.emailVerified) {
        throw redirect(302, "/auth/verify-email");
    }

    const totpKey = new Uint8Array(20);
	crypto.getRandomValues(totpKey);
	const encodedTOTPKey = encodeBase64(totpKey);
	const keyURI = createTOTPKeyURI("Tukoo", event.locals.user.username, totpKey, 30, 6);
	const qrcode = renderSVG(keyURI);
	
    
    return json({ status: true, encodedTOTPKey, qrcode });
}