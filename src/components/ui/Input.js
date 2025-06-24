import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

const Input = forwardRef(({ 
  label,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  className = '',
  type = 'text',
  ...props 
}, ref) => {
  const inputClasses = `
    input
    ${error ? 'input-error' : ''}
    ${icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : ''}
    ${className}
  `.trim();

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400 text-sm">{icon}</span>
          </div>
        )}
        
        <motion.input
          ref={ref}
          type={type}
          className={inputClasses}
          whileFocus={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400 text-sm">{icon}</span>
          </div>
        )}
      </div>
      
      {error && (
        <motion.p 
          className="text-red-500 text-xs mt-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
      
      {helperText && !error && (
        <p className="text-gray-500 text-xs mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input; 