import { RefillingTokenBucket } from '$lib/server/auth-handler/rate-limit';
import { setSessionAs2FAVerified } from '$lib/server/auth-handler/session';
import { getUserFromEmail, updateUser2FASettings, updateUserTOTPKey, updateUserProfile, getUserPasswordHash, updateUserPassword } from '$lib/server/auth-handler/user';
import { verifyPasswordHash, verifyPasswordStrength } from '$lib/server/auth-handler/base/password';
import { saveProfilePicture, deleteUploadedFile } from '$lib/server/utils/file-storage';
import { decodeBase64 } from '@oslojs/encoding';
import { verifyTOTP } from '@oslojs/otp';
import { redirect, fail } from '@sveltejs/kit';

import type { RequestEvent } from './$types.js';
const totpUpdateBucket = new RefillingTokenBucket<number>(3, 60 * 10);


export async function load(event) {
    if (event.locals.session === null || event.locals.user === null) {
        return redirect(302, "/auth/login");
    }
    const dataUser = await getUserFromEmail(event.locals.user.email);

    return {
        user: dataUser
    };
}


export const actions = {
	enable2fa: enable2FA,
	'update-profile': updateProfile,
	'change-password': changePassword
};


async function enable2FA(event: RequestEvent) {
    if (event.locals.session === null || event.locals.user === null) {
            return fail(401, {
                message: "Not authenticated"
            });
        }
        if (!event.locals.user.emailVerified) {
            return fail(403, {
                message: "Forbidden"
            });
        }
        if (event.locals.user.registered2FA && !event.locals.session.twoFactorVerified) {
            return fail(403, {
                message: "Forbidden"
            });
        }
        if (!totpUpdateBucket.check(event.locals.user.id, 1)) {
            return fail(429, {
                message: "Too many requests"
            });
        }
    
        const formData = await event.request.formData();
        const encodedKey = formData.get("key");
        const code = formData.get("code");
        if (typeof encodedKey !== "string" || typeof code !== "string") {
            return fail(400, {
                message: "Invalid or missing fields"
            });
        }
        if (code === "") {
            return fail(400, {
                message: "Please enter your code"
            });
        }
        if (encodedKey.length !== 28) {
            return fail(400, {
                message: "Please enter your code"
            });
        }
        let key: Uint8Array;
        try {
            key = decodeBase64(encodedKey);
        } catch {
            return fail(400, {
                message: "Invalid key"
            });
        }
        if (key.byteLength !== 20) {
            return fail(400, {
                message: "Invalid key"
            });
        }
        if (!totpUpdateBucket.consume(event.locals.user.id, 1)) {
            return fail(429, {
                message: "Too many requests"
            });
        }
        if (!verifyTOTP(key, 30, 6, code)) {
            return fail(400, {
                message: "Invalid code"
            });
        }
        updateUserTOTPKey(event.locals.session.userId, key);
        setSessionAs2FAVerified(event.locals.session.id);
        updateUser2FASettings(event.locals.session.userId, true);
        return { success: true };
        
}

async function updateProfile(event: RequestEvent) {
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

    const formData = await event.request.formData();
    const fullName = formData.get("fullName");
    const email = formData.get("email");
    const phoneNumber = formData.get("phoneNumber");
    const profilePicture = formData.get("profile_picture") as File;

   
    if (typeof fullName !== "string" && fullName !== null) {
        return fail(400, {
            message: "Invalid full name"
        });
    }
    if (typeof email !== "string" && email !== null) {
        return fail(400, {
            message: "Invalid email"
        });
    }
    if (typeof phoneNumber !== "string" && phoneNumber !== null) {
        return fail(400, {
            message: "Invalid phone number"
        });
    }

    
    const updateData: { fullName?: string; email?: string; phoneNumber?: string; profile_picture?: string } = {};
    
    if (fullName && fullName.trim().length > 0) {
        updateData.fullName = fullName.trim();
    }
    if (email && email.trim().length > 0) {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return fail(400, {
                message: "Invalid email format"
            });
        }
        updateData.email = email.trim();
    }
    if (phoneNumber && phoneNumber.trim().length > 0) {
        updateData.phoneNumber = phoneNumber.trim();
    }

    // Handle file upload
    if (profilePicture && profilePicture.size > 0) {
        // Validate file type
        if (!profilePicture.type.startsWith('image/')) {
            return fail(400, {
                message: "File must be an image"
            });
        }
        
        // Validate file size (5MB limit)
        if (profilePicture.size > 5 * 1024 * 1024) {
            return fail(400, {
                message: "File size must be less than 5MB"
            });
        }

        try {
            // Get current user data to check for existing profile picture
            const currentUser = await getUserFromEmail(event.locals.user.email);
            
            // Delete old profile picture if it exists
            if (currentUser?.profile_picture && currentUser.profile_picture.trim() !== '') {
                try {
                    await deleteUploadedFile(currentUser.profile_picture);
                } catch (deleteError) {
                    console.warn('Failed to delete old profile picture:', deleteError);
                    // Continue with update even if deletion fails
                }
            }
          
            const profilePicturePath = await saveProfilePicture(profilePicture);
            updateData.profile_picture = profilePicturePath;
        } catch (error) {
            console.error('Error saving profile picture:', error);
            return fail(500, {
                message: "Failed to save profile picture"
            });
        }
    }

    try {
        await updateUserProfile(event.locals.user.id, updateData);
        return { success: true };
    } catch (error) {
        console.error('Error updating profile:', error);
        return fail(500, {
            message: "Failed to update profile"
        });
    }
}

async function changePassword(event: RequestEvent) {
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

    const formData = await event.request.formData();
    const currentPassword = formData.get("currentPassword");
    const newPassword = formData.get("newPassword");
    const verifyNewPassword = formData.get("verifyNewPassword");

    // Validate input types
    if (typeof currentPassword !== "string" || currentPassword.length === 0) {
        return fail(400, {
            message: "Current password is required"
        });
    }
    if (typeof newPassword !== "string" || newPassword.length === 0) {
        return fail(400, {
            message: "New password is required"
        });
    }
    if (typeof verifyNewPassword !== "string" || verifyNewPassword.length === 0) {
        return fail(400, {
            message: "Password verification is required"
        });
    }

    // Check if new passwords match
    if (newPassword !== verifyNewPassword) {
        return fail(400, {
            message: "New passwords do not match"
        });
    }

    // Validate password strength
    if (!(await verifyPasswordStrength(newPassword))) {
        return fail(400, {
            message: "Password is too weak or commonly used. Please choose a stronger password."
        });
    }

    try {
        // Get current password hash
        const currentPasswordHash = await getUserPasswordHash(event.locals.user.id);
        
        // Verify current password
        if (!(await verifyPasswordHash(currentPasswordHash, currentPassword))) {
            return fail(400, {
                message: "Current password is incorrect"
            });
        }

        // Check if new password is different from current
        if (await verifyPasswordHash(currentPasswordHash, newPassword)) {
            return fail(400, {
                message: "New password must be different from current password"
            });
        }

        // Update password
        await updateUserPassword(event.locals.user.id, newPassword);
        
        return { success: true, message: "Password changed successfully" };
    } catch (error) {
        console.error('Error changing password:', error);
        return fail(500, {
            message: "Failed to change password"
        });
    }
}