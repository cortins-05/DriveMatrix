export interface Valoration {
  average_rating: number;
  page:           number;
  per_page:       number;
  total:          number;
  valorations:    ValorationElement[];
  vehicle_vin:    string;
}

export interface ValorationElement {
  valoration_id?: string,
  _id:         string;
  comment:     string;
  created_at:  Date;
  rating:      number;
  updated_at:  Date;
  user_id:     string;
  vehicle_vin: string;
}
