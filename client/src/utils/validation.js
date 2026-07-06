/**
 * Validates if a phone number starts with a country code (starting with '+') 
 * and has a valid mobile number length/structure (E.164 format: 7 to 15 digits).
 * Allows common formatting characters: spaces, hyphens, and parentheses.
 * 
 * @param {string} phone 
 * @returns {boolean}
 */
export const validateMobileNumber = (phone) => {
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

export const parsePhoneNumber = (phone, defaultCode = '+91') => {
    if (!phone) return { countryCode: defaultCode, number: '' };
    const trimmed = phone.trim();
    
    // List of supported country codes sorted by length descending so longer ones match first (+960 before +9, etc.)
    const codes = ['+960', '+971', '+379', '+299', '+1', '+7', '+33', '+34', '+39', '+41', '+44', '+49', '+61', '+65', '+81', '+86', '+91'];
    
    for (const code of codes) {
        if (trimmed.startsWith(code)) {
            return {
                countryCode: code,
                number: trimmed.slice(code.length).trim()
            };
        }
    }
    
    if (trimmed.startsWith('+')) {
        // If it starts with + but not in our list, find the digits after + (up to 3 digits)
        const match = trimmed.match(/^(\+[1-9]\d{0,2})(.*)$/);
        if (match) {
            return {
                countryCode: match[1],
                number: match[2].trim()
            };
        }
    }
    
    return { countryCode: defaultCode, number: trimmed };
};
