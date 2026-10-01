export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatCompactDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatCapacityLabel(value: string) {
  return value
    .replace(/^Up to\s+/i, 'Good for ')
    .replace(/^Good for at least\s+/i, 'Good for ')
    .replace(/\bpersons\b/gi, 'guests');
}

export function formatRoomCapacityLabel(roomName: string | undefined, capacity: string) {
  if (roomName?.includes('Grand Room')) {
    return 'Good for 3 Guests';
  }

  if (roomName?.includes('Family Room')) {
    return 'Good for 4 Guests';
  }

  if (roomName?.includes('Luxe Stay')) {
    return 'Good for 2 Guests';
  }

  return formatCapacityLabel(capacity);
}
