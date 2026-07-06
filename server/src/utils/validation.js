/**
 * Validates if a phone number starts with a country code (starting with '+') 
 * and has a valid mobile number length/structure (E.164 format: 7 to 15 digits).
 * Allows common formatting characters: spaces, hyphens, and parentheses.
 * 
 * @param {string} phone 
 * @returns {boolean}
 */
const validateMobileNumber = (phone) => {
    if (!phone) return false;
    
    const trimmed = phone.trim();
    // Must start with '+'
    if (!trimmed.startsWith('+')) {
        return false;
    }
    
    // Strip all formatting characters except the leading '+'
    const cleanPhone = '+' + trimmed.slice(1).replace(/[\s\-\(\)]/g, '');
    
    // E.164 standard mobile check: starts with +, country code (1-9), followed by 6 to 14 digits
    const mobileRegex = /^\+[1-9]\d{6,14}$/;
    return mobileRegex.test(cleanPhone);
};

module.exports = { validateMobileNumber };
