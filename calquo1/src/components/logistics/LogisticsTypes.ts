// Types for logistics management system
export interface LogisticsAgent {
  id: string;
  name: string;
  gstNumber: string;
  mobileNumber: string;
  serviceArea: ServiceArea;
  isActive: boolean;
  dateAdded: string;
  totalDeliveries?: number;
  rating?: number;
  specialServices?: string[];
}

export interface ServiceArea {
  type: 'all-india' | 'selected-cities';
  cities?: string[];
}

export interface DeliveryCity {
  id: string;
  name: string;
  state: string;
  pincode?: string;
  isActive: boolean;
  dateAdded: string;
}

export interface OrderLogistics {
  preferredAgentId?: string;
  deliveryCity: string;
  deliveryAddress: string;
  specialInstructions?: string;
}

// Major Indian cities for service area selection
export const MAJOR_INDIAN_CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore', 
  'Hyderabad',
  'Ahmedabad',
  'Chennai',
  'Kolkata',
  'Surat',
  'Pune',
  'Jaipur',
  'Lucknow',
  'Kanpur',
  'Nagpur',
  'Indore',
  'Thane',
  'Bhopal',
  'Visakhapatnam',
  'Pimpri-Chinchwad',
  'Patna',
  'Vadodara',
  'Ghaziabad',
  'Ludhiana',
  'Agra',
  'Nashik',
  'Faridabad',
  'Meerut',
  'Rajkot',
  'Kalyan-Dombivli',
  'Vasai-Virar',
  'Varanasi',
  'Srinagar',
  'Aurangabad',
  'Dhanbad',
  'Amritsar',
  'Navi Mumbai',
  'Allahabad',
  'Ranchi',
  'Howrah',
  'Coimbatore',
  'Jabalpur',
  'Gwalior',
  'Vijayawada',
  'Jodhpur',
  'Madurai',
  'Raipur',
  'Kota',
  'Chandigarh',
  'Guwahati',
  'Solapur',
  'Hubballi-Dharwad',
  'Tiruchirappalli',
  'Bareilly',
  'Mysore',
  'Tiruppur',
  'Gurgaon',
  'Aligarh',
  'Jalandhar',
  'Bhubaneswar',
  'Salem',
  'Warangal',
  'Guntur',
  'Bhiwandi',
  'Saharanpur',
  'Gorakhpur',
  'Bikaner',
  'Amravati',
  'Noida',
  'Jamshedpur',
  'Bhilai',
  'Cuttack',
  'Firozabad',
  'Kochi',
  'Nellore',
  'Bhavnagar',
  'Dehradun',
  'Durgapur',
  'Asansol',
  'Rourkela',
  'Nanded',
  'Kolhapur',
  'Ajmer',
  'Akola',
  'Gulbarga',
  'Jamnagar',
  'Ujjain',
  'Loni',
  'Siliguri',
  'Jhansi',
  'Ulhasnagar',
  'Jammu',
  'Sangli-Miraj & Kupwad',
  'Mangalore',
  'Erode',
  'Belgaum',
  'Ambattur',
  'Tirunelveli',
  'Malegaon',
  'Gaya',
  'Jalgaon',
  'Udaipur',
  'Maheshtala'
];