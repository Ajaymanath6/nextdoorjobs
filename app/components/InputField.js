"use client";

export default function InputField({
  type = "text",
  name,
  value,
  onChange,
  placeholder = "",
  label,
  error,
  required = false,
  disabled = false,
  className = "",
  rows,
  style,
  ...props
}) {
  const inputClasses = `w-full px-4 py-2 border-brand-stroke-weak shadow-sm rounded-lg focus:outline-none focus:border-brand-text-strong hover:bg-brand-bg-fill ${
    error ? "border-red-500" : ""
  } bg-brand-bg-white text-brand-text-strong placeholder:text-brand-text-placeholder ${className}`;

  const inputStyle = { 
    fontFamily: "Open Sans, sans-serif", 
    borderWidth: "1px",
    ...style 
  };

  const InputComponent = type === "textarea" ? "textarea" : "input";

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-brand-text-strong mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <InputComponent
        type={type !== "textarea" ? type : undefined}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={inputClasses}
        style={inputStyle}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
