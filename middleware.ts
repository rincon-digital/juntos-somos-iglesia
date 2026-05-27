import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// 1. DEFINICIÓN DE RUTAS
const ADMIN_PATH = "/admin";
const STUDENT_PATH = "/dashboard-estudiante";
const LOGIN_PATH = "/login";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("session_token")?.value;
  const { pathname } = request.nextUrl;

  let payload: any = null;

  // 2. VALIDACIÓN DEL TOKEN
  if (token) {
    try {
      const { payload: decoded } = await jwtVerify(token, SECRET);
      payload = decoded;
    } catch (e) {
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("session_token");
      return response;
    }
  }

  // 3. LÓGICA DE REDIRECCIÓN Y PROTECCIÓN

  // A. Rutas de ADMIN y SUPERADMIN
  if (pathname.startsWith(ADMIN_PATH)) {
    // Si no es admin NI superadmin, fuera.
    if (payload?.role !== "admin" && payload?.role !== "superadmin") {
      return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    }
  }

  // B. Rutas de ESTUDIANTE
  if (pathname.startsWith(STUDENT_PATH)) {
    if (payload?.role !== "user") {
      return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    }
  }

  // C. Si ya está logueado e intenta ir al LOGIN o HOME
  const isLoginPage = pathname === LOGIN_PATH || pathname === "/";

  if (isLoginPage && payload) {
    // Si es cualquier tipo de admin, va a /admin
    if (payload.role === "admin" || payload.role === "superadmin") {
      return NextResponse.redirect(new URL(ADMIN_PATH, request.url));
    }
    if (payload.role === "user") {
      return NextResponse.redirect(new URL(STUDENT_PATH, request.url));
    }
  }

  const response = NextResponse.next();

  // PREVENIR CACHÉ DE HOSTINGER PARA RUTAS PROTEGIDAS
  if (pathname.startsWith(ADMIN_PATH) || pathname.startsWith(STUDENT_PATH)) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("X-LiteSpeed-Cache-Control", "no-cache");
  }

  return response;
}

// 4. CONFIGURACIÓN DEL MATCHER
export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/login",
    "/dashboard-estudiante/:path*",
  ],
};
