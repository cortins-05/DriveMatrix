import { Component, inject, signal } from '@angular/core';
import { WishListService } from '../../core/services/wishList.service';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-wishlist-page',
  imports: [],
  templateUrl: './wishlist-page.html',
})
export class WishlistPage {
  wishListService = inject(WishListService);

  wishList = signal<any>([]);

  constructor(){
    this.wishListService.obtenerWishList()
    .subscribe({
      next: exito=>{
        this.wishList.set(exito.wishlist);
      },
      error: err=>{
        console.error(err);
      }
    })
  }
}

export default WishlistPage;
