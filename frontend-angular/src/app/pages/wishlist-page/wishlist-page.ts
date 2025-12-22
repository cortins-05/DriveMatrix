import { Component, inject, signal } from '@angular/core';
import { WishListService } from '../../core/services/wishList.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSadCry } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-wishlist-page',
  imports: [FontAwesomeModule],
  templateUrl: './wishlist-page.html',
})
export class WishlistPage {
  wishListService = inject(WishListService);

  wishList = signal<any[]>([]);

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

  caraTriste = faSadCry;

}

export default WishlistPage;
