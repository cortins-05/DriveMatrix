import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { AutoListing } from '../interfaces/Autolisting.interface';

interface CartItem{
  vehicle_vin:string;
  cuantity: number;
}

@Injectable({providedIn: 'root'})
export class CartService {

  http = inject(HttpClient);

  private readonly STORAGE_KEY = 'cart';
  private cart = signal<CartItem[]>(this.load());

  private load(): CartItem[] {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY) ?? '[]');
  }

  private persist() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cart()));
  }

  add(item:CartItem){
    const cart = this.cart();
    const found = cart.find(i => i.vehicle_vin === item.vehicle_vin);
    if(found) found.cuantity++
    else cart.push(item);

    this.cart.set(cart);
    this.persist();
  }

  remove(vehicle_vin:string){
    const cart = this.cart();
    const found = cart.find(i => i.vehicle_vin === vehicle_vin);
    if(found){
      if(found.cuantity<=0){
        return;
      }
      else found.cuantity--;
    }else{
      return;
    }
    this.cart.set(cart);
    this.persist();
  }

  clear() {
    this.cart.set([]);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  getCart() {
    return this.cart;
  }

  getVehicleByVin(vin: string) {
    const url = 'http://localhost:5000/api/auto/listings/filter';
    return this.http.get<any>(url,{ params: { vin } });
  }

}
