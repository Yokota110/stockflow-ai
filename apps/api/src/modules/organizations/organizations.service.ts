import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateOrganizationDto, UpdateMemberRoleDto } from './dto/organization.dto';
import { toNumber } from '../../common/dto/pagination.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const memberships = await this.prisma.userOrganization.findMany({
      where: { userId },
      include: { organization: true },
    });
    return memberships.map((m) => ({
      organization: { ...m.organization, taxRate: toNumber(m.organization.taxRate) },
      role: m.role,
    }));
  }

  async findOne(orgId: string) {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');
    return { ...org, taxRate: toNumber(org.taxRate) };
  }

  async update(orgId: string, dto: UpdateOrganizationDto) {
    const org = await this.prisma.organization.update({
      where: { id: orgId },
      data: dto,
    });
    return { ...org, taxRate: toNumber(org.taxRate) };
  }

  async getMembers(orgId: string) {
    return this.prisma.userOrganization.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async updateMemberRole(orgId: string, memberId: string, dto: UpdateMemberRoleDto, requesterRole: Role) {
    const membership = await this.prisma.userOrganization.findFirst({
      where: { id: memberId, organizationId: orgId },
    });
    if (!membership) throw new NotFoundException('Member not found');
    if (membership.role === 'OWNER' && requesterRole !== 'OWNER') {
      throw new ForbiddenException('Cannot modify owner role');
    }
    return this.prisma.userOrganization.update({
      where: { id: memberId },
      data: { role: dto.role },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }
}
