import { useState, useCallback } from 'react';
import { validateForm } from '../utils/validators';

/*
 useValidation(schema)
 Trả về: { errors, validate, validateField, clearErrors, clearField, isValid }
 */
export function useValidation(schema) {
    const [errors, setErrors] = useState({});

    const validate = useCallback((data) => {
        const { valid, errors: e } = validateForm(data, schema);
        setErrors(e);
        return valid;
    }, [schema]);

    const validateField = useCallback((field, value, fullData = {}) => {
        if (!schema[field]) return;
        const { errors: e } = validateForm({ ...fullData, [field]: value }, { [field]: schema[field] });
        setErrors(prev => ({ ...prev, [field]: e[field] || '' }));
    }, [schema]);

    const clearErrors = useCallback(() => setErrors({}), []);

    const clearField = useCallback((field) =>
        setErrors(prev => ({ ...prev, [field]: '' })), []);

    const isValid = Object.values(errors).every(e => !e);

    return { errors, validate, validateField, clearErrors, clearField, isValid };
}