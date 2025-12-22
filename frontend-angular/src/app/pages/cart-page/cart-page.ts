import { Component, inject, signal } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { AutoListing } from '../../core/interfaces/Autolisting.interface';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

const compraURL = "http://localhost:5000/api/purchase/create";

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
  authService = inject(AuthService);
  http = inject(HttpClient);

  venta = signal<boolean|null>(null);

  constructor(){
    for(let p of this.carrito()){
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

  comprar(){
    for(let vehiculo of this.productos()){
      if(vehiculo.vin=='') return;
      const token = localStorage.getItem('token');

      if (!token) {
        this.authService.logout();
        this.authService.isAuthenticated.set(false);
        return;
      }

      const httpOptions = {
        headers: new HttpHeaders({
          'Content-Type':  'application/json',
          'Authorization': token
        })
      }

      this.http.post(compraURL,{"vehicle_vin":vehiculo.vin},httpOptions)
      .subscribe({
        next: exito=>{
          this.venta.set(true);
        },
        error: err=>{
          this.venta.set(false);
        }
      })

      setTimeout(()=>{
        this.venta.set(null);
      },2000);
    }
  }

  limpiar(){
    this.cartService.clear();
  }

  remove(itemVin:string){
    this.cartService.remove(itemVin);
  }

  plus = faPlus;
  minus = faMinus;
}

export default CartPage;
