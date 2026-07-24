import { prisma } from '../../src/lib/prisma';
import JobsClient from '../../components/JobsClient';

export const dynamic = 'force-dynamic';

export default async function CollectionJobsPage() {
  const jobs = await prisma.collectionJob.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { businesses: true }
      }
    }
  });

  return <JobsClient jobs={jobs} />;
}
