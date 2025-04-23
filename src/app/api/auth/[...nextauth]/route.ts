import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-config";

// Create the handler
const handler = NextAuth(authOptions);

// Export the handler for both GET and POST
export { handler as GET, handler as POST };