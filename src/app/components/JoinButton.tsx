"use client";

import { signIn } from "next-auth/react";

export default function JoinButton() {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/pending" })}
      className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-lg transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-1 duration-200"
    >
      Join WriteAway
    </button>
  );
}