import { Component, inject, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';

const compraURL = "http://localhost:5000/api/purchase/create";

@Component({
  selector: 'app-payment-page',
  imports: [],
  templateUrl: './payment-page.html',
})
export class PaymentPage implements OnDestroy {
  router = inject(Router);
  cartService = inject(CartService);
  http = inject(HttpClient);
  authService = inject(AuthService);

  price = signal<number>(0);
  venta = signal<boolean|null>(null);

  constructor(){
    let precio_final = 0;
    for(let vehicle of this.cartService.vehiclesRapidPurchase()){
      precio_final+=vehicle.price;
    }
    this.price.set(precio_final);

    if(this.price()==0){
      this.router.navigateByUrl("/");
    }

    console.log(this.cartService.vehiclesRapidPurchase());

  }

  comprar(){
    for(let vehiculo of this.cartService.vehiclesRapidPurchase()){
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
    this.cartService.clear();
    this.cartService.vehiclesRapidPurchase.set([]);
  }

  ngOnDestroy(): void {
    this.cartService.vehiclesRapidPurchase.set([]);
  }

}
