import type { Reroute } from "@sveltejs/kit";


export const reroute: Reroute = ({ url }) => {
    const host = url.hostname.toLowerCase();
    const isTukooDomain = host.endsWith('.tukoo.test') || host.endsWith('.tukoo.web.id');
    const isExcludedWildcard = host.startsWith('s3') || host.startsWith('cdn');

    if (isTukooDomain && !isExcludedWildcard) {
       
        let subdomain = host;
        if (host.endsWith('.tukoo.test')) {
            subdomain = host.slice(0, -'.tukoo.test'.length);
        } else if (host.endsWith('.tukoo.web.id')) {
            subdomain = host.slice(0, -'.tukoo.web.id'.length);
        }

       
        if (!subdomain) return url.pathname;

        return `/pos/${subdomain}${url.pathname}`;
    }

    return url.pathname;
};
