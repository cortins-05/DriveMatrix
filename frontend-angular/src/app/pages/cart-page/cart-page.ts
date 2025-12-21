import { Component, inject, signal } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { AutoListing } from '../../core/interfaces/Autolisting.interface';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart-page',
  imports: [FontAwesomeModule],
  templateUrl: './cart-page.html',
})
export class CartPage {
  cartService = inject(CartService);
  carrito = this.cartService.getCart();
  productos=signal<AutoListing[]>([]);
  router = inject(Router);

  constructor(){
    for(let p of this.carrito()){
      console.log(p);
      this.cartService.getVehicleByVin(p.vehicle_vin)
      .subscribe({
        next: resp=>{
          this.productos.update(items => [...items, resp[0]]);
        },
        error: err=>{
          console.error(err);
        }
      })
    }
  }

  remove(itemVin:string){
    this.cartService.remove(itemVin);
    console.log(this.carrito());
  }

  plus = faPlus;
  minus = faMinus;
}

export default CartPage;
