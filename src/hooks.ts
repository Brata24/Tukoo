import type { Reroute } from "@sveltejs/kit";


export const reroute: Reroute = ({ url }) => {

    if (url.hostname.endsWith('.beta.tukoo.test') || url.hostname.endsWith('.beta.tukoo.web.id')) {
        const subdomain = url.hostname.replace('.beta.tukoo.test', '').replace('.beta.tukoo.web.id', '');
        return `/pos/${subdomain}${url.pathname}`;
    }
    return url.pathname;
};
