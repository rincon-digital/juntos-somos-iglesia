import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// 1. DEFINICIÓN DE RUTAS
const ADMIN_PATH = "/admin";
const STUDENT_PATH = "/dashboard-estudiante";
const ADMIN_LOGIN = "/login-admin";
const STUDENT_LOGIN = "/login-estudiante";

export async function proxy(request: NextRequest) {
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
      return NextResponse.redirect(new URL(ADMIN_LOGIN, request.url));
    }
  }

  // B. Rutas de ESTUDIANTE
  if (pathname.startsWith(STUDENT_PATH)) {
    if (payload?.role !== "user") {
      return NextResponse.redirect(new URL(STUDENT_LOGIN, request.url));
    }
  }

  // C. Si ya está logueado e intenta ir a LOGINS o HOME
  const isLoginPage =
    pathname === ADMIN_LOGIN || pathname === STUDENT_LOGIN || pathname === "/";

  if (isLoginPage && payload) {
    // Si es cualquier tipo de admin, va a /admin
    if (payload.role === "admin" || payload.role === "superadmin") {
      return NextResponse.redirect(new URL(ADMIN_PATH, request.url));
    }
    if (payload.role === "user") {
      return NextResponse.redirect(new URL(STUDENT_PATH, request.url));
    }
  }

  // D. Prevención de cruces de login
  // Si un admin/superadmin intenta entrar al login de alumnos
  if (
    pathname === STUDENT_LOGIN &&
    (payload?.role === "admin" || payload?.role === "superadmin")
  ) {
    return NextResponse.redirect(new URL(ADMIN_PATH, request.url));
  }

  // Si un alumno intenta entrar al login de admin
  if (pathname === ADMIN_LOGIN && payload?.role === "user") {
    return NextResponse.redirect(new URL(STUDENT_PATH, request.url));
  }

  return NextResponse.next();
}

// 4. CONFIGURACIÓN DEL MATCHER
export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/login-admin",
    "/dashboard-estudiante/:path*",
    "/login-estudiante",
  ],
};
