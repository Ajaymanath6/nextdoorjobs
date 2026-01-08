"use client";

import { useState } from "react";

export default function EmailAuthForm({ onSubmit, isLoading = false }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isRegister, setIsRegister] = useState(true);
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (isRegister && !name.trim()) {
      newErrors.name = "Name is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({ email: email.trim(), name: name.trim() || null, isRegister });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8 border border-[#E5E5E5]">
        {/* Logo and Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-[#7c00ff] rounded flex items-center justify-center">
            <span className="text-white text-sm font-bold">ND</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900" style={{ fontFamily: "Open Sans, sans-serif" }}>
            NextDoorJobs
          </h1>
        </div>

        {/* Toggle between Login and Register */}
        <div className="flex gap-2 mb-6 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrors({});
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              isRegister
                ? "bg-white text-[#7c00ff] shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            style={{ fontFamily: "Open Sans, sans-serif" }}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrors({});
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              !isRegister
                ? "bg-white text-[#7c00ff] shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            style={{ fontFamily: "Open Sans, sans-serif" }}
          >
            Login
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Open Sans, sans-serif" }}>
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c00ff] ${
                  errors.name ? "border-red-500" : "border-gray-300"
                } bg-white text-gray-900`}
                style={{ fontFamily: "Open Sans, sans-serif", fontSize: "14px" }}
                placeholder="Enter your name"
                disabled={isLoading}
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Open Sans, sans-serif" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: "" });
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c00ff] ${
                errors.email ? "border-red-500" : "border-gray-300"
              } bg-white text-gray-900`}
              style={{ fontFamily: "Open Sans, sans-serif", fontSize: "14px" }}
              placeholder="Enter your email"
              disabled={isLoading}
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-[#7c00ff] text-white rounded-lg hover:bg-[#6a00e6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ fontFamily: "Open Sans, sans-serif", fontSize: "14px", fontWeight: 600 }}
          >
            {isLoading ? "Processing..." : isRegister ? "Register & Continue" : "Login & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
