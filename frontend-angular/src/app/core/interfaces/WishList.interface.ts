export interface WishListObject {
  wishlist: Wishlist[];
}

export interface Wishlist {
  added_at:    Date;
  vehicle_vin: string;
}
