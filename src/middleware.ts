import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Si alguien intenta entrar a /admin o cualquier subruta de admin...
  if (url.pathname.startsWith('/admin')) {
    const basicAuth = req.headers.get('authorization');

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [user, pwd] = atob(authValue).split(':');

      // Comparamos con las variables de tu .env.local
      if (user === process.env.ADMIN_USER && pwd === process.env.ADMIN_PASSWORD) {
        return NextResponse.next(); // Acceso permitido
      }
    }

    // Si no hay credenciales o son incorrectas, mostramos la alerta de Login del navegador
    return new NextResponse('Acceso denegado', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Panel Seguro Aerogas"' }
    });
  }

  return NextResponse.next();
}