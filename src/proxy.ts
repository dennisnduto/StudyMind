import { withAuth } from "next-auth/middleware";

export const proxy = withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/chat/:path*",
    "/quiz/:path*",
    "/upload/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
