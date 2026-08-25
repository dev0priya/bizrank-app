import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// BIZRANK CATEGORY TAXONOMY
// Aligned to website-sales opportunity
// ==========================================
const bizrankCategories = [
  // BEAUTY & WELLNESS — High opportunity
  { name: 'Salon', displayName: 'Salon / Hair Studio', websiteOpportunityWeight: 0.90, opportunityEligible: true, providerKeywords: '["beauty_salon","hair_salon","salon","barber_shop","barbershop"]' },
  { name: 'Beauty Parlour', displayName: 'Beauty Parlour', websiteOpportunityWeight: 0.90, opportunityEligible: true, providerKeywords: '["beauty_parlour","beauty_salon","parlour"]' },
  { name: 'Barbershop', displayName: 'Barbershop / Barber', websiteOpportunityWeight: 0.80, opportunityEligible: true, providerKeywords: '["barber_shop","barber","barbershop"]' },
  { name: 'Spa', displayName: 'Spa / Wellness Center', websiteOpportunityWeight: 0.92, opportunityEligible: true, providerKeywords: '["spa","wellness_center","massage_parlor","massage_therapist"]' },
  { name: 'Gym', displayName: 'Gym / Fitness Center', websiteOpportunityWeight: 0.92, opportunityEligible: true, providerKeywords: '["gym","fitness_center","health_club","fitness_studio"]' },
  { name: 'Yoga Studio', displayName: 'Yoga Studio', websiteOpportunityWeight: 0.88, opportunityEligible: true, providerKeywords: '["yoga_studio","yoga_instructor","yoga"]' },
  { name: 'Dance Studio', displayName: 'Dance Studio / Academy', websiteOpportunityWeight: 0.85, opportunityEligible: true, providerKeywords: '["dance_school","dance_studio","dance_academy"]' },
  { name: 'Fitness Trainer', displayName: 'Personal Fitness Trainer', websiteOpportunityWeight: 0.80, opportunityEligible: true, providerKeywords: '["personal_trainer","fitness_trainer"]' },
  { name: 'Nail Salon', displayName: 'Nail Salon / Nail Art', websiteOpportunityWeight: 0.82, opportunityEligible: true, providerKeywords: '["nail_salon","nail_studio","nail_art"]' },

  // FOOD & BEVERAGE — High opportunity
  { name: 'Restaurant', displayName: 'Restaurant', websiteOpportunityWeight: 0.88, opportunityEligible: true, providerKeywords: '["restaurant","food","eatery","diner","dhaba"]' },
  { name: 'Cafe', displayName: 'Cafe / Coffee Shop', websiteOpportunityWeight: 0.85, opportunityEligible: true, providerKeywords: '["cafe","coffee_shop","coffee_house","bakery_cafe"]' },
  { name: 'Bakery', displayName: 'Bakery / Pastry Shop', websiteOpportunityWeight: 0.82, opportunityEligible: true, providerKeywords: '["bakery","pastry_shop","confectionery"]' },
  { name: 'Dessert Shop', displayName: 'Dessert Shop / Ice Cream', websiteOpportunityWeight: 0.78, opportunityEligible: true, providerKeywords: '["dessert_shop","ice_cream","sweet_shop","mithai"]' },
  { name: 'Fast Food', displayName: 'Fast Food Restaurant', websiteOpportunityWeight: 0.78, opportunityEligible: true, providerKeywords: '["fast_food_restaurant","fast_food","burger","pizza"]' },
  { name: 'Cloud Kitchen', displayName: 'Cloud Kitchen / Delivery', websiteOpportunityWeight: 0.88, opportunityEligible: true, providerKeywords: '["cloud_kitchen","delivery_kitchen","ghost_kitchen"]' },
  { name: 'Catering Service', displayName: 'Catering Service', websiteOpportunityWeight: 0.90, opportunityEligible: true, providerKeywords: '["catering_service","caterer","catering"]' },
  { name: 'Banquet Hall', displayName: 'Banquet Hall / Event Venue', websiteOpportunityWeight: 0.92, opportunityEligible: true, providerKeywords: '["banquet_hall","event_venue","party_hall","convention_center"]' },

  // HOSPITALITY & TRAVEL — Very high opportunity
  { name: 'Hotel', displayName: 'Hotel / Lodge', websiteOpportunityWeight: 0.95, opportunityEligible: true, providerKeywords: '["hotel","lodging","inn","motel"]' },
  { name: 'Resort', displayName: 'Resort / Retreat', websiteOpportunityWeight: 0.95, opportunityEligible: true, providerKeywords: '["resort","retreat","holiday_resort"]' },
  { name: 'Guest House', displayName: 'Guest House / B&B', websiteOpportunityWeight: 0.90, opportunityEligible: true, providerKeywords: '["guest_house","bed_and_breakfast","bnb","guesthouse"]' },
  { name: 'Hostel', displayName: 'Hostel / Backpacker', websiteOpportunityWeight: 0.88, opportunityEligible: true, providerKeywords: '["hostel","backpacker_hostel"]' },
  { name: 'Boutique Hotel', displayName: 'Boutique Hotel', websiteOpportunityWeight: 0.95, opportunityEligible: true, providerKeywords: '["boutique_hotel","heritage_hotel","boutique_stay"]' },
  { name: 'Homestay', displayName: 'Homestay / Villa', websiteOpportunityWeight: 0.88, opportunityEligible: true, providerKeywords: '["homestay","villa","vacation_rental","holiday_home"]' },
  { name: 'Travel Agency', displayName: 'Travel Agency', websiteOpportunityWeight: 0.92, opportunityEligible: true, providerKeywords: '["travel_agency","travel_agent","tours_and_travels"]' },
  { name: 'Tour Operator', displayName: 'Tour Operator / Holidays', websiteOpportunityWeight: 0.92, opportunityEligible: true, providerKeywords: '["tour_operator","holiday_company","tour_guide"]' },

  // HEALTHCARE — High opportunity
  { name: 'Dental Clinic', displayName: 'Dental Clinic', websiteOpportunityWeight: 0.92, opportunityEligible: true, providerKeywords: '["dentist","dental_clinic","dental_office","orthodontist"]' },
  { name: 'Dermatology Clinic', displayName: 'Skin / Dermatology Clinic', websiteOpportunityWeight: 0.90, opportunityEligible: true, providerKeywords: '["dermatologist","skin_care_clinic","skin_clinic"]' },
  { name: 'Physiotherapy Clinic', displayName: 'Physiotherapy / Rehab', websiteOpportunityWeight: 0.88, opportunityEligible: true, providerKeywords: '["physiotherapist","physical_therapist","physio_clinic"]' },
  { name: 'Eye Clinic', displayName: 'Eye Clinic / Optometrist', websiteOpportunityWeight: 0.88, opportunityEligible: true, providerKeywords: '["optometrist","ophthalmologist","eye_clinic","optical_store"]' },
  { name: 'Diagnostic Center', displayName: 'Diagnostic / Lab Center', websiteOpportunityWeight: 0.85, opportunityEligible: true, providerKeywords: '["diagnostic_center","medical_laboratory","pathology_lab","blood_test"]' },
  { name: 'Veterinary Clinic', displayName: 'Veterinary / Pet Clinic', websiteOpportunityWeight: 0.85, opportunityEligible: true, providerKeywords: '["veterinarian","vet","animal_hospital","pet_clinic"]' },

  // EDUCATION — High opportunity
  { name: 'Coaching Institute', displayName: 'Coaching / Tuition Center', websiteOpportunityWeight: 0.90, opportunityEligible: true, providerKeywords: '["coaching_center","tutoring_service","coaching_institute","tuition_center"]' },
  { name: 'Training Institute', displayName: 'Training Institute / Academy', websiteOpportunityWeight: 0.90, opportunityEligible: true, providerKeywords: '["training_center","skill_training","institute","academy"]' },
  { name: 'Computer Institute', displayName: 'Computer / IT Training', websiteOpportunityWeight: 0.88, opportunityEligible: true, providerKeywords: '["computer_training","it_training","programming_school"]' },
  { name: 'Language Institute', displayName: 'Language Institute', websiteOpportunityWeight: 0.85, opportunityEligible: true, providerKeywords: '["language_school","english_classes","spoken_english"]' },
  { name: 'Music School', displayName: 'Music School / Academy', websiteOpportunityWeight: 0.85, opportunityEligible: true, providerKeywords: '["music_school","music_teacher","music_academy"]' },
  { name: 'Dance School', displayName: 'Dance School', websiteOpportunityWeight: 0.83, opportunityEligible: true, providerKeywords: '["dance_school","dance_class","dance_academy"]' },

  // REAL ESTATE & HOME — High opportunity
  { name: 'Real Estate Agency', displayName: 'Real Estate Agency', websiteOpportunityWeight: 0.93, opportunityEligible: true, providerKeywords: '["real_estate_agency","property_dealer","real_estate_agent","realty"]' },
  { name: 'Interior Designer', displayName: 'Interior Designer / Decorator', websiteOpportunityWeight: 0.92, opportunityEligible: true, providerKeywords: '["interior_designer","interior_decorator","home_decor_designer"]' },
  { name: 'Architect', displayName: 'Architect / Architectural Firm', websiteOpportunityWeight: 0.92, opportunityEligible: true, providerKeywords: '["architect","architectural_firm","building_designer"]' },
  { name: 'Construction Company', displayName: 'Construction / Builder', websiteOpportunityWeight: 0.88, opportunityEligible: true, providerKeywords: '["construction_company","builder","contractor","civil_contractor"]' },

  // EVENTS & PHOTOGRAPHY — High opportunity
  { name: 'Photographer', displayName: 'Photographer / Photography Studio', websiteOpportunityWeight: 0.92, opportunityEligible: true, providerKeywords: '["photographer","photography_studio","photo_studio"]' },
  { name: 'Wedding Photographer', displayName: 'Wedding Photographer', websiteOpportunityWeight: 0.95, opportunityEligible: true, providerKeywords: '["wedding_photographer","wedding_photography","bridal_photographer"]' },
  { name: 'Videographer', displayName: 'Videographer / Video Production', websiteOpportunityWeight: 0.90, opportunityEligible: true, providerKeywords: '["videographer","video_production","film_production"]' },
  { name: 'Event Planner', displayName: 'Event Planner / Organizer', websiteOpportunityWeight: 0.90, opportunityEligible: true, providerKeywords: '["event_planner","event_organizer","event_management"]' },
  { name: 'Wedding Planner', displayName: 'Wedding Planner', websiteOpportunityWeight: 0.95, opportunityEligible: true, providerKeywords: '["wedding_planner","wedding_management","wedding_coordinator"]' },

  // AUTOMOTIVE — Medium opportunity
  { name: 'Car Rental', displayName: 'Car Rental / Taxi Service', websiteOpportunityWeight: 0.85, opportunityEligible: true, providerKeywords: '["car_rental","taxi_service","cab_service","car_hire"]' },
  { name: 'Car Detailing', displayName: 'Car Detailing / Wash', websiteOpportunityWeight: 0.78, opportunityEligible: true, providerKeywords: '["car_detailing","car_wash","auto_detailing"]' },
  { name: 'Auto Service', displayName: 'Auto Workshop / Mechanic', websiteOpportunityWeight: 0.75, opportunityEligible: true, providerKeywords: '["auto_repair","car_repair","mechanic","automobile_workshop"]' },

  // PETS — High opportunity
  { name: 'Pet Grooming', displayName: 'Pet Grooming / Salon', websiteOpportunityWeight: 0.88, opportunityEligible: true, providerKeywords: '["pet_grooming","dog_grooming","pet_salon"]' },
  { name: 'Pet Boarding', displayName: 'Pet Boarding / Daycare', websiteOpportunityWeight: 0.88, opportunityEligible: true, providerKeywords: '["pet_boarding","dog_boarding","pet_daycare","kennel"]' },

  // RETAIL — Medium/High opportunity
  { name: 'Jewellery Store', displayName: 'Jewellery Store', websiteOpportunityWeight: 0.88, opportunityEligible: true, providerKeywords: '["jewelry_store","jewellery_shop","jeweler"]' },
  { name: 'Fashion Store', displayName: 'Fashion / Clothing Store', websiteOpportunityWeight: 0.85, opportunityEligible: true, providerKeywords: '["clothing_store","fashion_store","apparel_store","garment_shop"]' },
  { name: 'Boutique', displayName: 'Boutique / Designer Wear', websiteOpportunityWeight: 0.88, opportunityEligible: true, providerKeywords: '["boutique","designer_boutique","fashion_boutique"]' },
  { name: 'Furniture Store', displayName: 'Furniture Store', websiteOpportunityWeight: 0.85, opportunityEligible: true, providerKeywords: '["furniture_store","furniture_shop","home_furniture"]' },
  { name: 'Home Decor', displayName: 'Home Decor / Lifestyle Store', websiteOpportunityWeight: 0.85, opportunityEligible: true, providerKeywords: '["home_decor","lifestyle_store","interior_store"]' },

  // LAUNDRY & TAILORING — Medium opportunity
  { name: 'Laundry', displayName: 'Laundry / Dry Cleaning', websiteOpportunityWeight: 0.75, opportunityEligible: true, providerKeywords: '["laundry","dry_cleaner","laundromat","laundry_service"]' },
  { name: 'Tailor', displayName: 'Tailor / Alteration Service', websiteOpportunityWeight: 0.72, opportunityEligible: true, providerKeywords: '["tailor","alteration_service","clothing_alteration"]' },

  // NOT ELIGIBLE — kept for data integrity but not shown in sales UI
  { name: 'ATM', displayName: 'ATM', websiteOpportunityWeight: 0.0, opportunityEligible: false, providerKeywords: '["atm","cash_machine","bank_atm"]' },
  { name: 'Petrol Pump', displayName: 'Petrol Pump / Fuel Station', websiteOpportunityWeight: 0.05, opportunityEligible: false, providerKeywords: '["gas_station","petrol_pump","fuel_station","petrol_station"]' },
  { name: 'Government Office', displayName: 'Government Office', websiteOpportunityWeight: 0.0, opportunityEligible: false, providerKeywords: '["government_office","government_building","municipal_office"]' },
  { name: 'Police Station', displayName: 'Police Station', websiteOpportunityWeight: 0.0, opportunityEligible: false, providerKeywords: '["police_station","police","thana"]' },
  { name: 'Post Office', displayName: 'Post Office', websiteOpportunityWeight: 0.0, opportunityEligible: false, providerKeywords: '["post_office","postal_service"]' },
  { name: 'Public Park', displayName: 'Public Park / Garden', websiteOpportunityWeight: 0.0, opportunityEligible: false, providerKeywords: '["park","garden","public_garden"]' },
];

// ==========================================
// INDIA GEOGRAPHIC DATA
// All 28 States + 8 Union Territories
// With major cities and commercial areas
// Source: Public geographic data (Census 2011 towns, Wikipedia)
// ==========================================

interface AreaData { name: string; lat?: number; lng?: number; }
interface CityData { name: string; type?: string; lat?: number; lng?: number; areas?: string[]; }
interface StateData {
  name: string;
  code: string; // ISO 3166-2
  type: 'STATE' | 'UNION_TERRITORY';
  cities: CityData[];
}

const indiaStates: StateData[] = [
  // ==========================================
  // UNION TERRITORIES
  // ==========================================
  {
    name: 'Delhi',
    code: 'IN-DL',
    type: 'UNION_TERRITORY',
    cities: [
      { name: 'New Delhi', type: 'CITY', lat: 28.6139, lng: 77.2090, areas: ['Connaught Place', 'Janpath', 'Rajpath', 'Barakhamba', 'Mandi House', 'Khan Market', 'Lodhi Colony', 'Sarojini Nagar', 'Chanakyapuri'] },
      { name: 'Delhi', type: 'CITY', lat: 28.7041, lng: 77.1025, areas: [
        'Rohini', 'Pitampura', 'Shalimar Bagh', 'Model Town', 'Civil Lines', 'Rajouri Garden', 'Janakpuri',
        'Punjabi Bagh', 'Karol Bagh', 'Lajpat Nagar', 'Dwarka', 'Vasant Kunj', 'South Extension',
        'Greater Kailash', 'Paschim Vihar', 'Ashok Vihar', 'Mukherjee Nagar', 'Mayur Vihar',
        'Preet Vihar', 'Laxmi Nagar', 'Shahdara', 'Vivek Vihar', 'Dilshad Garden', 'Rohini Sector 7',
        'Rohini Sector 9', 'Rohini Sector 11', 'Rohini Sector 16', 'Rohini Sector 24',
        'Dwarka Sector 6', 'Dwarka Sector 10', 'Dwarka Sector 12', 'Dwarka Mor',
        'Saket', 'Malviya Nagar', 'Hauz Khas', 'Green Park', 'Kalkaji', 'Nehru Place',
        'Okhla', 'Jasola', 'Burari', 'Narela', 'Bawana', 'Mundka', 'Uttam Nagar',
        'Vikaspuri', 'Bindapur', 'Tilak Nagar', 'Subhash Nagar', 'Tagore Garden'
      ]},
      { name: 'Noida', type: 'CITY', lat: 28.5355, lng: 77.3910, areas: ['Sector 18', 'Sector 62', 'Sector 15', 'Sector 50', 'Sector 137', 'Sector 76', 'Sector 78', 'Sector 93'] },
      { name: 'Greater Noida', type: 'CITY', lat: 28.4744, lng: 77.5040, areas: ['Knowledge Park', 'Alpha 1', 'Beta 2', 'Pari Chowk', 'Omega', 'NRI City', 'Sector Delta'] },
      { name: 'Faridabad', type: 'CITY', lat: 28.4089, lng: 77.3178, areas: ['Sector 15', 'NIT', 'Surajkund', 'Green Fields', 'Sector 21', 'Sector 28'] },
    ]
  },
  {
    name: 'Chandigarh',
    code: 'IN-CH',
    type: 'UNION_TERRITORY',
    cities: [
      { name: 'Chandigarh', type: 'CITY', lat: 30.7333, lng: 76.7794, areas: ['Sector 17', 'Sector 22', 'Sector 35', 'Sector 43', 'IT Park', 'Industrial Area Phase 1', 'Elante Mall Area', 'Sector 9', 'Sector 8', 'Sector 34', 'Sector 37'] },
      { name: 'Mohali', type: 'CITY', lat: 30.6942, lng: 76.7177, areas: ['Phase 7', 'Phase 8B', 'Phase 10', 'Aero City', 'Sector 62', 'Sector 66', 'Sector 70'] },
      { name: 'Panchkula', type: 'CITY', lat: 30.6942, lng: 76.8606, areas: ['Sector 5', 'Sector 8', 'Sector 11', 'Industrial Area'] },
    ]
  },
  {
    name: 'Puducherry',
    code: 'IN-PY',
    type: 'UNION_TERRITORY',
    cities: [
      { name: 'Puducherry', type: 'CITY', lat: 11.9416, lng: 79.8083, areas: ['White Town', 'Villianur', 'Ariyankuppam', 'MG Road', 'Kamaraj Salai', 'Nehru Street', 'Anna Salai'] },
      { name: 'Karaikal', type: 'CITY', lat: 10.9254, lng: 79.8380, areas: ['Karaikal Town', 'Ambagarathur'] },
    ]
  },
  {
    name: 'Jammu and Kashmir',
    code: 'IN-JK',
    type: 'UNION_TERRITORY',
    cities: [
      { name: 'Srinagar', type: 'CITY', lat: 34.0837, lng: 74.7973, areas: ['Lal Chowk', 'Dal Lake Area', 'Residency Road', 'Rajbagh', 'Jawahar Nagar', 'Hyderpora', 'Hazratbal'] },
      { name: 'Jammu', type: 'CITY', lat: 32.7266, lng: 74.8570, areas: ['Gandhi Nagar', 'Residency Road', 'Bakshi Nagar', 'Trikuta Nagar', 'Shastri Nagar'] },
      { name: 'Anantnag', type: 'CITY', lat: 33.7311, lng: 75.1487, areas: ['Main Market', 'Mattan'] },
    ]
  },
  {
    name: 'Ladakh',
    code: 'IN-LA',
    type: 'UNION_TERRITORY',
    cities: [
      { name: 'Leh', type: 'CITY', lat: 34.1526, lng: 77.5771, areas: ['Main Market', 'Old Town', 'Fort Road', 'Changspa'] },
      { name: 'Kargil', type: 'CITY', lat: 34.5539, lng: 76.1349, areas: ['Main Bazar', 'Baroo'] },
    ]
  },
  {
    name: 'Andaman and Nicobar Islands',
    code: 'IN-AN',
    type: 'UNION_TERRITORY',
    cities: [
      { name: 'Port Blair', type: 'CITY', lat: 11.6234, lng: 92.7265, areas: ['Aberdeen Bazar', 'Delanipur', 'Haddo', 'Phoenix Bay', 'Prothrapur'] },
    ]
  },
  {
    name: 'Lakshadweep',
    code: 'IN-LD',
    type: 'UNION_TERRITORY',
    cities: [
      { name: 'Kavaratti', type: 'CITY', lat: 10.5626, lng: 72.6369, areas: ['Kavaratti Town'] },
    ]
  },
  {
    name: 'Dadra and Nagar Haveli and Daman and Diu',
    code: 'IN-DH',
    type: 'UNION_TERRITORY',
    cities: [
      { name: 'Silvassa', type: 'CITY', lat: 20.2766, lng: 73.0145, areas: ['Naroli Road', 'Amli', 'Khadoli'] },
      { name: 'Daman', type: 'CITY', lat: 20.3974, lng: 72.8328, areas: ['Daman City Center', 'Nani Daman', 'Moti Daman'] },
      { name: 'Diu', type: 'CITY', lat: 20.7153, lng: 70.9876, areas: ['Diu Town', 'Nagoa'] },
    ]
  },

  // ==========================================
  // 28 STATES
  // ==========================================
  {
    name: 'Andhra Pradesh',
    code: 'IN-AP',
    type: 'STATE',
    cities: [
      { name: 'Visakhapatnam', type: 'CITY', lat: 17.6868, lng: 83.2185, areas: ['MVP Colony', 'Rushikonda', 'Madhurawada', 'Dwaraka Nagar', 'Gajuwaka', 'Steel Plant Area', 'Siripuram'] },
      { name: 'Vijayawada', type: 'CITY', lat: 16.5062, lng: 80.6480, areas: ['Benz Circle', 'Eluru Road', 'MG Road', 'Patamata', 'Gandhinagar', 'Moghalrajpuram'] },
      { name: 'Amaravati', type: 'CITY', lat: 16.5731, lng: 80.3554, areas: ['Capital City Area', 'Thullur', 'Nelapadu'] },
      { name: 'Guntur', type: 'CITY', lat: 16.3067, lng: 80.4365, areas: ['Brodipet', 'Arundelpet', 'Gorantla', 'Lakshmipuram'] },
      { name: 'Nellore', type: 'CITY', lat: 14.4426, lng: 79.9865, areas: ['Magunta Layout', 'Santhanuthala Padu', 'Grand Bypass Road'] },
      { name: 'Kurnool', type: 'CITY', lat: 15.8281, lng: 78.0373, areas: ['Bellary Road', 'Gandhinagar', 'RS Road'] },
      { name: 'Tirupati', type: 'CITY', lat: 13.6288, lng: 79.4192, areas: ['Balaji Colony', 'Tilak Road', 'Car Street', 'Karakambadi Road'] },
      { name: 'Rajahmundry', type: 'CITY', lat: 17.0005, lng: 81.8040, areas: ['Innespeta', 'Danavaipeta', 'Rajamahendravaram'] },
    ]
  },
  {
    name: 'Arunachal Pradesh',
    code: 'IN-AR',
    type: 'STATE',
    cities: [
      { name: 'Itanagar', type: 'CITY', lat: 27.0844, lng: 93.6053, areas: ['Naharlagun', 'Ganga Market', 'Papu Nallah'] },
      { name: 'Naharlagun', type: 'CITY', lat: 27.1054, lng: 93.6957, areas: ['Town Center', 'Banderdewa'] },
      { name: 'Pasighat', type: 'CITY', lat: 28.0659, lng: 95.3238, areas: ['Main Bazar', 'East Siang'] },
    ]
  },
  {
    name: 'Assam',
    code: 'IN-AS',
    type: 'STATE',
    cities: [
      { name: 'Guwahati', type: 'CITY', lat: 26.1445, lng: 91.7362, areas: ['Fancy Bazar', 'Ulubari', 'Ganeshguri', 'Six Mile', 'Bhangagarh', 'Lakhtokia', 'Dispur', 'Zoo Narengi Road', 'GS Road', 'Jalukbari', 'Hatigaon'] },
      { name: 'Silchar', type: 'CITY', lat: 24.8333, lng: 92.7789, areas: ['Ranir Bazar', 'Ambikapur', 'Link Road'] },
      { name: 'Dibrugarh', type: 'CITY', lat: 27.4728, lng: 94.9120, areas: ['AT Road', 'Lahoal', 'Khanikar'] },
      { name: 'Jorhat', type: 'CITY', lat: 26.7509, lng: 94.2037, areas: ['AT Road', 'Gar Ali', 'Mahabali Road'] },
      { name: 'Tezpur', type: 'CITY', lat: 26.6338, lng: 92.8000, areas: ['KC Road', 'Dekargaon', 'Tezpur Town'] },
      { name: 'Nagaon', type: 'CITY', lat: 26.3461, lng: 92.6842, areas: ['Main Town', 'Joypur', 'Rupahi'] },
    ]
  },
  {
    name: 'Bihar',
    code: 'IN-BR',
    type: 'STATE',
    cities: [
      { name: 'Patna', type: 'CITY', lat: 25.5941, lng: 85.1376, areas: ['Boring Road', 'Kankarbagh', 'Rajendra Nagar', 'Bailey Road', 'Frazer Road', 'Dak Bungalow', 'Ashiana', 'Saguna More', 'Patna City', 'Danapur'] },
      { name: 'Gaya', type: 'CITY', lat: 24.7914, lng: 85.0002, areas: ['Bodh Gaya', 'Station Road', 'Civil Lines'] },
      { name: 'Bhagalpur', type: 'CITY', lat: 25.2425, lng: 86.9842, areas: ['Tilkamanjhi', 'Khalifabag', 'Champanagar'] },
      { name: 'Muzaffarpur', type: 'CITY', lat: 26.1209, lng: 85.3647, areas: ['Brahampura', 'Mithanpura', 'Juran Chapra'] },
      { name: 'Darbhanga', type: 'CITY', lat: 26.1542, lng: 85.8918, areas: ['Laheriasarai', 'Benta', 'Sadar Hospital Area'] },
      { name: 'Purnia', type: 'CITY', lat: 25.7771, lng: 87.4753, areas: ['Line Bazar', 'Durgabari Road', 'Purnia Town'] },
    ]
  },
  {
    name: 'Chhattisgarh',
    code: 'IN-CT',
    type: 'STATE',
    cities: [
      { name: 'Raipur', type: 'CITY', lat: 21.2514, lng: 81.6296, areas: ['Pandri', 'Telibandha', 'GE Road', 'Fafadih', 'Devendra Nagar', 'Shankar Nagar', 'Avanti Vihar'] },
      { name: 'Bhilai', type: 'CITY', lat: 21.1938, lng: 81.3509, areas: ['Steel Plant Area', 'Sector 1', 'Durg Road', 'Risali'] },
      { name: 'Bilaspur', type: 'CITY', lat: 22.0796, lng: 82.1391, areas: ['Vyapar Vihar', 'Mungeli Road', 'Tifra'] },
      { name: 'Korba', type: 'CITY', lat: 22.3595, lng: 82.7501, areas: ['Sector 4', 'NTPC Colony', 'Deepka'] },
    ]
  },
  {
    name: 'Goa',
    code: 'IN-GA',
    type: 'STATE',
    cities: [
      { name: 'Panaji', type: 'CITY', lat: 15.4989, lng: 73.8278, areas: ['Fontainhas', 'Altinho', 'Miramar', 'Dona Paula', 'Campal', 'Caranzalem'] },
      { name: 'Margao', type: 'CITY', lat: 15.2832, lng: 73.9862, areas: ['Monte Hill', 'Fatorda', 'Aquem', 'Comba'] },
      { name: 'Vasco da Gama', type: 'CITY', lat: 15.3982, lng: 73.8113, areas: ['Baina', 'New Vaddem', 'Hinu'] },
      { name: 'Mapusa', type: 'CITY', lat: 15.5986, lng: 73.8098, areas: ['Mapusa Town', 'Angod', 'Tivim'] },
      { name: 'Calangute', type: 'CITY', lat: 15.5440, lng: 73.7553, areas: ['Calangute Beach', 'Baga', 'Candolim'] },
      { name: 'Panjim North Goa', type: 'CITY', lat: 15.5, lng: 73.85, areas: ['Anjuna', 'Vagator', 'Chapora', 'Morjim'] },
    ]
  },
  {
    name: 'Gujarat',
    code: 'IN-GJ',
    type: 'STATE',
    cities: [
      { name: 'Ahmedabad', type: 'CITY', lat: 23.0225, lng: 72.5714, areas: ['Navrangpura', 'Vastrapur', 'Satellite', 'Bopal', 'SG Highway', 'CG Road', 'Maninagar', 'Gota', 'Chandkheda', 'Prahlad Nagar', 'Bodakdev', 'Shyamal', 'Ellis Bridge', 'Paldi', 'Naranpura', 'Memnagar', 'Thaltej'] },
      { name: 'Surat', type: 'CITY', lat: 21.1702, lng: 72.8311, areas: ['Vesu', 'Adajan', 'Piplod', 'Varachha', 'Katargam', 'Athwalines', 'Majura Gate', 'Nanpura', 'Citylight', 'Dumas Road', 'Pal'] },
      { name: 'Vadodara', type: 'CITY', lat: 22.3072, lng: 73.1812, areas: ['Alkapuri', 'Fatehgunj', 'Sayajigunj', 'Manjalpur', 'Gotri Road', 'Sama', 'Karelibaug'] },
      { name: 'Rajkot', type: 'CITY', lat: 22.3039, lng: 70.8022, areas: ['Kalawad Road', 'Yagnik Road', 'University Road', 'Jubilee Chowk', 'Amin Marg', 'Bhakti Nagar'] },
      { name: 'Gandhinagar', type: 'CITY', lat: 23.2156, lng: 72.6369, areas: ['Sector 16', 'Sector 17', 'Infocity', 'Sargasan'] },
      { name: 'Bhavnagar', type: 'CITY', lat: 21.7645, lng: 72.1519, areas: ['Waghawadi Road', 'Ghogha Road', 'Crescent Circle'] },
      { name: 'Anand', type: 'CITY', lat: 22.5645, lng: 72.9289, areas: ['Vallabh Vidyanagar', 'Grid', 'Anand Town'] },
      { name: 'Surat New West', type: 'CITY', lat: 21.18, lng: 72.79, areas: ['Althan', 'Palanpur', 'Jahangirabad'] },
    ]
  },
  {
    name: 'Haryana',
    code: 'IN-HR',
    type: 'STATE',
    cities: [
      { name: 'Gurugram', type: 'CITY', lat: 28.4595, lng: 77.0266, areas: ['Cyber City', 'DLF Phase 1', 'DLF Phase 2', 'DLF Phase 3', 'DLF Phase 4', 'DLF Phase 5', 'Sohna Road', 'Golf Course Road', 'MG Road', 'Udyog Vihar', 'Sector 14', 'Sector 29', 'Sector 31', 'Sector 56', 'Palam Vihar', 'Nirvana Country', 'South City'] },
      { name: 'Faridabad', type: 'CITY', lat: 28.4089, lng: 77.3178, areas: ['Sector 15', 'NIT', 'Surajkund', 'Green Fields', 'Sector 21', 'Sector 28', 'Sector 29', 'Sector 44', 'NHPC Colony'] },
      { name: 'Rohtak', type: 'CITY', lat: 28.8955, lng: 76.6066, areas: ['Model Town', 'Sector 1', 'Sector 14', 'Delhi Road', 'Civil Hospital Road', 'Subhash Colony', 'Sanghi Colony'] },
      { name: 'Panipat', type: 'CITY', lat: 29.3909, lng: 76.9635, areas: ['Model Town', 'Sector 11', 'Sector 12', 'GT Road', 'Old Anaj Mandi'] },
      { name: 'Sonipat', type: 'CITY', lat: 28.9931, lng: 77.0151, areas: ['Sector 14', 'Model Town', 'Kundli', 'Murthal'] },
      { name: 'Karnal', type: 'CITY', lat: 29.6857, lng: 76.9905, areas: ['Sector 13', 'Model Town', 'Sector 14', 'Mall Road', 'Kunjpura Road'] },
      { name: 'Hisar', type: 'CITY', lat: 29.1492, lng: 75.7217, areas: ['Sector 13', 'Sector 14', 'Model Town', 'Urban Estate', 'Sector 15'] },
      { name: 'Ambala', type: 'CITY', lat: 30.3782, lng: 76.7767, areas: ['Ambala Cantt', 'Model Town', 'Sector 7', 'Sadar Bazar'] },
      { name: 'Yamunanagar', type: 'CITY', lat: 30.1290, lng: 77.2674, areas: ['Model Town', 'Jagadhri', 'Bilaspur Road'] },
      { name: 'Panchkula', type: 'CITY', lat: 30.6942, lng: 76.8606, areas: ['Sector 5', 'Sector 8', 'Sector 9', 'Sector 11', 'Sector 15', 'Sector 17'] },
      { name: 'Bahadurgarh', type: 'CITY', lat: 28.6921, lng: 76.9267, areas: ['Rohad Road', 'Block A', 'Old Faridabad Road'] },
      { name: 'Rewari', type: 'CITY', lat: 28.1993, lng: 76.6163, areas: ['Model Town', 'Delhi Road', 'Jail Road'] },
      { name: 'Bhiwani', type: 'CITY', lat: 28.7875, lng: 76.1322, areas: ['Circular Road', 'Model Town', 'Vikas Colony'] },
    ]
  },
  {
    name: 'Himachal Pradesh',
    code: 'IN-HP',
    type: 'STATE',
    cities: [
      { name: 'Shimla', type: 'CITY', lat: 31.1048, lng: 77.1734, areas: ['Mall Road', 'Sanjauli', 'Chhota Shimla', 'New Shimla', 'Lakkar Bazar', 'Cart Road', 'Chaura Maidan', 'Boileauganj', 'Vikas Nagar'] },
      { name: 'Manali', type: 'CITY', lat: 32.2396, lng: 77.1887, areas: ['Old Manali', 'Mall Road', 'Vashisht', 'Aleo', 'Rangri'] },
      { name: 'Dharamsala', type: 'CITY', lat: 32.2190, lng: 76.3234, areas: ['McLeod Ganj', 'Kotwali Bazar', 'Bhagsu Road', 'Dharamkot'] },
      { name: 'Solan', type: 'CITY', lat: 30.9045, lng: 77.0967, areas: ['Salogra', 'Kumarhatti', 'Rajgarh Road'] },
      { name: 'Mandi', type: 'CITY', lat: 31.7077, lng: 76.9318, areas: ['Indira Market', 'Seri', 'Paddar'] },
      { name: 'Kullu', type: 'CITY', lat: 31.9579, lng: 77.1095, areas: ['Dhalpur', 'Akara', 'Sarwari'] },
      { name: 'Kasauli', type: 'CITY', lat: 30.9034, lng: 76.9613, areas: ['Mall Road', 'Kasauli Town'] },
    ]
  },
  {
    name: 'Jharkhand',
    code: 'IN-JH',
    type: 'STATE',
    cities: [
      { name: 'Ranchi', type: 'CITY', lat: 23.3441, lng: 85.3096, areas: ['Main Road', 'Lalpur', 'Harmu', 'Kanke Road', 'Ashok Nagar', 'Bariatu Road', 'Doranda', 'Hatia'] },
      { name: 'Jamshedpur', type: 'CITY', lat: 22.8046, lng: 86.2029, areas: ['Bistupur', 'Sakchi', 'Kadma', 'Telco Colony', 'Adityapur'] },
      { name: 'Dhanbad', type: 'CITY', lat: 23.7957, lng: 86.4304, areas: ['Jharia', 'Hirapur', 'Bank More', 'Shastri Nagar'] },
      { name: 'Bokaro', type: 'CITY', lat: 23.6693, lng: 86.1511, areas: ['Sector 4', 'Chas', 'City Centre'] },
      { name: 'Hazaribagh', type: 'CITY', lat: 23.9925, lng: 85.3637, areas: ['Hari Om Nagar', 'Canary Hill', 'Annanda Chowk'] },
    ]
  },
  {
    name: 'Karnataka',
    code: 'IN-KA',
    type: 'STATE',
    cities: [
      { name: 'Bengaluru', type: 'CITY', lat: 12.9716, lng: 77.5946, areas: ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Jayanagar', 'BTM Layout', 'Marathahalli', 'Electronic City', 'JP Nagar', 'Banashankari', 'Rajajinagar', 'Malleshwaram', 'Yeshwanthpur', 'Hebbal', 'Yelahanka', 'Ulsoor', 'MG Road', 'Brigade Road', 'Commercial Street', 'Cunningham Road', 'Sadashivanagar', 'Basavanagudi', 'Vijayanagar', 'Bellandur', 'Sarjapur Road', 'Outer Ring Road', 'Bommanahalli', 'Richmond Town'] },
      { name: 'Mysuru', type: 'CITY', lat: 12.2958, lng: 76.6394, areas: ['Kuvempunagar', 'Gokulam', 'Vijayanagar', 'Saraswathipuram', 'Jayalakshmipuram', 'Hebbal', 'Bogadi'] },
      { name: 'Mangaluru', type: 'CITY', lat: 12.9141, lng: 74.8560, areas: ['Hampankatta', 'Balmatta', 'Bejai', 'Urwa', 'Falnir', 'Bunder'] },
      { name: 'Hubli', type: 'CITY', lat: 15.3647, lng: 75.1240, areas: ['Vidyanagar', 'Keshwapur', 'Durgad Bail', 'Gokul Road'] },
      { name: 'Dharwad', type: 'CITY', lat: 15.4589, lng: 75.0078, areas: ['PB Road', 'Sirur Park', 'Saptapur'] },
      { name: 'Belagavi', type: 'CITY', lat: 15.8497, lng: 74.4977, areas: ['Tilakwadi', 'Shastri Nagar', 'Kakati Road', 'Camp Area'] },
      { name: 'Kalaburagi', type: 'CITY', lat: 17.3297, lng: 76.8200, areas: ['Aland Road', 'Super Market', 'Sedam Road'] },
      { name: 'Tumakuru', type: 'CITY', lat: 13.3392, lng: 77.1014, areas: ['SS Puram', 'Mandipet', 'Nagavara'] },
      { name: 'Udupi', type: 'CITY', lat: 13.3409, lng: 74.7421, areas: ['Manipal', 'KMC Hospital Area', 'Kidiyoor', 'Indrali'] },
    ]
  },
  {
    name: 'Kerala',
    code: 'IN-KL',
    type: 'STATE',
    cities: [
      { name: 'Thiruvananthapuram', type: 'CITY', lat: 8.5241, lng: 76.9366, areas: ['Kowdiar', 'Pattom', 'Vazhuthacaud', 'Kesavadasapuram', 'Medical College', 'Technopark', 'Kazhakuttam', 'Vanchiyoor', 'Palayam', 'Bakery Junction'] },
      { name: 'Kochi', type: 'CITY', lat: 9.9312, lng: 76.2673, areas: ['Ernakulam', 'MG Road', 'Marine Drive', 'Kakkanad', 'Edapally', 'Palarivattom', 'Vyttila', 'Tripunithura', 'Aluva', 'Kalamassery', 'Thrikkakara', 'Fort Kochi', 'Panampilly Nagar'] },
      { name: 'Kozhikode', type: 'CITY', lat: 11.2588, lng: 75.7804, areas: ['SM Street', 'Beach Road', 'Mavoor Road', 'Palayam', 'Nadakkavu', 'Calicut Beach', 'Medical College Road'] },
      { name: 'Thrissur', type: 'CITY', lat: 10.5276, lng: 76.2144, areas: ['Swaraj Round', 'MG Road', 'Poothole', 'Punkunnam', 'Ayyanthole'] },
      { name: 'Kollam', type: 'CITY', lat: 8.8932, lng: 76.6141, areas: ['Chinnakkada', 'Asramam', 'Polayathodu', 'Kadappakkada'] },
      { name: 'Palakkad', type: 'CITY', lat: 10.7867, lng: 76.6548, areas: ['Town', 'Kalpathy', 'Ottapalam'] },
      { name: 'Alappuzha', type: 'CITY', lat: 9.4981, lng: 76.3388, areas: ['Town', 'Punnamada', 'KSRTC Junction'] },
      { name: 'Kannur', type: 'CITY', lat: 11.8745, lng: 75.3704, areas: ['Town', 'Thana', 'Fort Road', 'Payyanur'] },
    ]
  },
  {
    name: 'Madhya Pradesh',
    code: 'IN-MP',
    type: 'STATE',
    cities: [
      { name: 'Bhopal', type: 'CITY', lat: 23.2599, lng: 77.4126, areas: ['MP Nagar', 'Kolar Road', 'Hoshangabad Road', 'Shahpura', 'Arera Colony', 'New Market', 'Habibganj', 'Berasia Road', 'Govindpura', 'Ayodhya Nagar'] },
      { name: 'Indore', type: 'CITY', lat: 22.7196, lng: 75.8577, areas: ['MG Road', 'Vijay Nagar', 'Scheme 54', 'AB Road', 'Palasia', 'Bhawarkuan', 'Rau', 'Dewas Naka', 'Bicholi Mardana', 'Sapna Sangeeta Road', 'Annapurna Road'] },
      { name: 'Jabalpur', type: 'CITY', lat: 23.1815, lng: 79.9864, areas: ['Napier Town', 'Civil Lines', 'Gorakhpur', 'Tilwara Ghat'] },
      { name: 'Gwalior', type: 'CITY', lat: 26.2183, lng: 78.1828, areas: ['Morar', 'Lashkar', 'City Centre', 'Hazira', 'University Road'] },
      { name: 'Ujjain', type: 'CITY', lat: 23.1793, lng: 75.7849, areas: ['Freeganj', 'Nanakheda', 'Kothi Road'] },
      { name: 'Sagar', type: 'CITY', lat: 23.8388, lng: 78.7378, areas: ['Civil Lines', 'Makroniya', 'Tili Road'] },
    ]
  },
  {
    name: 'Maharashtra',
    code: 'IN-MH',
    type: 'STATE',
    cities: [
      { name: 'Mumbai', type: 'CITY', lat: 19.0760, lng: 72.8777, areas: ['Andheri', 'Bandra', 'Juhu', 'Colaba', 'Borivali', 'Powai', 'Malad', 'Goregaon', 'Kandivali', 'Dahisar', 'Thane', 'Ghatkopar', 'Chembur', 'Kurla', 'Sion', 'Dadar', 'Parel', 'Lower Parel', 'Worli', 'Mahalaxmi', 'Navi Mumbai', 'Vashi', 'Belapur', 'Kharghar', 'Panvel', 'Versova', 'Lokhandwala', 'MIDC'] },
      { name: 'Pune', type: 'CITY', lat: 18.5204, lng: 73.8567, areas: ['Koregaon Park', 'Viman Nagar', 'Kothrud', 'Baner', 'Hinjewadi', 'Wakad', 'Aundh', 'Shivajinagar', 'FC Road', 'JM Road', 'Camp', 'Kalyani Nagar', 'Hadapsar', 'Kondhwa', 'NIBM Road', 'Pimple Saudagar', 'Pimple Nilakh', 'Balewadi', 'Pashan'] },
      { name: 'Nagpur', type: 'CITY', lat: 21.1458, lng: 79.0882, areas: ['Dharampeth', 'Sadar', 'Sitabuldi', 'Ramdaspeth', 'Civil Lines', 'Bajaj Nagar', 'Manish Nagar', 'Pratap Nagar'] },
      { name: 'Nashik', type: 'CITY', lat: 19.9975, lng: 73.7898, areas: ['College Road', 'Gangapur Road', 'Panchavati', 'New Nashik', 'Cidco', 'Satpur'] },
      { name: 'Aurangabad', type: 'CITY', lat: 19.8762, lng: 75.3433, areas: ['Cidco', 'TV Centre', 'Garkheda', 'Osmanpura', 'Samarth Nagar'] },
      { name: 'Solapur', type: 'CITY', lat: 17.6599, lng: 75.9064, areas: ['Shivaji Nagar', 'Hotgi Road', 'Vijapur Road'] },
      { name: 'Kolhapur', type: 'CITY', lat: 16.7050, lng: 74.2433, areas: ['Rajaram Road', 'Tarabai Park', 'Rankala'] },
      { name: 'Amravati', type: 'CITY', lat: 20.9320, lng: 77.7523, areas: ['Rajkamal Square', 'Camp Area', 'Morshi Road'] },
    ]
  },
  {
    name: 'Manipur',
    code: 'IN-MN',
    type: 'STATE',
    cities: [
      { name: 'Imphal', type: 'CITY', lat: 24.8170, lng: 93.9368, areas: ['Khwairamband', 'Paona Bazar', 'Thangal Bazar', 'Singjamei', 'Uripok'] },
      { name: 'Thoubal', type: 'CITY', lat: 24.6376, lng: 93.9979, areas: ['Thoubal Town', 'Lilong'] },
    ]
  },
  {
    name: 'Meghalaya',
    code: 'IN-ML',
    type: 'STATE',
    cities: [
      { name: 'Shillong', type: 'CITY', lat: 25.5788, lng: 91.8933, areas: ['Laitumkhrah', 'Police Bazar', 'Mawkhar', 'Nongthymmai', 'Rynjah', 'Malki', 'Lachumiere'] },
      { name: 'Tura', type: 'CITY', lat: 25.5143, lng: 90.2147, areas: ['Tura Town', 'Agalgre'] },
    ]
  },
  {
    name: 'Mizoram',
    code: 'IN-MZ',
    type: 'STATE',
    cities: [
      { name: 'Aizawl', type: 'CITY', lat: 23.7307, lng: 92.7173, areas: ['Zarkawt', 'Chanmari', 'Bawngkawn', 'Luangmual', 'Dawrpui'] },
      { name: 'Lunglei', type: 'CITY', lat: 22.8900, lng: 92.7349, areas: ['Town Centre', 'Lunglei'] },
    ]
  },
  {
    name: 'Nagaland',
    code: 'IN-NL',
    type: 'STATE',
    cities: [
      { name: 'Kohima', type: 'CITY', lat: 25.6701, lng: 94.1077, areas: ['Town', 'Naga Bazar', 'High School Area', 'Meriema'] },
      { name: 'Dimapur', type: 'CITY', lat: 25.9042, lng: 93.7265, areas: ['Darogapathar', 'Duncan Basti', 'Midland', 'Super Market'] },
    ]
  },
  {
    name: 'Odisha',
    code: 'IN-OR',
    type: 'STATE',
    cities: [
      { name: 'Bhubaneswar', type: 'CITY', lat: 20.2961, lng: 85.8245, areas: ['Sahid Nagar', 'Jaydev Vihar', 'Nayapalli', 'Patia', 'Chandrasekharpur', 'Unit 4', 'Bomikhal', 'IRC Village', 'Pokhariput', 'Satya Nagar'] },
      { name: 'Cuttack', type: 'CITY', lat: 20.4625, lng: 85.8830, areas: ['Mangalabag', 'Buxi Bazar', 'College Square', 'Badambadi'] },
      { name: 'Puri', type: 'CITY', lat: 19.8135, lng: 85.8312, areas: ['Grand Road', 'Marine Drive', 'Chakratirtha Road', 'VIP Road'] },
      { name: 'Rourkela', type: 'CITY', lat: 22.2270, lng: 84.8644, areas: ['Sector 1', 'Sector 19', 'Chhend', 'Udit Nagar'] },
      { name: 'Berhampur', type: 'CITY', lat: 19.3150, lng: 84.7941, areas: ['Gandhi Nagar', 'Ambapua', 'Old Town'] },
      { name: 'Sambalpur', type: 'CITY', lat: 21.4669, lng: 83.9756, areas: ['Ainthapali', 'Budharaja', 'College Road'] },
    ]
  },
  {
    name: 'Punjab',
    code: 'IN-PB',
    type: 'STATE',
    cities: [
      { name: 'Ludhiana', type: 'CITY', lat: 30.9010, lng: 75.8573, areas: ['Sarabha Nagar', 'Model Town', 'BRS Nagar', 'Feroze Gandhi Market', 'Shaheed Bhagat Singh Nagar', 'Civil Lines', 'Gurdev Nagar', 'Rajguru Nagar', 'Pakhowal Road'] },
      { name: 'Amritsar', type: 'CITY', lat: 31.6340, lng: 74.8723, areas: ['Ranjit Avenue', 'Lawrence Road', 'Mall Road', 'Putligarh', 'Green Avenue', 'Majitha Road', 'GT Road'] },
      { name: 'Jalandhar', type: 'CITY', lat: 31.3260, lng: 75.5762, areas: ['Model Town', 'Jalandhar Cantt', 'Urban Estate', 'Adarsh Nagar', 'New Jawahar Nagar', 'Kapurthala Road'] },
      { name: 'Patiala', type: 'CITY', lat: 30.3398, lng: 76.3869, areas: ['Leela Bhawan', 'Model Town', 'Tripuri', 'Urban Estate', 'Chhoti Baradari'] },
      { name: 'Bathinda', type: 'CITY', lat: 30.2110, lng: 74.9455, areas: ['Gobindpura', 'Thermal Plant Area', 'GT Road', 'Hira Nagar'] },
      { name: 'Phagwara', type: 'CITY', lat: 31.2247, lng: 75.7734, areas: ['GT Road', 'Patel Nagar', 'Guru Nanak Colony'] },
      { name: 'Mohali', type: 'CITY', lat: 30.7046, lng: 76.7179, areas: ['Phase 7', 'Phase 8B', 'Phase 10', 'Aero City', 'Sector 62', 'Sector 66'] },
    ]
  },
  {
    name: 'Rajasthan',
    code: 'IN-RJ',
    type: 'STATE',
    cities: [
      { name: 'Jaipur', type: 'CITY', lat: 26.9124, lng: 75.7873, areas: ['Malviya Nagar', 'Vaishali Nagar', 'C-Scheme', 'Mansarovar', 'Bapu Nagar', 'Raja Park', 'Shyam Nagar', 'Sanganer', 'Tonk Road', 'Sodala', 'JLN Marg', 'Pratap Nagar', 'Nirman Nagar', 'Jagatpura'] },
      { name: 'Jodhpur', type: 'CITY', lat: 26.2389, lng: 73.0243, areas: ['Shastri Nagar', 'Ratanada', 'Shyam Nagar', 'Paota', 'Basni'] },
      { name: 'Udaipur', type: 'CITY', lat: 24.5854, lng: 73.7125, areas: ['Fatehpura', 'Hiran Magri', 'Chetak Circle', 'Bapu Bazar', 'Shobhagpura', 'Sector 11'] },
      { name: 'Kota', type: 'CITY', lat: 25.2138, lng: 75.8648, areas: ['Talwandi', 'Vigyan Nagar', 'Borkhera', 'Shopping Centre Area'] },
      { name: 'Ajmer', type: 'CITY', lat: 26.4499, lng: 74.6399, areas: ['Vaishali Nagar', 'Civil Lines', 'Nala Bazar', 'Subhash Nagar'] },
      { name: 'Bikaner', type: 'CITY', lat: 28.0229, lng: 73.3119, areas: ['Rani Bazar', 'Ganga Nagar', 'Shastri Nagar'] },
      { name: 'Alwar', type: 'CITY', lat: 27.5530, lng: 76.6346, areas: ['Civil Lines', 'Vikas Nagar', 'Ramgarh Road'] },
      { name: 'Sikar', type: 'CITY', lat: 27.6094, lng: 75.1399, areas: ['Shastri Nagar', 'Jaipuriya Road'] },
    ]
  },
  {
    name: 'Sikkim',
    code: 'IN-SK',
    type: 'STATE',
    cities: [
      { name: 'Gangtok', type: 'CITY', lat: 27.3389, lng: 88.6065, areas: ['MG Marg', 'Deorali', 'Tadong', 'Syari', 'Ranipool'] },
      { name: 'Namchi', type: 'CITY', lat: 27.1673, lng: 88.3640, areas: ['Main Market', 'Hospital Area'] },
    ]
  },
  {
    name: 'Tamil Nadu',
    code: 'IN-TN',
    type: 'STATE',
    cities: [
      { name: 'Chennai', type: 'CITY', lat: 13.0827, lng: 80.2707, areas: ['Anna Nagar', 'T. Nagar', 'Adyar', 'Velachery', 'Porur', 'Vadapalani', 'Nungambakkam', 'Mylapore', 'Kilpauk', 'Egmore', 'Aminjikarai', 'Arumbakkam', 'Ashok Nagar', 'KK Nagar', 'Kodambakkam', 'Mogappair', 'Ayanavaram', 'Perambur', 'Sembakkam', 'Chromepet', 'Pallavaram', 'Thoraipakkam', 'OMR', 'ECR', 'Sholinganallur', 'Perungudi', 'Guindy', 'Mount Road'] },
      { name: 'Coimbatore', type: 'CITY', lat: 11.0168, lng: 76.9558, areas: ['RS Puram', 'Gandhipuram', 'Saibaba Colony', 'Race Course', 'Peelamedu', 'Singanallur', 'Hopes College', 'Goldwins', 'Ondipudur'] },
      { name: 'Madurai', type: 'CITY', lat: 9.9252, lng: 78.1198, areas: ['Anna Nagar', 'KK Nagar', 'Palanganatham', 'Vilangudi', 'Avaniyapuram', 'Tallakulam'] },
      { name: 'Tiruchirappalli', type: 'CITY', lat: 10.7905, lng: 78.7047, areas: ['Anna Nagar', 'KK Nagar', 'Thillai Nagar', 'Srinivasa Nagar', 'Kumaran Nagar'] },
      { name: 'Salem', type: 'CITY', lat: 11.6643, lng: 78.1460, areas: ['Fairlands', 'Gugai', 'New Fairlands', 'Junction', 'Swarnapuri'] },
      { name: 'Vellore', type: 'CITY', lat: 12.9165, lng: 79.1325, areas: ['Gandhi Nagar', 'Katpadi', 'Sankarannagar', 'CMC Hospital Area'] },
      { name: 'Tiruppur', type: 'CITY', lat: 11.1085, lng: 77.3411, areas: ['Selvapuram', 'Palladam Road', 'Avinashi Road', 'Airport Road'] },
      { name: 'Erode', type: 'CITY', lat: 11.3410, lng: 77.7172, areas: ['Perundurai Road', 'Bhavani Road', 'Veerappan Chatram'] },
    ]
  },
  {
    name: 'Telangana',
    code: 'IN-TG',
    type: 'STATE',
    cities: [
      { name: 'Hyderabad', type: 'CITY', lat: 17.3850, lng: 78.4867, areas: ['Banjara Hills', 'Jubilee Hills', 'Madhapur', 'Gachibowli', 'Kondapur', 'Hitech City', 'Kukatpally', 'Secunderabad', 'Begumpet', 'Somajiguda', 'Ameerpet', 'SR Nagar', 'Dilsukhnagar', 'LB Nagar', 'Uppal', 'Malakpet', 'Abids', 'Himayatnagar', 'Nampally', 'Tolichowki', 'Manikonda', 'Attapur', 'Mehdipatnam', 'Film Nagar'] },
      { name: 'Warangal', type: 'CITY', lat: 17.9784, lng: 79.5941, areas: ['Hanamkonda', 'Hunter Road', 'Kasibugga', 'NIT Area'] },
      { name: 'Karimnagar', type: 'CITY', lat: 18.4386, lng: 79.1288, areas: ['Mukarampura', 'Collector Colony', 'Old Town'] },
      { name: 'Nizamabad', type: 'CITY', lat: 18.6725, lng: 78.0941, areas: ['Dichpally Road', 'New Town', 'Aliabad'] },
      { name: 'Khammam', type: 'CITY', lat: 17.2473, lng: 80.1514, areas: ['Old Town', 'Mukundapuram', 'NIMS Road'] },
    ]
  },
  {
    name: 'Tripura',
    code: 'IN-TR',
    type: 'STATE',
    cities: [
      { name: 'Agartala', type: 'CITY', lat: 23.8315, lng: 91.2868, areas: ['Banamalipur', 'Battala', 'Kachjuri Road', 'VIP Road', 'Krishna Nagar'] },
      { name: 'Dharmanagar', type: 'CITY', lat: 24.3792, lng: 92.1658, areas: ['Town', 'New Market'] },
    ]
  },
  {
    name: 'Uttar Pradesh',
    code: 'IN-UP',
    type: 'STATE',
    cities: [
      { name: 'Lucknow', type: 'CITY', lat: 26.8467, lng: 80.9462, areas: ['Gomti Nagar', 'Hazratganj', 'Aliganj', 'Indira Nagar', 'Mahanagar', 'Rajajipuram', 'Alambagh', 'Chowk', 'Aminabad', 'Vibhuti Khand', 'Jankipuram', 'Sushant Golf City', 'Telibagh', 'Faizabad Road'] },
      { name: 'Kanpur', type: 'CITY', lat: 26.4499, lng: 80.3319, areas: ['Swaroop Nagar', 'Kakadeo', 'Civil Lines', 'Kidwai Nagar', 'Govind Nagar', 'Arya Nagar', 'Fazalganj', 'Kalyanpur', 'Shyam Nagar'] },
      { name: 'Agra', type: 'CITY', lat: 27.1767, lng: 78.0081, areas: ['Sanjay Place', 'Tajganj', 'Kamla Nagar', 'DayalBagh', 'Civil Lines', 'Sadar Bazar', 'Fatehabad Road'] },
      { name: 'Ghaziabad', type: 'CITY', lat: 28.6692, lng: 77.4538, areas: ['Indirapuram', 'Vaishali', 'Raj Nagar Extension', 'Vasundhara', 'Kaushambi', 'Crossings Republik', 'Noida Extension'] },
      { name: 'Prayagraj', type: 'CITY', lat: 25.4358, lng: 81.8463, areas: ['Civil Lines', 'Naini', 'Kydganj', 'Saidabad', 'Lowther Road', 'Ashok Nagar', 'Kareli'] },
      { name: 'Varanasi', type: 'CITY', lat: 25.3176, lng: 82.9739, areas: ['Sigra', 'Mahmoorganj', 'Lanka', 'BHU Area', 'Sarnath', 'Godowlia'] },
      { name: 'Meerut', type: 'CITY', lat: 28.9845, lng: 77.7064, areas: ['Pallavpuram', 'Saket', 'Shastri Nagar', 'Abu Lane', 'Gandhi Nagar', 'Partapur'] },
      { name: 'Mathura', type: 'CITY', lat: 27.4924, lng: 77.6737, areas: ['Koyla Ghat Road', 'Vrindavan Road', 'Deeg Gate', 'Masani'] },
      { name: 'Bareilly', type: 'CITY', lat: 28.3670, lng: 79.4304, areas: ['Civil Lines', 'Subhash Nagar', 'Izzatnagar', 'Rajendra Nagar'] },
      { name: 'Aligarh', type: 'CITY', lat: 27.8974, lng: 78.0880, areas: ['AMU Area', 'Civil Lines', 'Ramghat Road'] },
      { name: 'Gorakhpur', type: 'CITY', lat: 26.7606, lng: 83.3732, areas: ['Golghar', 'Civil Lines', 'Sahjanwa Road', 'Rustampur'] },
      { name: 'Noida', type: 'CITY', lat: 28.5355, lng: 77.3910, areas: ['Sector 18', 'Sector 62', 'Sector 15', 'Sector 50', 'Sector 137', 'Sector 76', 'Sector 78'] },
      { name: 'Moradabad', type: 'CITY', lat: 28.8386, lng: 78.7733, areas: ['Civil Lines', 'Kanth Road', 'Delhi Road'] },
    ]
  },
  {
    name: 'Uttarakhand',
    code: 'IN-UT',
    type: 'STATE',
    cities: [
      { name: 'Dehradun', type: 'CITY', lat: 30.3165, lng: 78.0322, areas: ['Rajpur Road', 'Vasant Vihar', 'Dalanwala', 'Clement Town', 'Patel Nagar', 'Raipur', 'GMS Road', 'Balliwala', 'Sahastradhara Road', 'EC Road'] },
      { name: 'Haridwar', type: 'CITY', lat: 29.9457, lng: 78.1642, areas: ['Ranipur', 'Shivalik Nagar', 'Kankhal', 'Jwalapur', 'Piran Kaliyar', 'Shantikunj'] },
      { name: 'Rishikesh', type: 'CITY', lat: 30.0869, lng: 78.2676, areas: ['Tapovan', 'Laxman Jhula', 'Muni Ki Reti', 'Avas Vikas', 'Ram Jhula', 'Badrinath Road'] },
      { name: 'Roorkee', type: 'CITY', lat: 29.8543, lng: 77.8880, areas: ['Civil Lines', 'IIT Roorkee', 'Ganeshpur', 'Engineering College Road'] },
      { name: 'Haldwani', type: 'CITY', lat: 29.2183, lng: 79.5130, areas: ['Mukhani', 'Kusumkhera', 'Bhotia Parao', 'Rampur Road', 'Bankhandi'] },
      { name: 'Nainital', type: 'CITY', lat: 29.3919, lng: 79.4542, areas: ['Mallital', 'Tallital', 'Sukhatal'] },
      { name: 'Mussoorie', type: 'CITY', lat: 30.4598, lng: 78.0669, areas: ['Mall Road', 'Landour', 'Kulri'] },
    ]
  },
  {
    name: 'West Bengal',
    code: 'IN-WB',
    type: 'STATE',
    cities: [
      { name: 'Kolkata', type: 'CITY', lat: 22.5726, lng: 88.3639, areas: ['Salt Lake', 'Dum Dum', 'Howrah', 'Park Street', 'Ballygunge', 'Gariahat', 'Jadavpur', 'Behala', 'New Town', 'Rajarhat', 'Lake Town', 'Kasba', 'Tollygunge', 'Dhakuria', 'Garia', 'Alipore', 'Ultadanga', 'Phoolbagan', 'Shyambazar', 'Noapara'] },
      { name: 'Siliguri', type: 'CITY', lat: 26.7271, lng: 88.3953, areas: ['Pradhan Nagar', 'Hakimpara', 'Sevoke Road', 'Hill Cart Road', 'Matigara'] },
      { name: 'Durgapur', type: 'CITY', lat: 23.5204, lng: 87.3119, areas: ['City Centre', 'Benachity', 'Sector 2B', 'Steel Township'] },
      { name: 'Asansol', type: 'CITY', lat: 23.6739, lng: 86.9524, areas: ['GNB Road', 'Burnpur', 'Chittaranjan', 'GT Road'] },
      { name: 'Haldia', type: 'CITY', lat: 22.0667, lng: 88.0691, areas: ['Township', 'Haldia Dock'] },
      { name: 'Kharagpur', type: 'CITY', lat: 22.3460, lng: 87.2320, areas: ['IIT Area', 'Inda', 'Gole Bazar', 'Malancha'] },
      { name: 'Darjeeling', type: 'CITY', lat: 27.0360, lng: 88.2627, areas: ['Chowrasta', 'Clubside', 'Ghoom', 'Kurseong'] },
      { name: 'Bardhaman', type: 'CITY', lat: 23.2324, lng: 87.8615, areas: ['Bus Stand Area', 'Kartick Pur', 'Natunpara'] },
    ]
  },
];

// ==========================================
// SEED EXECUTION
// ==========================================

async function main() {
  console.log('\n==========================================');
  console.log('BIZRANK GEOGRAPHIC SEED — FULL REBUILD');
  console.log('==========================================\n');

  // Step 1: Clear existing data in correct relational order
  console.log('Step 1: Clearing existing geographic, user and category data...');
  await prisma.business.updateMany({ data: { area_id: null, city_id: null, state_id: null, country_id: null, district_id: null, subdistrict_id: null, job_id: null, category_id: null } });
  await prisma.collectionJob.deleteMany({});
  await prisma.searchLocation.deleteMany({});
  await prisma.area.deleteMany({});
  await prisma.city.deleteMany({});
  await prisma.subDistrict.deleteMany({});
  await prisma.district.deleteMany({});
  await prisma.state.deleteMany({});
  await prisma.country.deleteMany({});
  await prisma.businessCategory.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('  ✅ Cleared.\n');

  // Step 1.5: Seed Users
  console.log('Step 1.5: Seeding Users...');
  const seedUsers = [
    { id: 'dev-usr-simran', username: 'simran@bizrank.com', name: 'Simran Kaur', role: 'DEVELOPER' },
    { id: 'dev-usr-sakshi', username: 'sakshi@bizrank.com', name: 'Sakshi Sharma', role: 'DEVELOPER' },
    { id: 'dev-usr-sumit', username: 'sumit@bizrank.com', name: 'Sumit Chaudhary', role: 'DEVELOPER' },
    { id: 'comm-usr-swati', username: 'swati@bizrank.com', name: 'Swati Chaudhary', role: 'COMMUNICATION' },
  ];
  for (const u of seedUsers) {
    await prisma.user.create({ data: u });
  }
  console.log(`  ✅ Seeded ${seedUsers.length} users.\n`);

  // Step 2: Seed Categories
  console.log('Step 2: Seeding Business Categories...');
  let catCount = 0;
  for (const cat of bizrankCategories) {
    await prisma.businessCategory.create({ data: cat });
    catCount++;
  }
  console.log(`  ✅ Created ${catCount} categories.\n`);

  // Step 3: Create Country: India
  console.log('Step 3: Creating Country: India...');
  const india = await prisma.country.create({
    data: { name: 'India', code: 'IN' }
  });
  console.log(`  ✅ Country: India (ID: ${india.id})\n`);

  // Step 4: Seed States + Cities + Areas + SearchLocations
  console.log('Step 4: Seeding States, Cities, Areas, and SearchLocations...');
  
  let totalStates = 0;
  let totalCities = 0;
  let totalAreas = 0;
  let totalSearchLocations = 0;
  let stateCount = 0;
  let utCount = 0;

  const searchLocationsToInsert: any[] = [];

  for (const stateData of indiaStates) {
    // Create state
    const state = await prisma.state.create({
      data: {
        name: stateData.name,
        code: stateData.code,
        type: stateData.type,
        countryId: india.id,
        source: 'SEED',
        sourceDataset: 'BizRank Geographic Seed v1',
        sourceVersion: '2024',
        sourceUrl: 'https://en.wikipedia.org/wiki/States_and_union_territories_of_India'
      }
    });
    totalStates++;
    if (stateData.type === 'STATE') stateCount++; else utCount++;

    // Add state-level search location
    searchLocationsToInsert.push({
      name: stateData.name,
      displayName: `${stateData.name}, India`,
      type: 'STATE',
      stateId: state.id,
      source: 'SEED',
    });

    // Create cities and areas
    for (const cityData of stateData.cities) {
      const city = await prisma.city.create({
        data: {
          name: cityData.name,
          type: cityData.type || 'CITY',
          stateId: state.id,
          latitude: cityData.lat,
          longitude: cityData.lng,
          source: 'SEED',
          sourceDataset: 'BizRank Geographic Seed v1',
        }
      });
      totalCities++;

      // Add city-level search location
      searchLocationsToInsert.push({
        name: cityData.name,
        displayName: `${cityData.name}, ${stateData.name}`,
        type: 'CITY',
        stateId: state.id,
        cityId: city.id,
        latitude: cityData.lat,
        longitude: cityData.lng,
        source: 'SEED',
      });

      // Create areas
      if (cityData.areas && cityData.areas.length > 0) {
        const areaRecords = await prisma.$transaction(
          cityData.areas.map(areaName =>
            prisma.area.create({
              data: {
                name: areaName,
                cityId: city.id,
                source: 'SEED',
                sourceDataset: 'BizRank Geographic Seed v1',
              }
            })
          )
        );
        totalAreas += areaRecords.length;

        // Add area-level search locations
        for (const area of areaRecords) {
          searchLocationsToInsert.push({
            name: area.name,
            displayName: `${area.name}, ${cityData.name}, ${stateData.name}`,
            type: 'AREA',
            stateId: state.id,
            cityId: city.id,
            areaId: area.id,
            latitude: cityData.lat ? cityData.lat + (Math.random() * 0.05 - 0.025) : null,
            longitude: cityData.lng ? cityData.lng + (Math.random() * 0.05 - 0.025) : null,
            source: 'SEED',
          });
        }
      }
    }

    console.log(`  ✅ [${stateData.type === 'STATE' ? 'STATE' : 'UT   '}] ${stateData.name}: ${stateData.cities.length} cities`);
  }

  // Step 5: Bulk insert SearchLocations
  console.log(`\nStep 5: Inserting ${searchLocationsToInsert.length} SearchLocation records...`);
  const CHUNK = 500;
  for (let i = 0; i < searchLocationsToInsert.length; i += CHUNK) {
    await prisma.searchLocation.createMany({
      data: searchLocationsToInsert.slice(i, i + CHUNK),
      skipDuplicates: true,
    });
  }
  totalSearchLocations = searchLocationsToInsert.length;
  console.log(`  ✅ Inserted ${totalSearchLocations} search locations.\n`);

  // Summary
  console.log('==========================================');
  console.log('SEED COMPLETE — SUMMARY');
  console.log('==========================================');
  console.log(`Countries:         1`);
  console.log(`States:            ${stateCount} (of 28)`);
  console.log(`Union Territories: ${utCount} (of 8)`);
  console.log(`Total States/UTs:  ${totalStates} (of 36)`);
  console.log(`Cities/Towns:      ${totalCities}`);
  console.log(`Areas/Localities:  ${totalAreas}`);
  console.log(`Search Locations:  ${totalSearchLocations}`);
  console.log(`Categories:        ${catCount}`);
  console.log('==========================================\n');
}

main()
  .catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
