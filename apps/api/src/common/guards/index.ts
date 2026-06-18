import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES_KEY } from '../decorators';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class OrganizationGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orgId = request.headers['x-organization-id'];

    if (!orgId) {
      throw new UnauthorizedException('Organization ID required');
    }

    const membership = await this.prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: orgId as string } },
    });

    if (!membership) {
      throw new ForbiddenException('Not a member of this organization');
    }

    request.organizationId = orgId;
    request.userRole = membership.role;
    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) return true;

    const { userRole } = context.switchToHttp().getRequest();
    const role = userRole as Role;
    const roleHierarchy: Record<Role, number> = {
      VIEWER: 1,
      STAFF: 2,
      MANAGER: 3,
      ADMIN: 4,
      OWNER: 5,
    };

    return requiredRoles.some((required) => roleHierarchy[role] >= roleHierarchy[required]);
  }
}
