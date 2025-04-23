import "next-auth/jwt"

// Extend the built-in session types
declare module "next-auth/jwt" {
  interface JWT {
    status?: string
    handle?: string
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      status?: string
      handle?: string
    }
  }
  
  interface User {
    status?: string
    handle?: string
  }
}