// ==========================================
// BIZRANK CATEGORY NORMALIZER
// Maps provider category strings to BizRank categories
// ==========================================

interface BizRankCategoryMapping {
  bizRankName: string;
  keywords: string[];
}

const CATEGORY_MAPPINGS: BizRankCategoryMapping[] = [
  { bizRankName: 'Salon', keywords: ['beauty_salon', 'hair_salon', 'salon', 'beauty salon', 'hair salon', 'ladies salon', 'unisex salon'] },
  { bizRankName: 'Beauty Parlour', keywords: ['beauty parlour', 'parlour', 'beauty parlor'] },
  { bizRankName: 'Barbershop', keywords: ['barber', 'barbershop', 'barber_shop', 'mens salon', 'gents salon'] },
  { bizRankName: 'Spa', keywords: ['spa', 'wellness', 'massage', 'day spa', 'thai spa', 'body spa'] },
  { bizRankName: 'Gym', keywords: ['gym', 'fitness center', 'health club', 'fitness studio', 'crossfit', 'bodybuilding'] },
  { bizRankName: 'Yoga Studio', keywords: ['yoga', 'yoga studio', 'yoga center', 'yoga class'] },
  { bizRankName: 'Dance Studio', keywords: ['dance school', 'dance studio', 'dance academy', 'dance class', 'dance institute'] },
  { bizRankName: 'Restaurant', keywords: ['restaurant', 'diner', 'dhaba', 'eatery', 'food joint', 'biryani', 'punjabi restaurant', 'south indian restaurant', 'chinese restaurant'] },
  { bizRankName: 'Cafe', keywords: ['cafe', 'coffee shop', 'coffee house', 'coffee bar', 'bistro'] },
  { bizRankName: 'Bakery', keywords: ['bakery', 'pastry', 'confectionery', 'patisserie', 'cake shop', 'baked goods'] },
  { bizRankName: 'Dessert Shop', keywords: ['dessert', 'ice cream', 'sweet shop', 'mithai', 'sweets', 'candy'] },
  { bizRankName: 'Fast Food', keywords: ['fast food', 'burger', 'pizza', 'sandwich', 'quick service'] },
  { bizRankName: 'Cloud Kitchen', keywords: ['cloud kitchen', 'ghost kitchen', 'dark kitchen', 'delivery kitchen', 'food delivery'] },
  { bizRankName: 'Catering Service', keywords: ['catering', 'caterer', 'event catering', 'wedding catering', 'tiffin service'] },
  { bizRankName: 'Banquet Hall', keywords: ['banquet', 'banquet hall', 'event venue', 'party hall', 'convention center', 'marriage hall', 'function hall'] },
  { bizRankName: 'Hotel', keywords: ['hotel', 'lodging', 'lodge', 'inn', 'motel', 'suites', 'hotel_lodging'] },
  { bizRankName: 'Resort', keywords: ['resort', 'retreat', 'holiday resort', 'eco resort'] },
  { bizRankName: 'Guest House', keywords: ['guest house', 'guesthouse', 'bed and breakfast', 'bnb', 'b&b', 'paying guest', 'pg'] },
  { bizRankName: 'Hostel', keywords: ['hostel', 'backpacker', 'dormitory', 'youth hostel'] },
  { bizRankName: 'Boutique Hotel', keywords: ['boutique hotel', 'heritage hotel', 'luxury boutique'] },
  { bizRankName: 'Homestay', keywords: ['homestay', 'home stay', 'villa', 'vacation rental', 'holiday home', 'airbnb'] },
  { bizRankName: 'Travel Agency', keywords: ['travel agency', 'travel agent', 'tours and travels', 'travel company', 'holiday packages'] },
  { bizRankName: 'Tour Operator', keywords: ['tour operator', 'tour guide', 'travel packages', 'holiday company', 'sightseeing'] },
  { bizRankName: 'Dental Clinic', keywords: ['dentist', 'dental', 'orthodontist', 'dental clinic', 'oral care', 'dental hospital'] },
  { bizRankName: 'Dermatology Clinic', keywords: ['dermatologist', 'skin clinic', 'dermatology', 'skin care clinic', 'cosmetology', 'aesthetics'] },
  { bizRankName: 'Physiotherapy Clinic', keywords: ['physiotherapy', 'physiotherapist', 'physical therapy', 'rehab', 'rehabilitation'] },
  { bizRankName: 'Eye Clinic', keywords: ['optometrist', 'ophthalmologist', 'eye clinic', 'eye hospital', 'optical store', 'optician', 'vision center'] },
  { bizRankName: 'Diagnostic Center', keywords: ['diagnostic', 'pathology', 'lab', 'blood test', 'clinical lab', 'medical lab', 'imaging'] },
  { bizRankName: 'Veterinary Clinic', keywords: ['veterinarian', 'vet', 'animal hospital', 'pet clinic', 'veterinary', 'dog clinic', 'pet doctor'] },
  { bizRankName: 'Coaching Institute', keywords: ['coaching', 'tuition', 'coaching center', 'coaching institute', 'tutoring', 'classes'] },
  { bizRankName: 'Training Institute', keywords: ['training center', 'skill training', 'training institute', 'academy', 'vocational'] },
  { bizRankName: 'Computer Institute', keywords: ['computer training', 'it training', 'programming', 'software training', 'computer center'] },
  { bizRankName: 'Language Institute', keywords: ['language school', 'english classes', 'spoken english', 'language institute', 'ielts', 'toefl'] },
  { bizRankName: 'Music School', keywords: ['music school', 'music teacher', 'music academy', 'music institute', 'guitar', 'piano classes'] },
  { bizRankName: 'Real Estate Agency', keywords: ['real estate', 'property dealer', 'real estate agent', 'realty', 'property consultant', 'housing', 'realtor'] },
  { bizRankName: 'Interior Designer', keywords: ['interior designer', 'interior decorator', 'interior design', 'home decor design', 'space designer'] },
  { bizRankName: 'Architect', keywords: ['architect', 'architectural firm', 'building designer', 'building architect'] },
  { bizRankName: 'Construction Company', keywords: ['construction', 'builder', 'contractor', 'civil contractor', 'building contractor'] },
  { bizRankName: 'Photographer', keywords: ['photographer', 'photography studio', 'photo studio', 'studio photography'] },
  { bizRankName: 'Wedding Photographer', keywords: ['wedding photographer', 'wedding photography', 'bridal photographer', 'candid photographer'] },
  { bizRankName: 'Videographer', keywords: ['videographer', 'video production', 'film production', 'cinematographer'] },
  { bizRankName: 'Event Planner', keywords: ['event planner', 'event organizer', 'event management', 'event coordinator', 'corporate events'] },
  { bizRankName: 'Wedding Planner', keywords: ['wedding planner', 'wedding management', 'wedding coordinator', 'bridal planner'] },
  { bizRankName: 'Car Rental', keywords: ['car rental', 'taxi', 'cab', 'car hire', 'cab service', 'bike rental', 'tempo traveller'] },
  { bizRankName: 'Car Detailing', keywords: ['car detailing', 'car wash', 'auto detailing', 'vehicle wash'] },
  { bizRankName: 'Auto Service', keywords: ['auto repair', 'car repair', 'mechanic', 'automobile workshop', 'service center', 'auto garage'] },
  { bizRankName: 'Pet Grooming', keywords: ['pet grooming', 'dog grooming', 'pet salon', 'pet spa', 'dog groomer'] },
  { bizRankName: 'Pet Boarding', keywords: ['pet boarding', 'dog boarding', 'pet daycare', 'kennel', 'dog daycare'] },
  { bizRankName: 'Jewellery Store', keywords: ['jewelry', 'jewellery', 'jeweler', 'jeweller', 'gold shop', 'diamond store'] },
  { bizRankName: 'Fashion Store', keywords: ['clothing store', 'fashion store', 'apparel', 'garments', 'textile', 'readymade'] },
  { bizRankName: 'Boutique', keywords: ['boutique', 'designer boutique', 'fashion boutique', 'ladies boutique'] },
  { bizRankName: 'Furniture Store', keywords: ['furniture', 'home furniture', 'wooden furniture', 'modular furniture'] },
  { bizRankName: 'Home Decor', keywords: ['home decor', 'lifestyle store', 'interior store', 'furnishing', 'home accessories'] },
  { bizRankName: 'Laundry', keywords: ['laundry', 'dry cleaner', 'laundromat', 'laundry service', 'dry cleaning', 'dhobighat'] },
  { bizRankName: 'Tailor', keywords: ['tailor', 'alteration', 'stitching', 'darzi', 'clothing alteration'] },
  { bizRankName: 'ATM', keywords: ['atm', 'cash machine', 'cash point'] },
  { bizRankName: 'Petrol Pump', keywords: ['gas station', 'petrol pump', 'fuel station', 'petrol station', 'cng station', 'diesel'] },
  { bizRankName: 'Government Office', keywords: ['government office', 'government building', 'municipal office', 'tehsil', 'collectorate', 'taluka'] },
  { bizRankName: 'Police Station', keywords: ['police station', 'police', 'thana', 'police chowki'] },
  { bizRankName: 'Post Office', keywords: ['post office', 'postal service', 'india post'] },
  { bizRankName: 'Public Park', keywords: ['park', 'garden', 'public garden', 'playground', 'botanical garden'] },
];

function normalizeStr(str: string): string {
  return str.toLowerCase().replace(/[_\-]/g, ' ').trim();
}

/**
 * Maps a raw provider category name to the closest BizRank category.
 * Returns null if no match found.
 */
export function normalizeCategoryName(providerCategory: string): string | null {
  if (!providerCategory) return null;
  const normalized = normalizeStr(providerCategory);
  
  // First try exact or close match
  for (const mapping of CATEGORY_MAPPINGS) {
    for (const keyword of mapping.keywords) {
      if (normalized === normalizeStr(keyword)) {
        return mapping.bizRankName;
      }
    }
  }
  
  // Then try substring match
  for (const mapping of CATEGORY_MAPPINGS) {
    for (const keyword of mapping.keywords) {
      const kw = normalizeStr(keyword);
      if (normalized.includes(kw) || kw.includes(normalized)) {
        return mapping.bizRankName;
      }
    }
  }
  
  return null;
}
