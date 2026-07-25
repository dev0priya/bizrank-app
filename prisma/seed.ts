import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const masterCategories = [
    // Medical & Healthcare
    'Dentist', 'Chiropractor', 'Orthodontist', 'Optometrist', 'Dermatologist', 'Pediatrician',
    'Physical Therapist', 'Psychiatrist', 'Veterinarian', 'Pharmacy', 'Medical Spa', 'Acupuncture Clinic',
    'Family Practice Physician', 'Urgent Care Center', 'Hospital', 'Nursing Home', 'Yoga Studio',

    // Legal & Professional Services
    'Lawyer', 'Personal Injury Attorney', 'Family Law Attorney', 'Criminal Justice Attorney', 'Immigration Attorney',
    'Accounting Firm', 'Tax Preparation Service', 'Financial Planner', 'Insurance Agency', 'Business Consultant',
    'Marketing Agency', 'Web Designer', 'IT Support and Services', 'Real Estate Agency', 'Title Company',

    // Home Services & Contractors
    'Plumber', 'Electrician', 'HVAC Contractor', 'Roofing Contractor', 'Landscaper', 'Pest Control Service',
    'Painter', 'General Contractor', 'Remodeler', 'Flooring Contractor', 'Window Installation Service',
    'Locksmith', 'Cleaning Service', 'Pool Cleaning Service', 'Tree Service', 'Moving Company', 'Storage Facility',

    // Automotive
    'Auto Repair Shop', 'Car Dealer', 'Used Car Dealer', 'Tire Shop', 'Car Wash', 'Auto Body Shop',
    'Mechanic', 'Auto Parts Store', 'Towing Service', 'Motorcycle Repair Shop', 'Car Rental Agency',

    // Restaurants & Food
    'Restaurant', 'Coffee Shop', 'Cafe', 'Pizza Restaurant', 'Bakery', 'Bar', 'Brewery', 'Fast Food Restaurant',
    'Steak house', 'Sushi Restaurant', 'Mexican Restaurant', 'Italian Restaurant', 'Chinese Restaurant',
    'Indian Restaurant', 'Vegan Restaurant', 'Food Truck', 'Caterer', 'Ice Cream Shop',

    // Retail & Shopping
    'Boutique', 'Jewelry Store', 'Furniture Store', 'Clothing Store', 'Shoe Store', 'Hardware Store',
    'Sporting Goods Store', 'Florist', 'Gift Shop', 'Pet Store', 'Book Store', 'Music Store',
    'Antique Store', 'Bridal Shop', 'Toy Store', 'Electronic Store', 'Thrift Store',

    // Fitness & Beauty
    'Gym', 'Personal Trainer', 'Martial Arts School', 'Dance School', 'CrossFit Gym', 'Pilates Studio',
    'Beauty Salon', 'Hair Salon', 'Nail Salon', 'Barber Shop', 'Day Spa', 'Massage Therapist',
    'Tanning Salon', 'Tattoo Shop', 'Skin Care Clinic',

    // Education & Childcare
    'Preschool', 'Day Care Center', 'Tutor', 'Private School', 'Music School', 'Language School',
    'Driving School', 'Cooking School', 'Art School', 'Montessori School',

    // Events & Weddings
    'Wedding Venue', 'Event Planner', 'Wedding Photographer', 'DJ', 'Banquet Hall', 'Party Equipment Rental Service',
    'Limo Service', 'Travel Agency', 'Hotel', 'Bed & Breakfast'
];

async function main() {
    console.log(`Starting Category Seeding for ${masterCategories.length} categories...`);

    let added = 0;
    for (const category of masterCategories) {
        // Upsert by name (assuming name is unique, wait, schema might not have unique on name)
        // Let's use findFirst, then create if not exists
        const existing = await prisma.businessCategory.findFirst({
            where: { name: category }
        });

        if (!existing) {
            await prisma.businessCategory.create({
                data: { name: category }
            });
            added++;
        }
    }

    console.log(`Seed complete. Added ${added} new categories.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
