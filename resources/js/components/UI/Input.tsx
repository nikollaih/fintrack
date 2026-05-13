import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = '', id, ...props }, ref) => {
        const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '_');
        return (
            <div className="flex flex-col gap-1">
                {label && (
                    <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                        ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}
                        ${className}`}
                    {...props}
                />
                {error && <p className="text-xs text-red-600">{error}</p>}
            </div>
        );
    },
);
Input.displayName = 'Input';
export default Input;
