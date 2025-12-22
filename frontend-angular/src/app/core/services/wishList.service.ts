import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

interface WishList{
  wishlist: [];
}

@Injectable({providedIn: 'root'})
export class WishListService {

  http = inject(HttpClient);

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('Token no disponible');
    }

    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  obtenerWishList(){
    return this.http.get<WishList>("http://localhost:5000/api/user/wishlist",{
      headers: this.getHeaders()
    })
  }

  añadirWishList(vehicleVin:string){
    return this.http.post("http://localhost:5000/api/user/wishlist/add",{"vehicle_vin": vehicleVin},{
      headers: this.getHeaders()
    })
  }

  eliminarWishList(vehicleVin:string){
    return this.http.post("http://localhost:5000/api/user/wishlist/remove",{"vehicle_vin": vehicleVin},{
      headers: this.getHeaders()
    })
  }

  async checkeoWishList(vehicleVin: string): Promise<boolean> {
    const resp = await firstValueFrom(this.obtenerWishList());

    return resp.wishlist.some(
      (item: any) => item.vehicle_vin === vehicleVin
    );
  }


}
