import { prisma } from '../db';

interface AuditContext {
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export async function createAuditLog(
  action: string,
  entityType: string,
  entityId: string,
  context?: AuditContext
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        metadata: JSON.stringify(context?.metadata || {}),
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      },
    });
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error('Failed to create audit log:', error);
  }
}

export async function getAuditLogs(filters?: {
  action?: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
}) {
  return await prisma.auditLog.findMany({
    where: {
      ...(filters?.action && { action: filters.action }),
      ...(filters?.entityType && { entityType: filters.entityType }),
      ...(filters?.entityId && { entityId: filters.entityId }),
    },
    orderBy: { createdAt: 'desc' },
    take: filters?.limit || 100,
  });
}
