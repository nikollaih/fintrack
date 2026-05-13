import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: SelectOption[];
    placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, options, placeholder, className = '', id, ...props }, ref) => {
        const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '_');
        return (
            <div className="flex flex-col gap-1">
                {label && (
                    <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    id={selectId}
                    className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                        ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}
                        ${className}`}
                    {...props}
                >
                    {placeholder && <option value="">{placeholder}</option>}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && <p className="text-xs text-red-600">{error}</p>}
            </div>
        );
    },
);
Select.displayName = 'Select';
export default Select;
