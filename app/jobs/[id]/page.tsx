import { prisma } from '../../../src/lib/prisma';
import JobViewerClient from '../../../components/JobViewerClient';

export const dynamic = 'force-dynamic';

export default async function JobViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const jobId = parseInt(resolvedParams.id);

  const job = await prisma.collectionJob.findUnique({
    where: { id: jobId }
  });

  const businesses = await prisma.business.findMany({
    where: { job_id: jobId },
    include: {
      category: true,
      city: true,
      area: true
    },
    orderBy: { ai_score: 'desc' }
  });

  return <JobViewerClient job={job} businesses={businesses} />;
}
