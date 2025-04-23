import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabase } from "@/lib/supabase";
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Create service role client for privileged operations
const serviceRoleClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!, 
  { auth: { persistSession: false } }
);


export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    pkceCodeVerifier: {
      name: `next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production", 
      },
    },
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 15, // 15 minutes in seconds
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      
      try {
        // Check if user already exists
        const { data: existingAuthor } = await serviceRoleClient
        .from("authors")
        .select("id, handle, status")
        .eq("email", user.email)
        .maybeSingle();
        // Debug why your lookup is failing

        if (existingAuthor) {
          // User exists, no need to create request
          return true;
        }
        
        // Check if there's a pending request
        const { data: existingRequest } = await serviceRoleClient
          .from("author_requests")
          .select("id")
          .eq("email", user.email)
          .maybeSingle();
          
        if (existingRequest) {
          // Request already exists
          return true;
        }
        const apiToken = crypto.randomBytes(32).toString('hex');


        // Create new author request
        const { error } = await serviceRoleClient
  .from("author_requests")
  .insert({
    email: user.email,
    name: user.name || "New User",
    handle: (user.name || user.email?.split('@')[0] || "user").toLowerCase().replace(/[^a-z0-9]/g, '-'),
    status: "pending",
    google_id: user.id,
    created_at: new Date().toISOString(),
    api_token: apiToken 
  });
          
        if (error) {
          console.error("Error creating author request:", error);
          return false;
        }
        
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    async session({ session, token }) {
      // Add user's status to session
      if (session.user?.email) {
        try {
          const { data: author } = await serviceRoleClient
            .from("authors")
            .select("id, handle, status")
            .eq("email", session.user.email)
            .maybeSingle();
            
          if (author) {
            session.user.status = author.status;
            session.user.handle = author.handle;
          } else {
            // Check in requests table
            const { data: request } = await serviceRoleClient
              .from("author_requests")
              .select("status")
              .eq("email", session.user.email)
              .maybeSingle();
              
            if (request) {
              session.user.status = request.status;
            }
          }
        } catch (error) {
          console.error("Error getting user status:", error);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };