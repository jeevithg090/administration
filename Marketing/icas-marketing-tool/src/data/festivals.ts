export interface Festival {
  id: string;
  name: string;
  description: string;
  date: string;
  category: 'religious' | 'cultural' | 'national' | 'seasonal';
  colors: string[];
  keywords: string[];
}

export const indianFestivals: Festival[] = [
  {
    id: 'diwali',
    name: 'Diwali',
    description: 'Festival of Lights celebrating the victory of light over darkness',
    date: 'October/November',
    category: 'religious',
    colors: ['#FFD700', '#FF6B35', '#8B4513', '#FF1493'],
    keywords: ['lights', 'diyas', 'rangoli', 'fireworks', 'prosperity', 'celebration']
  },
  {
    id: 'holi',
    name: 'Holi',
    description: 'Festival of Colors celebrating spring and love',
    date: 'March',
    category: 'religious',
    colors: ['#FF69B4', '#00FF00', '#FFFF00', '#FF0000', '#00BFFF'],
    keywords: ['colors', 'gulal', 'spring', 'joy', 'unity', 'celebration']
  },
  {
    id: 'dussehra',
    name: 'Dussehra',
    description: 'Victory of good over evil, celebrating Lord Rama\'s triumph',
    date: 'September/October',
    category: 'religious',
    colors: ['#FF6B35', '#FFD700', '#8B0000', '#228B22'],
    keywords: ['victory', 'good over evil', 'Ravana', 'triumph', 'righteousness']
  },
  {
    id: 'navratri',
    name: 'Navratri',
    description: 'Nine nights celebrating the divine feminine',
    date: 'September/October',
    category: 'religious',
    colors: ['#FF1493', '#FFD700', '#32CD32', '#FF4500', '#8A2BE2'],
    keywords: ['dance', 'garba', 'dandiya', 'goddess', 'devotion', 'celebration']
  },
  {
    id: 'eid',
    name: 'Eid al-Fitr',
    description: 'Festival of Breaking the Fast after Ramadan',
    date: 'Variable (Lunar Calendar)',
    category: 'religious',
    colors: ['#00FF7F', '#FFD700', '#FFFFFF', '#4169E1'],
    keywords: ['feast', 'charity', 'community', 'prayer', 'celebration', 'family']
  },
  {
    id: 'christmas',
    name: 'Christmas',
    description: 'Celebration of the birth of Jesus Christ',
    date: 'December 25',
    category: 'religious',
    colors: ['#DC143C', '#228B22', '#FFD700', '#FFFFFF'],
    keywords: ['birth', 'Jesus', 'star', 'gifts', 'family', 'peace']
  },
  {
    id: 'ganesh-chaturthi',
    name: 'Ganesh Chaturthi',
    description: 'Festival celebrating Lord Ganesha',
    date: 'August/September',
    category: 'religious',
    colors: ['#FF6B35', '#FFD700', '#8B4513', '#FF1493'],
    keywords: ['Ganesha', 'elephant', 'wisdom', 'prosperity', 'devotion', 'celebration']
  },
  {
    id: 'karva-chauth',
    name: 'Karva Chauth',
    description: 'Festival where married women fast for their husbands',
    date: 'October/November',
    category: 'cultural',
    colors: ['#FF1493', '#FFD700', '#8B0000', '#FF6B35'],
    keywords: ['marriage', 'love', 'moon', 'fast', 'devotion', 'tradition']
  },
  {
    id: 'onam',
    name: 'Onam',
    description: 'Harvest festival of Kerala',
    date: 'August/September',
    category: 'cultural',
    colors: ['#FFD700', '#228B22', '#FF6B35', '#8B4513'],
    keywords: ['harvest', 'Kerala', 'prosperity', 'King Mahabali', 'flowers', 'feast']
  },
  {
    id: 'pongal',
    name: 'Pongal',
    description: 'Tamil harvest festival',
    date: 'January',
    category: 'cultural',
    colors: ['#FFD700', '#228B22', '#FF6B35', '#8B4513'],
    keywords: ['harvest', 'Tamil', 'prosperity', 'rice', 'cattle', 'gratitude']
  },
  {
    id: 'baisakhi',
    name: 'Baisakhi',
    description: 'Sikh New Year and harvest festival',
    date: 'April 13/14',
    category: 'religious',
    colors: ['#FFD700', '#FF6B35', '#228B22', '#4169E1'],
    keywords: ['Sikh', 'harvest', 'new year', 'prosperity', 'community', 'celebration']
  },
  {
    id: 'independence-day',
    name: 'Independence Day',
    description: 'Celebrating India\'s independence from British rule',
    date: 'August 15',
    category: 'national',
    colors: ['#FF9933', '#FFFFFF', '#138808'],
    keywords: ['independence', 'freedom', 'patriotism', 'flag', 'nation', 'pride']
  },
  {
    id: 'republic-day',
    name: 'Republic Day',
    description: 'Celebrating the adoption of the Indian Constitution',
    date: 'January 26',
    category: 'national',
    colors: ['#FF9933', '#FFFFFF', '#138808'],
    keywords: ['republic', 'constitution', 'democracy', 'parade', 'patriotism', 'unity']
  },
  {
    id: 'gandhi-jayanti',
    name: 'Gandhi Jayanti',
    description: 'Birthday of Mahatma Gandhi',
    date: 'October 2',
    category: 'national',
    colors: ['#FFFFFF', '#138808', '#000000'],
    keywords: ['Gandhi', 'peace', 'non-violence', 'truth', 'freedom', 'respect']
  },
  {
    id: 'durga-puja',
    name: 'Durga Puja',
    description: 'Worship of Goddess Durga',
    date: 'September/October',
    category: 'religious',
    colors: ['#FF1493', '#FFD700', '#8B0000', '#FF6B35'],
    keywords: ['Durga', 'goddess', 'power', 'victory', 'devotion', 'community']
  },
  {
    id: 'raksha-bandhan',
    name: 'Raksha Bandhan',
    description: 'Festival celebrating the bond between brothers and sisters',
    date: 'August',
    category: 'cultural',
    colors: ['#FF1493', '#FFD700', '#FF6B35', '#8B4513'],
    keywords: ['siblings', 'rakhi', 'protection', 'love', 'family', 'bond']
  },
  {
    id: 'janmashtami',
    name: 'Janmashtami',
    description: 'Birthday of Lord Krishna',
    date: 'August/September',
    category: 'religious',
    colors: ['#4169E1', '#FFD700', '#FFFFFF', '#FF6B35'],
    keywords: ['Krishna', 'birth', 'divine', 'love', 'devotion', 'celebration']
  },
  {
    id: 'makar-sankranti',
    name: 'Makar Sankranti',
    description: 'Kite flying festival marking the sun\'s northward journey',
    date: 'January 14',
    category: 'seasonal',
    colors: ['#FFD700', '#FF6B35', '#00BFFF', '#228B22'],
    keywords: ['kites', 'sun', 'harvest', 'transition', 'celebration', 'joy']
  },
  {
    id: 'maha-shivratri',
    name: 'Maha Shivratri',
    description: 'Great night of Lord Shiva',
    date: 'February/March',
    category: 'religious',
    colors: ['#8B4513', '#FFFFFF', '#4169E1', '#FFD700'],
    keywords: ['Shiva', 'meditation', 'devotion', 'spiritual', 'night', 'worship']
  },
  {
    id: 'ram-navami',
    name: 'Ram Navami',
    description: 'Birthday of Lord Rama',
    date: 'March/April',
    category: 'religious',
    colors: ['#FFD700', '#FF6B35', '#228B22', '#8B0000'],
    keywords: ['Rama', 'birth', 'righteousness', 'devotion', 'virtue', 'celebration']
  }
];

export const postTypes = [
  { id: 'event', name: 'Event Post', description: 'Celebrate festivals and special occasions' },
  { id: 'advertisement', name: 'Advertisement', description: 'Promote university programs and offerings' },
  { id: 'announcement', name: 'Announcement', description: 'Share important university news and updates' }
];

export const aspectRatios = [
  { id: '1:1', name: 'Square (1:1)', description: 'Instagram posts, Facebook posts', width: 1080, height: 1080 },
  { id: '16:9', name: 'Landscape (16:9)', description: 'YouTube thumbnails, Facebook covers', width: 1920, height: 1080 },
  { id: '9:16', name: 'Stories (9:16)', description: 'Instagram Stories, Facebook Stories', width: 1080, height: 1920 },
  { id: '4:5', name: 'Portrait (4:5)', description: 'Instagram posts', width: 1080, height: 1350 },
  { id: '2:1', name: 'Banner (2:1)', description: 'Twitter headers, LinkedIn banners', width: 1500, height: 750 }
];