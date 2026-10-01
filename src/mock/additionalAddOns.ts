export interface AdditionalAddOn {
  name: string;
  price: number;
  description: string;
}

export const additionalAddOns: AdditionalAddOn[] = [
  { name: 'Decor Styling', price: 2500, description: 'Themed setup for the event area.' },
  { name: 'Sound System Upgrade', price: 1800, description: 'Enhanced speakers and audio support.' },
  { name: 'Projector & Screen', price: 1500, description: 'For AVP and presentations.' },
  { name: 'Welcome Drinks', price: 1200, description: 'Prepared refreshments for arriving guests.' },
];
