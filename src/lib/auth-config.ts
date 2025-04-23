import GoogleProvider from "next-auth/providers/google";
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Create service role client for privileged operations
export const serviceRoleClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!, 
  { auth: { persistSession: false } }
);

// Export auth options for use across the application
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  cookies: {
    // Copy your entire cookies configuration here
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    // ... other cookie settings
  },
  callbacks: {
    async signIn({ user, account }) {
      // Copy your entire signIn callback here
      if (!user.email) return false;
      
      try {
        console.log("Attempting login with email:", user.email);
        const { data: existingAuthor } = await serviceRoleClient
          .from("authors")
          .select("id, handle, status")
          .eq("email", user.email)
          .maybeSingle();
        
        console.log("Found author:", existingAuthor);
        if (existingAuthor) return true;
        
        // Rest of your signIn callback logic
        // ...
        
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    // Copy all your other callbacks
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};