export interface tokenInterface{
  token:string
}

export interface UserResponse {
  user:  User;
  valid: boolean;
}

export interface User {
  _id:               string;
  created_at:        Date;
  email:             string;
  nombre:            string;
  purchases_history: any[];
  wishlist:          any[];
}
