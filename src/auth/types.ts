export type AuthRoleCode = 'ADMINISTRADOR' | 'SUPERVISOR' | 'CONTROL_ESCOLAR' | 'DOCENTE';

export interface AuthContext {
  userId: string;
  username: string;
  roleCodes: AuthRoleCode[];
}

export interface JwtPayload {
  sub: string;
  username: string;
  roleCodes: AuthRoleCode[];
}
