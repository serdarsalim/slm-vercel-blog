import { NextAuthOptions } from 'next-auth';
import GoogleProvider from "next-auth/providers/google";
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Change to a function to avoid build-time initialization
export function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!, 
    { auth: { persistSession: false } }
  );
}

// Export auth options for use across the application
export const authOptions: NextAuthOptions = {
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
        maxAge: 60 * 15,
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      
      try {
        // Get client only when needed
        const serviceRoleClient = getServiceRoleClient();
        
        console.log("Attempting login with email:", user.email);
        const { data: existingAuthor } = await serviceRoleClient
          .from("authors")
          .select("id, handle, status")
          .eq("email", user.email)
          .maybeSingle();

        console.log("Found author:", existingAuthor);
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

    async redirect({ url, baseUrl }) {
        // Check if this is a new user sign-in (you could pass a flag from signIn)
        const isNewUser = url.includes('new=true');
        
        // If it's a sign-in and a new user, redirect to profile
        if (url.startsWith(baseUrl) && isNewUser) {
          return `${baseUrl}/profile`;
        }
        
        // Default NextAuth behavior
        if (url.startsWith('/')) return `${baseUrl}${url}`;
        else if (new URL(url).origin === baseUrl) return url;
        return baseUrl;
      },

    async session({ session, token }) {
      // Add user's status to session
      if (session.user?.email) {
        try {
          // Get client only when needed
          const serviceRoleClient = getServiceRoleClient();
          
          const { data: author } = await serviceRoleClient
            .from("authors")
            .select("id, handle, status")
            .eq("email", session.user.email)
            .maybeSingle();
            
          if (author) {
            session.user.status = author.status;
            session.user.handle = author.handle;
            session.user.id = author.id;
          } else {
            // Check in requests table
            const { data: request } = await serviceRoleClient
              .from("author_requests")
              .select("status, handle, id")
              .eq("email", session.user.email)
              .maybeSingle();
              
            if (request) {
              session.user.status = request.status;
              session.user.handle = request.handle;
              session.user.id = request.id;
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