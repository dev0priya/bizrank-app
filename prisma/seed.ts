import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const masterCategories = [
    'Dental Clinic', 'Skin Clinic', 'Hair Transplant Clinic', 'IVF Center', 'Hospital', 'Diagnostic Lab', 'Physiotherapy Clinic',
    'Salon', 'Luxury Salon', 'Spa', 'Beauty Clinic',
    'Gym', 'Fitness Studio', 'Yoga Studio', 'Dance Academy',
    'Coaching Institute', 'Private School', 'International School', 'College', 'Training Institute', 'Music Academy',
    'Restaurant', 'Cafe', 'Cloud Kitchen', 'Bakery',
    'Hotel', 'Resort', 'Homestay', 'Airbnb Host', 'Travel Agency', 'Tour Operator',
    'Real Estate Agency', 'Architect', 'Interior Designer',
    'Furniture Store', 'Luxury Furniture', 'Clothing Store', 'Boutique', 'Designer Boutique', 'Jewellery Store', 'Optical Store',
    'Pet Clinic', 'Veterinary Hospital',
    'Event Planner', 'Wedding Planner', 'Photography Studio',
    'Digital Marketing Agency', 'Software Company', 'IT Company', 'Law Firm', 'CA Firm', 'Consultancy', 'Immigration Consultancy', 'Visa Consultancy',
    'Car Dealership', 'Bike Dealership', 'EV Showroom',
    'Banquet Hall', 'Coworking Space', 'Business Center'
];

const locationsData = [
    {
        country: 'India',
        states: [
            {
                name: 'Delhi',
                cities: [
                    {
                        name: 'Delhi',
                        areas: [
                            'Rohini', 'Pitampura', 'Shalimar Bagh', 'Model Town', 'Civil Lines', 'Rajouri Garden', 'Janakpuri', 
                            'Punjabi Bagh', 'Karol Bagh', 'Lajpat Nagar', 'Dwarka', 'Vasant Kunj', 'South Extension', 
                            'Greater Kailash', 'Connaught Place', 'Paschim Vihar', 'Ashok Vihar', 'Mukherjee Nagar', 
                            'Burari', 'Mayur Vihar', 'Preet Vihar'
                        ]
                    }
                ]
            },
            {
                name: 'Haryana',
                cities: [
                    { name: 'Gurugram', areas: ['Cyber City', 'DLF Phase 1', 'DLF Phase 2', 'DLF Phase 3', 'Sohna Road', 'Golf Course Road', 'Udyog Vihar'] },
                    { name: 'Faridabad', areas: ['Sector 15', 'NIT', 'Surajkund', 'Green Fields', 'Sector 21'] },
                    { name: 'Panipat', areas: ['Model Town', 'Sector 11', 'Sector 12', 'GT Road'] },
                    { name: 'Sonipat', areas: ['Sector 14', 'Model Town', 'Kundli', 'Murthal'] },
                    { name: 'Karnal', areas: ['Sector 13', 'Model Town', 'Sector 14', 'Mall Road'] },
                    { name: 'Hisar', areas: ['Sector 13', 'Sector 14', 'Model Town', 'Urban Estate'] },
                    { name: 'Rohtak', areas: ['Model Town', 'Sector 1', 'Sector 14', 'Delhi Road'] },
                    { name: 'Ambala', areas: ['Ambala Cantt', 'Model Town', 'Sector 7', 'Sadar Bazar'] }
                ]
            },
            {
                name: 'Punjab',
                cities: [
                    { name: 'Chandigarh', areas: ['Sector 17', 'Sector 22', 'Sector 35', 'IT Park', 'Industrial Area'] },
                    { name: 'Mohali', areas: ['Phase 7', 'Phase 8B', 'Phase 10', 'Aero City', 'Sector 62'] },
                    { name: 'Ludhiana', areas: ['Sarabha Nagar', 'Model Town', 'BRS Nagar', 'Feroze Gandhi Market'] },
                    { name: 'Jalandhar', areas: ['Model Town', 'Jalandhar Cantt', 'Urban Estate', 'Adarsh Nagar'] },
                    { name: 'Amritsar', areas: ['Ranjit Avenue', 'Lawrence Road', 'Mall Road', 'Putligarh'] },
                    { name: 'Patiala', areas: ['Leela Bhawan', 'Model Town', 'Tripuri', 'Urban Estate'] }
                ]
            },
            {
                name: 'Uttar Pradesh',
                cities: [
                    { name: 'Noida', areas: ['Sector 18', 'Sector 62', 'Sector 15', 'Sector 137', 'Sector 50'] },
                    { name: 'Greater Noida', areas: ['Knowledge Park', 'Alpha 1', 'Beta 2', 'Pari Chowk'] },
                    { name: 'Ghaziabad', areas: ['Indirapuram', 'Vaishali', 'Raj Nagar Extension', 'Vasundhara'] },
                    { name: 'Meerut', areas: ['Pallavpuram', 'Saket', 'Shastri Nagar', 'Abu Lane'] },
                    { name: 'Lucknow', areas: ['Gomti Nagar', 'Hazratganj', 'Aliganj', 'Indira Nagar'] },
                    { name: 'Kanpur', areas: ['Swaroop Nagar', 'Kakadeo', 'Civil Lines', 'Kidwai Nagar'] },
                    { name: 'Agra', areas: ['Sanjay Place', 'Tajganj', 'Kamla Nagar', 'DayalBagh'] }
                ]
            },
            {
                name: 'Uttarakhand',
                cities: [
                    { name: 'Rishikesh', areas: ['Tapovan', 'Laxman Jhula', 'Muni Ki Reti', 'Avas Vikas'] },
                    { name: 'Haridwar', areas: ['Ranipur', 'Shivalik Nagar', 'Kankhal', 'Jwalapur'] },
                    { name: 'Dehradun', areas: ['Rajpur Road', 'Vasant Vihar', 'Dalanwala', 'Clement Town'] },
                    { name: 'Haldwani', areas: ['Mukhani', 'Kusumkhera', 'Bhotia Parao', 'Rampur Road'] },
                    { name: 'Roorkee', areas: ['Civil Lines', 'IIT Roorkee', 'Ganeshpur', 'Ramnagar'] }
                ]
            },
            {
                name: 'Rajasthan',
                cities: [
                    { name: 'Jaipur', areas: ['Malviya Nagar', 'Vaishali Nagar', 'C-Scheme', 'Mansarovar', 'Bapu Nagar'] },
                    { name: 'Udaipur', areas: ['Fatehpura', 'Hiran Magri', 'Chetak Circle', 'Bapu Bazar'] }
                ]
            },
            {
                name: 'Himachal Pradesh',
                cities: [
                    { name: 'Shimla', areas: ['Mall Road', 'Sanjauli', 'Chhota Shimla', 'New Shimla'] },
                    { name: 'Manali', areas: ['Old Manali', 'Mall Road', 'Vashisht', 'Aleo'] }
                ]
            },
            {
                name: 'Maharashtra',
                cities: [
                    { name: 'Mumbai', areas: ['Andheri', 'Bandra', 'Juhu', 'Colaba', 'Borivali'] },
                    { name: 'Pune', areas: ['Koregaon Park', 'Viman Nagar', 'Kothrud', 'Baner', 'Hinjewadi'] }
                ]
            },
            {
                name: 'Gujarat',
                cities: [
                    { name: 'Ahmedabad', areas: ['Navrangpura', 'Vastrapur', 'Satellite', 'Bopal', 'SG Highway'] },
                    { name: 'Surat', areas: ['Vesu', 'Adajan', 'Piplod', 'Varachha'] }
                ]
            },
            {
                name: 'Karnataka',
                cities: [
                    { name: 'Bengaluru', areas: ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Jayanagar'] },
                    { name: 'Mysuru', areas: ['Kuvempunagar', 'Gokulam', 'Vijayanagar', 'Saraswathipuram'] }
                ]
            }
        ]
    }
];

async function main() {
    console.log(`Clearing existing master data to start fresh...`);
    // Delete in correct relational order
    await prisma.business.deleteMany({});
    await prisma.collectionJob.deleteMany({});
    await prisma.area.deleteMany({});
    await prisma.city.deleteMany({});
    await prisma.state.deleteMany({});
    await prisma.country.deleteMany({});
    await prisma.businessCategory.deleteMany({});

    console.log(`Starting Category Seeding for ${masterCategories.length} categories...`);
    let addedCats = 0;
    for (const category of masterCategories) {
        await prisma.businessCategory.create({
            data: { name: category }
        });
        addedCats++;
    }
    console.log(`Added ${addedCats} new categories.`);

    console.log(`Starting Location Seeding...`);
    for (const countryData of locationsData) {
        const country = await prisma.country.create({
            data: { name: countryData.country }
        });

        for (const stateData of countryData.states) {
            const state = await prisma.state.create({
                data: { name: stateData.name, countryId: country.id }
            });

            for (const cityData of stateData.cities) {
                const city = await prisma.city.create({
                    data: { name: cityData.name, stateId: state.id }
                });

                const areaDataToInsert = cityData.areas.map(areaName => ({
                    name: areaName,
                    cityId: city.id
                }));

                await prisma.area.createMany({
                    data: areaDataToInsert
                });
            }
        }
    }
    console.log(`Location Seed complete.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
