
import type { NextFunction, Request, Response } from 'express';
import { getAuth } from 'firebase-admin/auth';

export interface AuthenticatedRequest extends Request {
  companyId?: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticação ausente.' });
    return;
  }

  const idToken = authHeader.slice('Bearer '.length).trim();

  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    req.companyId = decoded.uid;
    next();
  } catch (error) {
    console.error('Erro ao verificar token de autenticação:', error);
    res.status(401).json({ error: 'Token de autenticação inválido ou expirado.' });
  }
}
