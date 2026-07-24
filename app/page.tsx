import { prisma } from '../src/lib/prisma';
import DashboardClient from '../components/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Core KPIs
  const totalBusinesses = await prisma.business.count();
  const collectedToday = await prisma.business.count({ where: { collection_date: { gte: today } } });
  
  const runningJobs = await prisma.collectionJob.count({ where: { status: 'Running' } });
  const completedJobs = await prisma.collectionJob.count({ where: { status: 'Completed' } });
  const failedJobs = await prisma.collectionJob.count({ where: { status: 'Failed' } });

  const qualifiedLeads = await prisma.business.count({
    where: {
      ai_score: { gt: 70 },
      opportunity_score: { gt: 70 },
      website_exists: false,
      phone_number: { not: null },
      email: { not: null }
    }
  });

  const leadsInCrm = await prisma.business.count({
    where: { crm_status: { not: null } }
  });

  const noWebsite = await prisma.business.count({ where: { website_exists: false } });
  const noPhone = await prisma.business.count({ where: { phone_number: null } });
  const noEmail = await prisma.business.count({ where: { email: null } });

  const scoreAgg = await prisma.business.aggregate({
    _avg: {
      ai_score: true,
      opportunity_score: true
    }
  });
  const avgAiScore = Math.round(scoreAgg._avg.ai_score || 0);
  const avgOppScore = Math.round(scoreAgg._avg.opportunity_score || 0);

  // 2. Charts Data
  
  // Businesses Collected (Last 30 Days)
  // Group by date - Prisma doesn't have a simple date_trunc equivalent in findMany without raw SQL, 
  // so we will fetch businesses from last 30 days and group in memory (since we cap at last 30 days, it's efficient enough if optimized by selecting only date, or using raw query).
  // Using raw query for efficiency on large datasets:
  const last30DaysData = await prisma.$queryRaw`
    SELECT DATE(collection_date) as date, COUNT(*)::int as count 
    FROM businesses 
    WHERE collection_date >= ${thirtyDaysAgo} 
    GROUP BY DATE(collection_date) 
    ORDER BY DATE(collection_date) ASC
  `;

  // Top Categories
  const categoriesData = await prisma.business.groupBy({
    by: ['category_id'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  });
  // Resolve category names
  const categoryIds = categoriesData.map(c => c.category_id).filter(Boolean) as number[];
  const categories = await prisma.businessCategory.findMany({ where: { id: { in: categoryIds } } });
  const topCategories = categoriesData.map(c => ({
    name: categories.find(cat => cat.id === c.category_id)?.name || 'Unknown',
    count: c._count.id
  }));

  // Top Cities
  const citiesData = await prisma.business.groupBy({
    by: ['city_id'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  });
  // Resolve city names
  const cityIds = citiesData.map(c => c.city_id).filter(Boolean) as number[];
  const cities = await prisma.city.findMany({ where: { id: { in: cityIds } } });
  const topCities = citiesData.map(c => ({
    name: cities.find(city => city.id === c.city_id)?.name || 'Unknown',
    count: c._count.id
  }));

  // 3. Tables Data
  const recentJobs = await prisma.collectionJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { _count: { select: { businesses: true } } }
  });

  const recentBusinesses = await prisma.business.findMany({
    orderBy: { collection_date: 'desc' },
    take: 5,
    include: { category: true, city: true }
  });

  const kpis = {
    totalBusinesses,
    collectedToday,
    runningJobs,
    completedJobs,
    failedJobs,
    qualifiedLeads,
    leadsInCrm,
    noWebsite,
    noPhone,
    noEmail,
    avgAiScore,
    avgOppScore
  };

  const charts = {
    last30Days: Array.isArray(last30DaysData) ? last30DaysData.map((d: any) => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: d.count
    })) : [],
    topCategories,
    topCities
  };

  return (
    <DashboardClient 
      kpis={kpis} 
      charts={charts} 
      recentJobs={recentJobs} 
      recentBusinesses={recentBusinesses} 
    />
  );
}
