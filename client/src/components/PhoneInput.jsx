import React from 'react';
import { PhoneInput as IntlPhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { parsePhoneNumber } from '../utils/validation';

const PhoneInput = ({ 
    value, 
    onChange, 
    placeholder = 'Enter mobile number', 
    inputClassName = '', 
    selectClassName = '', 
    dropdownClassName = '',
    defaultCode = '+91' 
}) => {
    // Map prefix like '+960' to country code ISO string
    const getCountryISO = (prefix) => {
        const mapping = {
            '+91': 'in',
            '+1': 'us',
            '+44': 'gb',
            '+960': 'mv',
            '+971': 'ae',
            '+61': 'au',
            '+65': 'sg',
            '+49': 'de',
            '+33': 'fr',
            '+39': 'it',
            '+34': 'es',
            '+41': 'ch',
            '+86': 'cn',
            '+81': 'jp',
            '+7': 'ru'
        };
        return mapping[prefix] || 'in';
    };

    return (
        <div className="w-full react-intl-phone-wrapper">
            <IntlPhoneInput
                defaultCountry={getCountryISO(defaultCode)}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full flex"
                inputClassName={`flex-grow rounded-r-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1b6b5f] focus:ring-1 focus:ring-[#1b6b5f]/20 ${inputClassName}`}
                countrySelectorStyleProps={{
                    buttonClassName: `rounded-l-lg border-y border-l border-slate-300 bg-white px-2 py-3 focus:outline-none ${selectClassName}`,
                    dropdownClassName: dropdownClassName
                }}
            />
        </div>
    );
};

export default PhoneInput;
