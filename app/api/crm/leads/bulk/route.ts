import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, leadIds, payload } = body;
        
        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return NextResponse.json({ error: 'No Lead IDs provided' }, { status: 400 });
        }
        
        const results = await prisma.$transaction(async (tx) => {
            if (action === 'assign') {
                const { assignedTo } = payload;
                await tx.cRMLead.updateMany({
                    where: { id: { in: leadIds } },
                    data: { assignedTo }
                });
                
                // Log audit log entries
                for (const id of leadIds) {
                    await tx.cRMAuditLog.create({
                        data: {
                            performedBy: 'System',
                            action: 'LEAD_BULK_ASSIGNED',
                            entityType: 'CRMLead',
                            entityId: id,
                            newValue: JSON.stringify({ assignedTo })
                        }
                    });
                }
            } else if (action === 'stage') {
                const { stageId } = payload;
                await tx.cRMLead.updateMany({
                    where: { id: { in: leadIds } },
                    data: { pipelineStageId: stageId }
                });
                for (const id of leadIds) {
                    await tx.cRMAuditLog.create({
                        data: {
                            performedBy: 'System',
                            action: 'LEAD_BULK_STAGE_CHANGED',
                            entityType: 'CRMLead',
                            entityId: id,
                            newValue: JSON.stringify({ stageId })
                        }
                    });
                }
            } else if (action === 'priority') {
                const { priority } = payload;
                await tx.cRMLead.updateMany({
                    where: { id: { in: leadIds } },
                    data: { priority }
                });
                for (const id of leadIds) {
                    await tx.cRMAuditLog.create({
                        data: {
                            performedBy: 'System',
                            action: 'LEAD_BULK_PRIORITY_CHANGED',
                            entityType: 'CRMLead',
                            entityId: id,
                            newValue: JSON.stringify({ priority })
                        }
                    });
                }
            } else if (action === 'tag') {
                const { tagId, name } = payload;
                let resolvedTagId = tagId;
                if (!resolvedTagId && name) {
                    const tag = await tx.tag.upsert({
                        where: { name },
                        update: {},
                        create: { name }
                    });
                    resolvedTagId = tag.id;
                }
                
                if (!resolvedTagId) {
                    throw new Error('Tag ID or Name is required');
                }
                
                // Associate tag with all leads
                for (const id of leadIds) {
                    // Avoid duplicate composite key inserts
                    const existing = await tx.leadTag.findUnique({
                        where: { crmLeadId_tagId: { crmLeadId: id, tagId: resolvedTagId } }
                    });
                    if (!existing) {
                        await tx.leadTag.create({
                            data: {
                                crmLeadId: id,
                                tagId: resolvedTagId
                              }
                          });
                      }
                      
                      await tx.cRMAuditLog.create({
                          data: {
                              performedBy: 'System',
                              action: 'LEAD_BULK_TAGGED',
                              entityType: 'CRMLead',
                              entityId: id,
                              newValue: JSON.stringify({ tagId: resolvedTagId })
                          }
                      });
                  }
              } else if (action === 'follow_up') {
                  const { dueAt, summary } = payload;
                  if (!dueAt || !summary) {
                      throw new Error('dueAt and summary are required for scheduling follow-up');
                  }
                  
                  // Create follow-ups for all leads
                  for (const id of leadIds) {
                      await tx.followUp.create({
                          data: {
                              crmLeadId: id,
                              dueAt: new Date(dueAt),
                              status: 'PENDING'
                          }
                      });
                      
                      await tx.cRMAuditLog.create({
                          data: {
                              performedBy: 'System',
                              action: 'LEAD_BULK_FOLLOW_UP_SCHEDULED',
                              entityType: 'CRMLead',
                              entityId: id,
                              newValue: JSON.stringify({ dueAt, summary })
                          }
                      });
                  }
              } else {
                  throw new Error(`Unsupported bulk action: ${action}`);
              }
              
              return { success: true };
          }, { maxWait: 20000, timeout: 30000 });
          
          return NextResponse.json(results);
      } catch (error: any) {
          console.error('Failed to process bulk operation:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
      }
  }
