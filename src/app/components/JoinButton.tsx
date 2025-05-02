"use client";

import { signIn } from "next-auth/react";

export default function JoinButton() {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/pending" })}
      className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-lg transition-all duration-200 shadow-md hover:shadow-lg relative overflow-hidden group"
    >
      <span className="relative z-10">Join HALQA</span>
      <span className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
    </button>
  );
}