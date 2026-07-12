// Shared mock data for the Waseet portal pages, drawn from the source designs.

export const projects = [
  {
    id: 'palm-residence',
    name: 'Palm Residence',
    developer: 'Al Faisal Development',
    location: 'Al Rawdhah, Jeddah',
    city: 'Jeddah',
    status: 'Live',
    added: 'Added June 1, 2026',
    featured: true,
    units: [
      { type: 'Studio', commission: '3%' },
      { type: '1BR', commission: '3%' },
      { type: '2BR', commission: '3%' },
      { type: '3BR', commission: '2.5%' },
    ],
    priceFrom: 'SAR 480k',
    leads: 34,
    deals: 3,
  },
  {
    id: 'al-noor-tower',
    name: 'Al Noor Tower',
    developer: 'Al Faisal Development',
    location: 'Al Hamra, Riyadh',
    city: 'Riyadh',
    status: 'Live',
    added: 'Added May 18, 2026',
    featured: false,
    units: [
      { type: '1BR', commission: '3%' },
      { type: '2BR', commission: '3%' },
    ],
    priceFrom: 'SAR 620k',
    leads: 80,
    deals: 3,
  },
  {
    id: 'marina-heights',
    name: 'Marina Heights',
    developer: 'Al Faisal Development',
    location: 'Dubai Marina, UAE',
    city: 'Dubai',
    status: 'Under Review',
    added: 'Added June 26, 2026',
    featured: false,
    units: [
      { type: 'Office Suite', commission: '2.5%' },
    ],
    priceFrom: 'SAR 1.2M',
    leads: 0,
    deals: 0,
  },
  {
    id: 'jade-gardens',
    name: 'Jade Gardens',
    developer: 'Rakeen Estates',
    location: 'Al Malqa, Riyadh',
    city: 'Riyadh',
    status: 'Live',
    added: 'Added Apr 2, 2026',
    featured: false,
    units: [
      { type: '2BR', commission: '3.5%' },
      { type: '3BR', commission: '3%' },
      { type: 'Villa', commission: '2.5%' },
    ],
    priceFrom: 'SAR 890k',
    leads: 52,
    deals: 5,
  },
  {
    id: 'coral-bay',
    name: 'Coral Bay Residences',
    developer: 'Emaar KSA',
    location: 'Corniche, Jeddah',
    city: 'Jeddah',
    status: 'Live',
    added: 'Added Mar 15, 2026',
    featured: true,
    units: [
      { type: '1BR', commission: '4%' },
      { type: '2BR', commission: '3.5%' },
    ],
    priceFrom: 'SAR 720k',
    leads: 96,
    deals: 8,
  },
  {
    id: 'the-vantage',
    name: 'The Vantage',
    developer: 'Rakeen Estates',
    location: 'KAFD, Riyadh',
    city: 'Riyadh',
    status: 'Live',
    added: 'Added Feb 8, 2026',
    featured: false,
    units: [
      { type: 'Studio', commission: '3%' },
      { type: '1BR', commission: '3%' },
      { type: 'Penthouse', commission: '2%' },
    ],
    priceFrom: 'SAR 540k',
    leads: 41,
    deals: 2,
  },
]

export const cities = ['All cities', 'Riyadh', 'Jeddah', 'Dubai', 'Dammam', 'Mecca']
export const unitTypes = ['All types', 'Studio', '1BR', '2BR', '3BR', 'Villa', 'Penthouse', 'Office Suite']
export const sortOptions = ['Newest first', 'Oldest first', 'Highest commission', 'Most leads']

export const leads = [
  { id: 'L-2041', name: 'Fatima Al-Zahrani', project: 'Palm Residence', unit: '2BR', stage: 'New', date: 'Jul 2, 2026', value: 'SAR 720k', phone: '+966 55 123 4567' },
  { id: 'L-2038', name: 'Omar Bin Saleh', project: 'Coral Bay Residences', unit: '1BR', stage: 'Contacted', date: 'Jul 1, 2026', value: 'SAR 720k', phone: '+966 50 998 2211' },
  { id: 'L-2033', name: 'Layla Hassan', project: 'Jade Gardens', unit: 'Villa', stage: 'Viewing', date: 'Jun 28, 2026', value: 'SAR 2.1M', phone: '+966 53 445 8890' },
  { id: 'L-2027', name: 'Yousef Al-Amri', project: 'Al Noor Tower', unit: '2BR', stage: 'Negotiation', date: 'Jun 24, 2026', value: 'SAR 980k', phone: '+966 56 220 1133' },
  { id: 'L-2019', name: 'Noura Al-Qahtani', project: 'The Vantage', unit: '1BR', stage: 'Closed', date: 'Jun 18, 2026', value: 'SAR 540k', phone: '+966 59 776 4400' },
]

export const commissions = [
  { id: 'C-8821', project: 'Palm Residence', unit: '2BR', buyer: 'F. Al-Zahrani', amount: 'SAR 21,600', rate: '3%', status: 'Paid', date: 'Jun 30, 2026' },
  { id: 'C-8814', project: 'Coral Bay Residences', unit: '1BR', buyer: 'O. Bin Saleh', amount: 'SAR 28,800', rate: '4%', status: 'Processing', date: 'Jun 22, 2026' },
  { id: 'C-8803', project: 'Jade Gardens', unit: 'Villa', buyer: 'L. Hassan', amount: 'SAR 63,000', rate: '3%', status: 'Pending', date: 'Jun 15, 2026' },
  { id: 'C-8790', project: 'The Vantage', unit: '1BR', buyer: 'N. Al-Qahtani', amount: 'SAR 10,800', rate: '2%', status: 'Paid', date: 'Jun 8, 2026' },
]

export const stageTones = {
  New: 'blue',
  Contacted: 'amber',
  Viewing: 'purple',
  Negotiation: 'amber',
  Closed: 'green',
}

export const statusTones = {
  Live: 'green',
  'Under Review': 'amber',
  Paused: 'gray',
  Rejected: 'red',
  Paid: 'green',
  Processing: 'blue',
  Pending: 'amber',
}

export function getProject(id) {
  return projects.find((p) => p.id === id)
}
