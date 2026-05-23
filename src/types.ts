export interface TravelOffer {
  duration_days: string | number;
  duration_nights: string | number;
  star_rating: string | number;
  google_category_id: string;
  discount_amount: string | number;
  price: string | number;
  price_old: string | number;
  sku: string;
  keywords: string;
  title: string;
  accommodation_name: string;
  airport_departure: string;
  destination_city: string;
  destination_region: string;
  destination_country: string;
  destination_country_code: string;
  travel_transportation_type: string;
  link: string;
  update_date: string;
  departure_date: string;
  extra_data?: {
    product_acco_url_vd?: string;
    product_duration_category?: string;
    product_category_path?: string;
    product_terms_and_conditions?: string;
    product_touristic_region?: string;
    product_min_nr_people?: string | number;
    product_category?: string;
    product_trustyou_rating?: string;
  };
}
