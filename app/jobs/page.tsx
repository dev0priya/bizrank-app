import { prisma } from '../../lib/prisma';
import JobsClient from './JobsClient';

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
