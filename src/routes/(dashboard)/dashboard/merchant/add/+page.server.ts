import { redirect, fail } from '@sveltejs/kit';
import { saveUploadedFile } from '$lib/server/utils/file-storage.js';
import { createMerchant, isSlugAvailable } from '$lib/server/merchant.js';
import { canCreateStore, getUserActiveSubscription } from '$lib/server/subscription.js';
import type { RequestEvent } from '@sveltejs/kit';

export async function load(event) {
    if (event.locals.session === null || event.locals.user === null) {
        return redirect(302, "/auth/login");
    }
    if (!event.locals.user.emailVerified) {
        return redirect(302, "/auth/verify-email");
    }

    // Get user's subscription info
    const subscription = await getUserActiveSubscription(event.locals.user.id);
    const storeLimit = await canCreateStore(event.locals.user.id);

    return {
        subscription: {
            planName: subscription.plan.name,
            currentStores: storeLimit.currentCount,
            maxStores: storeLimit.maxStores,
            canCreate: storeLimit.allowed
        }
    };
}

export const actions = {
    'add-merchant': addMerchant
};

async function addMerchant(event: RequestEvent) {
    if (event.locals.session === null || event.locals.user === null) {
        return fail(401, {
            message: "Not authenticated"
        });
    }
    if (!event.locals.user.emailVerified) {
        return fail(403, {
            message: "Email not verified"
        });
    }

    // Check store creation limit
    const storeLimit = await canCreateStore(event.locals.user.id);
    if (!storeLimit.allowed) {
        return fail(403, {
            message: storeLimit.reason,
            currentCount: storeLimit.currentCount,
            maxStores: storeLimit.maxStores,
            needsUpgrade: true
        });
    }

    const formData = await event.request.formData();
    const merchantName = formData.get("merchantName");
    const merchantSlug = formData.get("merchantSlug");
    const merchantAddress = formData.get("merchantAddress");
    const merchantLogo = formData.get("merchantLogo") as File;
    const primaryColor = formData.get("primaryColor");
    const secondaryColor = formData.get("secondaryColor");
    const primaryTextColor = formData.get("primaryTextColor");
    const secondaryTextColor = formData.get("secondaryTextColor");
    const merchantSlogan = formData.get("merchantSlogan");

  
    if (typeof merchantName !== "string" || merchantName.trim().length === 0) {
        return fail(400, {
            message: "Nama merchant is required"
        });
    }
    if (typeof merchantSlug !== "string" || merchantSlug.trim().length === 0) {
        return fail(400, {
            message: "Slug merchant is required"
        });
    }
    if (typeof merchantAddress !== "string" || merchantAddress.trim().length === 0) {
        return fail(400, {
            message: "Alamat merchant is required"
        });
    }
    if (typeof primaryColor !== "string" || primaryColor.trim().length === 0) {
        return fail(400, {
            message: "Primary color is required"
        });
    }
    if (typeof secondaryColor !== "string" || secondaryColor.trim().length === 0) {
        return fail(400, {
            message: "Secondary color is required"
        });
    }
    if (typeof primaryTextColor !== "string" || primaryTextColor.trim().length === 0) {
        return fail(400, {
            message: "Primary text color is required"
        });
    }
    if (typeof secondaryTextColor !== "string" || secondaryTextColor.trim().length === 0) {
        return fail(400, {
            message: "Secondary text color is required"
        });
    }


    if (merchantName.trim().length > 100) {
        return fail(400, {
            message: "Nama merchant cannot exceed 100 characters"
        });
    }
    if (merchantSlug.trim().length > 63) {
        return fail(400, {
            message: "Subdomain cannot exceed 63 characters (DNS limitation)"
        });
    }
    if (merchantSlug.trim().length < 1) {
        return fail(400, {
            message: "Subdomain must be at least 1 character long"
        });
    }
    

    const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!subdomainRegex.test(merchantSlug.trim())) {
        return fail(400, {
            message: "Subdomain must start and end with alphanumeric characters, and can only contain lowercase letters, numbers, and hyphens."
        });
    }


    try {
        const slugAvailable = await isSlugAvailable(merchantSlug.trim());
        if (!slugAvailable) {
            return fail(400, {
                message: "This subdomain is already taken. Please choose a different one."
            });
        }
    } catch (error) {
        console.error('Error checking slug availability:', error);
        return fail(500, {
            message: "Failed to check subdomain availability"
        });
    }
    if (merchantAddress.trim().length > 500) {
        return fail(400, {
            message: "Alamat merchant cannot exceed 500 characters"
        });
    }
    if (merchantSlogan && typeof merchantSlogan === "string" && merchantSlogan.trim().length > 150) {
        return fail(400, {
            message: "Slogan merchant cannot exceed 150 characters"
        });
    }

    // Validate color format
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!colorRegex.test(primaryColor.trim())) {
        return fail(400, {
            message: "Invalid primary color format"
        });
    }
    if (!colorRegex.test(secondaryColor.trim())) {
        return fail(400, {
            message: "Invalid secondary color format"
        });
    }
    if (!colorRegex.test(primaryTextColor.trim())) {
        return fail(400, {
            message: "Invalid primary text color format"
        });
    }
    if (!colorRegex.test(secondaryTextColor.trim())) {
        return fail(400, {
            message: "Invalid secondary text color format"
        });
    }

    // Handle logo upload
    let logoUrl = '';
    if (merchantLogo && merchantLogo.size > 0) {
        // Validate file type
        if (!merchantLogo.type.startsWith('image/')) {
            return fail(400, {
                message: "Logo must be an image file"
            });
        }
        
        // Validate file size (5MB limit)
        if (merchantLogo.size > 5 * 1024 * 1024) {
            return fail(400, {
                message: "Logo file size must be less than 5MB"
            });
        }

        try {
            logoUrl = await saveUploadedFile(merchantLogo, {
                directory: 'merchants/logos',
                maxSize: 5 * 1024 * 1024,
                allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
            }).then(result => result.publicUrl);
        } catch (error) {
            console.error('Error saving merchant logo:', error);
            return fail(500, {
                message: "Failed to save merchant logo"
            });
        }
    }

    // Prepare merchant data
    const merchantData = {
        name: merchantName.trim(),
        slug: merchantSlug.trim(),
        address: merchantAddress.trim(),
        logo: logoUrl,
        primaryColor: primaryColor.trim(),
        secondaryColor: secondaryColor.trim(),
        primaryTextColor: primaryTextColor.trim(),
        secondaryTextColor: secondaryTextColor.trim(),
        slogan: merchantSlogan && typeof merchantSlogan === "string" ? merchantSlogan.trim() : '',
        userId: event.locals.user.id,
        createdAt: new Date().toISOString()
    };

    try {
        // Save merchant data to database
        await createMerchant(merchantData);
        
        return { 
            success: true, 
            message: "Merchant added successfully"
        };
    } catch (error) {
        console.error('Error adding merchant:', error);
        return fail(500, {
            message: "Failed to add merchant"
        });
    }
}