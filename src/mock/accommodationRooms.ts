export interface AccommodationRoom {
  id: string;
  name: string;
  image: string;
  capacity: string;
  price: number;
  inclusions: string[];
}

export const accommodationRooms: AccommodationRoom[] = [
  {
    id: 'room-1',
    name: 'Watikolo Luxe Stay',
    image: new URL('../pictures/room1.jpg', import.meta.url).href,
    capacity: 'Good for 2 Guests',
    price: 1999,
    inclusions: ['Air conditioning', 'Private bathroom', 'Smart TV', 'Free WiFi', 'Parking area'],
  },
  {
    id: 'room-2',
    name: 'Watikolo Grand Room',
    image: new URL('../pictures/room2.jpg', import.meta.url).href,
    capacity: 'Good for 3 Guests',
    price: 2499,
    inclusions: ['Air conditioning', 'Free WiFi', 'Cozy bed', 'Parking area'],
  },
  {
    id: 'room-big',
    name: 'Watikolo Family Room',
    image: new URL('../pictures/room3.jpg', import.meta.url).href,
    capacity: 'Good for 4 Guests',
    price: 3499,
    inclusions: ['Air conditioning', 'Private CR', 'Mini lounge', 'Free WiFi', 'Parking area'],
  },
];

