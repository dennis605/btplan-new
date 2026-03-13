import type { ReactElement } from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  error?: string;
  fullWidth?: boolean;
  multiline?: boolean;
}

export function Input({
  label,
  error,
  fullWidth = false,
  multiline = false,
  className = '',
  id,
  ...props
}: InputProps): ReactElement {
  const inputId = id || `input-${label.replace(/\s+/g, '-').toLowerCase()}`;
  
  return (
    <div className={`form-group ${fullWidth ? 'full-width' : ''} ${className}`}>
      <label htmlFor={inputId} className="form-label">{label}</label>
      {multiline ? (
        <textarea
          id={inputId}
          className={`form-input ${error ? 'has-error' : ''}`}
          rows={3}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input 
          id={inputId} 
          className={`form-input ${error ? 'has-error' : ''}`} 
          {...props} 
        />
      )}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string | number; label: string }[];
  fullWidth?: boolean;
}

export function Select({
  label,
  error,
  options,
  fullWidth = false,
  className = '',
  id,
  ...props
}: SelectProps): ReactElement {
  const selectId = id || `select-${label.replace(/\s+/g, '-').toLowerCase()}`;
  
  return (
    <div className={`form-group ${fullWidth ? 'full-width' : ''} ${className}`}>
      <label htmlFor={selectId} className="form-label">{label}</label>
      <select 
        id={selectId} 
        className={`form-select ${error ? 'has-error' : ''}`} 
        {...props}
      >
        <option value="" disabled hidden>Bitte wählen...</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
