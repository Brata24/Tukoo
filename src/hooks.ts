import type { Reroute } from "@sveltejs/kit";


export const reroute: Reroute = ({ url }) => {
    console.log('Rerouting for URL:', url.pathname);

    if (url.pathname.startsWith('/storage/')) { 
        return url.pathname;
    }

    if (url.hostname.endsWith('.tukoo.test') || url.hostname.endsWith('.tukoo.web.id')) {
        const subdomain = url.hostname.replace('.tukoo.test', '').replace('.tukoo.web.id', '');
        return `/pos/${subdomain}${url.pathname}`;
    }
    return url.pathname;
};
