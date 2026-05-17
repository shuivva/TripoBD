export const appStats = [
  { label: 'Destinations Listed', value: 128 },
  { label: 'Active Tour Groups', value: 64 },
  { label: 'Verified Guides', value: 42 },
  { label: 'Community Members', value: 9800 },
]

export const valueCards = [
  {
    title: 'All-in-One Planning',
    description: 'Build itineraries, budgets and group plans in one place.',
  },
  {
    title: 'Group Coordination',
    description: 'Invite travelers, split tasks and stay synced with your crew.',
  },
  {
    title: 'Local Expertise',
    description: 'Trusted local guides and insider tips for every destination.',
  },
  {
    title: 'Budget-Friendly',
    description: 'Compare options and keep your trip affordable without sacrifice.',
  },
]

export const landingStories = [
  {
    id: 'story-1',
    title: 'Sundarbans Adventure With Friends',
    summary: 'A sunrise boat safari with expert guides and a community camping plan.',
    image: 'https://images.unsplash.com/photo-1516542076529-1ea3854896f4?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'story-2',
    title: 'Beach Escape at Cox’s Bazar',
    summary: 'A weekend group book that covered food, ferry, and a guided beach walk.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'story-3',
    title: 'Tea Trails in Sreemangal',
    summary: 'A family trip with local homestays and a curated tea garden itinerary.',
    image: 'https://images.unsplash.com/photo-1541364983171-a8ba01b7cb11?auto=format&fit=crop&w=1200&q=80',
  },
]

export const featuredDestinations = [
  {
    slug: 'sundarbans',
    name: 'Sundarbans',
    region: 'Khulna',
    category: 'Forest',
    budget: 'Medium',
    rating: 4.9,
    duration: '3-5 days',
    season: 'Winter',
    hero: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    summary: 'Explore the world’s largest mangrove forest with boat safaris and wildlife spotting.',
    coords: [22.0, 89.0],
  },
  {
    slug: 'coxs-bazar',
    name: 'Cox’s Bazar',
    region: 'Chittagong',
    category: 'Beach',
    budget: 'Medium',
    rating: 4.8,
    duration: '3-5 days',
    season: 'Winter',
    hero: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    summary: 'Walk the world’s longest beach and enjoy fresh seafood and sunset views.',
    coords: [21.4272, 92.0058],
  },
  {
    slug: 'sajek',
    name: 'Sajek Valley',
    region: 'Chittagong',
    category: 'Hill',
    budget: 'Medium',
    rating: 4.7,
    duration: '3-5 days',
    season: 'Autumn',
    hero: 'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?auto=format&fit=crop&w=1200&q=80',
    summary: 'Stay above the clouds in the scenic hill tracts of northern Bangladesh.',
    coords: [23.15, 92.2333],
  },
  {
    slug: 'bandarban',
    name: 'Bandarban',
    region: 'Chittagong',
    category: 'Hill',
    budget: 'High',
    rating: 4.8,
    duration: '4-6 days',
    season: 'Winter',
    hero: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1200&q=80',
    summary: 'Trek to waterfalls, tribal villages, and misty mountaintops.',
    coords: [21.8243, 92.2185],
  },
  {
    slug: 'sreemangal',
    name: 'Sreemangal',
    region: 'Sylhet',
    category: 'Forest',
    budget: 'Low',
    rating: 4.7,
    duration: '2-4 days',
    season: 'Monsoon',
    hero: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80',
    summary: 'Tea gardens, walking trails and local cuisine in Bangladesh’s tea capital.',
    coords: [24.3066, 91.7296],
  },
]

export const destinations = [
  ...featuredDestinations,
  {
    slug: 'dhaka',
    name: 'Dhaka City Tour',
    region: 'Dhaka',
    category: 'City',
    budget: 'Low',
    rating: 4.3,
    duration: '1-2 days',
    season: 'Winter',
    hero: 'https://images.unsplash.com/photo-1530731141654-5993c3016c77?auto=format&fit=crop&w=1200&q=80',
    summary: 'Historic sites, street food and riverfront culture in the capital.',
    coords: [23.8103, 90.4125],
  },
  {
    slug: 'kuakata',
    name: 'Kuakata',
    region: 'Barisal',
    category: 'Beach',
    budget: 'Low',
    rating: 4.5,
    duration: '2-3 days',
    season: 'Winter',
    hero: 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=1200&q=80',
    summary: 'Sunrise and sunset views from the unique south-facing beach.',
    coords: [21.8095, 90.1198],
  },
  {
    slug: 'paharpur',
    name: 'Paharpur Heritage',
    region: 'Rajshahi',
    category: 'Heritage',
    budget: 'Low',
    rating: 4.6,
    duration: '1-2 days',
    season: 'Winter',
    hero: 'https://images.unsplash.com/photo-1549880180-22defd715765?auto=format&fit=crop&w=1200&q=80',
    summary: 'Ancient Buddhist monastery ruins in a lush archaeological park.',
    coords: [24.3656, 88.1301],
  },
  {
    slug: 'tangail-haor',
    name: 'Haor Escape',
    region: 'Mymensingh',
    category: 'Haor',
    budget: 'Low',
    rating: 4.4,
    duration: '2-3 days',
    season: 'Monsoon',
    hero: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80',
    summary: 'Boat rides through Bangladesh’s wetland lakes, lush in the monsoon season.',
    coords: [24.5, 90.0],
  },
]

export const categoryQuickLinks = [
  { label: 'Beach', value: 'Beach' },
  { label: 'Hill Tracts', value: 'Hill' },
  { label: 'Mangrove', value: 'Forest' },
  { label: 'Haor', value: 'Haor' },
  { label: 'Heritage Sites', value: 'Heritage' },
  { label: 'City Tour', value: 'City' },
]

export const regionOptions = ['Dhaka', 'Chittagong', 'Sylhet', 'Khulna', 'Rajshahi', 'Barisal', 'Rangpur', 'Mymensingh']
export const seasonOptions = ['Winter', 'Summer', 'Monsoon', 'Autumn']
export const durationOptions = ['1-2 days', '3-5 days', '6-8 days', '9+ days']

export const guideProfiles = [
  {
    id: 'guide-1',
    name: 'Rafiq Hasan',
    location: 'Sundarbans',
    rating: 4.9,
    bio: 'Experienced wildlife guide with 8 years of river safari expertise.',
  },
  {
    id: 'guide-2',
    name: 'Nazma Begum',
    location: 'Cox’s Bazar',
    rating: 4.8,
    bio: 'Beach guide and community host for coastal culture tours.',
  },
  {
    id: 'guide-3',
    name: 'Joyedal Ahmed',
    location: 'Sajek',
    rating: 4.7,
    bio: 'Hill tracts specialist focusing on trekking and village experiences.',
  },
]

export const transportRoutes = [
  {
    id: 'dhaka-cox',
    from: 'Dhaka',
    to: 'Cox’s Bazar',
    mode: 'Bus',
    operator: 'Shyamoli Paribahan',
    fare: 1200,
    duration: '10h',
    departure: '22:00',
    travelClass: 'Volvo AC',
    path: [
      [23.8103, 90.4125],
      [21.4272, 92.0058],
    ],
    tips: 'Book an overnight bus and carry a light jacket for AC comfort.',
  },
  {
    id: 'dhaka-sundarbans',
    from: 'Dhaka',
    to: 'Sundarbans',
    mode: 'Mixed',
    operator: 'Sundarban Tour Express',
    fare: 1800,
    duration: '12h',
    departure: '08:30',
    travelClass: 'Bus + Boat',
    path: [
      [23.8103, 90.4125],
      [22.0000, 89.0000],
    ],
    tips: 'Take the morning bus and stay hydrated before the boat transfer.',
  },
  {
    id: 'dhaka-sajek',
    from: 'Dhaka',
    to: 'Sajek Valley',
    mode: 'Bus',
    operator: 'Hanif Enterprise',
    fare: 1400,
    duration: '9h',
    departure: '21:00',
    travelClass: 'AC Sleeper',
    path: [
      [23.8103, 90.4125],
      [23.1500, 92.2333],
    ],
    tips: 'Night travel saves daylight for the valley; carry snacks for the last stretch.',
  },
]

export const destinationDetails = {
  'sundarbans': {
    name: 'Sundarbans',
    description: 'A UNESCO World Heritage site, the Sundarbans is the world’s largest mangrove forest offering boat safaris, tiger tracking and river-side eco camps.',
    highlights: ['Boat safari at sunrise', 'Wildlife spotting', 'Local village homestays', 'Mangrove boardwalks'],
    bestTime: 'October to March',
    pack: ['Light rain jacket', 'Insect repellent', 'Binoculars', 'Waterproof bag'],
    tips: ['Start early to catch wildlife activity', 'Keep a copy of your permit', 'Bring cash for local vendors'],
    attractions: ['Sajnekhali Watchtower', 'Dobanki Jungle Camp', 'Katka Village', 'Hiron Point'],
    food: ['Hilsa curry', 'Fresh river prawns', 'Bhorta platter'],
    eateries: ['Mangrove Café', 'Sundarban Riverside Dine', 'Forest Gate Eatery'],
    accommodations: [
      { name: 'Eco River Lodge', price: '₹4500/night', summary: 'Comfortable riverfront rooms with guided tours.' },
      { name: 'Mangrove Campsite', price: '₹3200/night', summary: 'Tented eco-camp with bonfire evenings.' },
      { name: 'Forest View Homestay', price: '₹2800/night', summary: 'Dozen local meals and guided village walks.' },
    ],
    reviews: [
      { author: 'Ayesha', score: 5, note: 'Amazing wildlife and the guides were so patient.' },
      { author: 'Tanvir', score: 4, note: 'Beautiful scenery and peaceful river travel.' },
    ],
    groups: [
      { name: 'Weekend Sundarbans Crew', members: 12, departure: 'Next Friday' },
      { name: 'Mangrove Explorers', members: 8, departure: 'In 7 days' },
    ],
  },
  'coxs-bazar': {
    name: 'Cox’s Bazar',
    description: 'The world-famous sandy beach gives travelers endless shoreline, seafood markets and sunset strolls along the longest natural beach.',
    highlights: ['Sea beach sunset', 'Inani coral stones', 'Laboni beach food stalls', 'Parasailing options'],
    bestTime: 'November to April',
    pack: ['Sunscreen', 'Beachwear', 'Snorkeling gear', 'Light snacks'],
    tips: ['Reserve beachfront rooms early', 'Avoid low tide for water sports', 'Try local coconut shakes'],
    attractions: ['Himchari Waterfall', 'Inani Beach', 'Marine Drive', 'Ramu Buddhist Temple'],
    food: ['Seafood barbeque', 'Fried hilsa', 'Coconut curry'],
    eateries: ['Bay View Restaurant', 'Sea Breeze Café', 'Beach Shack Kitchen'],
    accommodations: [
      { name: 'Sunset Beach Resort', price: '₹5200/night', summary: 'Seafront rooms with private balconies.' },
      { name: 'Budget Surf Hostel', price: '₹2300/night', summary: 'Friendly dorms and surf-ready vibe.' },
      { name: 'Lagoon Retreat', price: '₹3800/night', summary: 'Quiet property with pool and breakfast.' },
    ],
    reviews: [
      { author: 'Farah', score: 5, note: 'Perfect beach days and excellent local guide recommendations.' },
      { author: 'Hasan', score: 4, note: 'Crowded but the sunsets were unforgettable.' },
    ],
    groups: [
      { name: 'Beach Group 2026', members: 18, departure: 'Next month' },
      { name: 'Cox’s Bazar Photographers', members: 5, departure: 'In 3 days' },
    ],
  },
}
