import { Controller, Get, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto, UpdateMemberRoleDto } from './dto/organization.dto';
import { JwtAuthGuard, OrganizationGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, OrgId, Roles } from '../../common/decorators';

@ApiTags('Organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private orgService: OrganizationsService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.orgService.findAll(userId);
  }

  @Get(':id')
  @UseGuards(OrganizationGuard)
  findOne(@Param('id') id: string) {
    return this.orgService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(OrganizationGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.orgService.update(id, dto);
  }

  @Get(':id/members')
  @UseGuards(OrganizationGuard)
  getMembers(@Param('id') id: string) {
    return this.orgService.getMembers(id);
  }

  @Patch(':id/members/:memberId')
  @UseGuards(OrganizationGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateMemberRole(
    @OrgId() orgId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @Req() req: { userRole: Role },
  ) {
    return this.orgService.updateMemberRole(orgId, memberId, dto, req.userRole);
  }
}
