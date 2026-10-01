import type { InventoryItem } from '@/types';

const updatedAt = '2026-04-01';

// Shared inventory is grouped by item name. Each approved room booking uses one unit.
export const inventoryItems: InventoryItem[] = [
  {
    id: 'inventory-beds', room_id: '', name: 'Beds', category: 'Room Amenities', itemType: 'reusable',
    totalQuantity: 6, availableQuantity: 6, inUseQuantity: 0, damagedQuantity: 0, unit: 'pcs', reorderLevel: 1,
    location: 'Shared / Rooms', notes: 'Combined room inventory. One unit is allocated per approved room booking.', updatedAt,
  },
  {
    id: 'inventory-pillows', room_id: '', name: 'Pillows', category: 'Room Amenities', itemType: 'reusable',
    totalQuantity: 18, availableQuantity: 18, inUseQuantity: 0, damagedQuantity: 0, unit: 'pcs', reorderLevel: 2,
    location: 'Shared / Rooms', notes: 'Combined room inventory. One unit is allocated per approved room booking.', updatedAt,
  },
  {
    id: 'inventory-towels', room_id: '', name: 'Towels', category: 'Housekeeping', itemType: 'reusable',
    totalQuantity: 18, availableQuantity: 18, inUseQuantity: 0, damagedQuantity: 0, unit: 'pcs', reorderLevel: 2,
    location: 'Shared / Rooms', notes: 'Combined room inventory. One unit is allocated per approved room booking.', updatedAt,
  },
  {
    id: 'inventory-tv', room_id: '', name: 'TV', category: 'Appliance', itemType: 'reusable',
    totalQuantity: 3, availableQuantity: 3, inUseQuantity: 0, damagedQuantity: 0, unit: 'unit', reorderLevel: 1,
    location: 'Shared / Rooms', notes: 'Combined room inventory. One unit is allocated per approved room booking.', updatedAt,
  },
  {
    id: 'inventory-air-conditioner', room_id: '', name: 'Air Conditioner', category: 'Appliance', itemType: 'reusable',
    totalQuantity: 3, availableQuantity: 3, inUseQuantity: 0, damagedQuantity: 0, unit: 'unit', reorderLevel: 1,
    location: 'Shared / Rooms', notes: 'Combined room inventory. One unit is allocated per approved room booking.', updatedAt,
  },
];
