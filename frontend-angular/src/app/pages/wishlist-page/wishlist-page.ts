import { Component, effect, inject, signal } from '@angular/core';
import { WishListService } from '../../core/services/wishList.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSadCry } from '@fortawesome/free-solid-svg-icons';
import { Wishlist } from '../../core/interfaces/WishList.interface';
import { CartService } from '../../core/services/cart.service';
import { AutoListing } from '../../core/interfaces/Autolisting.interface';
import { PixabayService } from '../../core/services/pixabay.service';

@Component({
  selector: 'app-wishlist-page',
  imports: [FontAwesomeModule],
  templateUrl: './wishlist-page.html',
})
export class WishlistPage {
  wishListService = inject(WishListService);
  cartService = inject(CartService);
  pixabay = inject(PixabayService);

  vehiculos = signal<AutoListing[]>([]);
  imageList = signal<string[]>([]);

  carrito = signal<boolean>(false);

  constructor(){
    effect(() => {
      const lista = this.vehiculos();
      if (lista.length > 0) {
        this.cargarImagenes(lista);
      }
    });

    this.wishListService.obtenerWishList()
    .subscribe({
      next: exito=>{
        for(let elementoLista of exito.wishlist){
          this.cartService.getVehicleByVin(elementoLista.vehicle_vin)
          .subscribe({
            next: vehicle=>{
              this.vehiculos.update(list => [...list, vehicle[0]]);
            }
          });
        }
      },
      error: err=>{
        console.error(err);
      }
    })
  }

  cargarImagenes(listaCoches: AutoListing[]) {
    console.log(listaCoches);
    const listaTemporal: string[] = [];
    for (const coche of listaCoches) {
      this.pixabay.searchImages(`${coche.make} ${coche.model} car`, 1)
      .subscribe({
        next: resp=>{
          console.log(resp);
          listaTemporal.push(resp);
        },
        error: err=>{
          console.error(err);
        }
      });
    }
    console.log(listaTemporal);
    this.imageList.set(listaTemporal);
  }

  borrar(vin:string){
    this.wishListService.eliminarWishList(vin)
    .subscribe({
      next: exito=>{
        this.wishListService.obtenerWishList()
        .subscribe({
          next: exito=>{
            this.vehiculos.set([]);
            for(let elementoLista of exito.wishlist){
              this.cartService.getVehicleByVin(elementoLista.vehicle_vin)
              .subscribe({
                next: vehicle=>{
                  this.vehiculos.update(list => [...list, vehicle[0]]);
                }
              });
            }
          },
          error: err=>{
            console.error(err);
          }
        })
      },
      error: err=>{
        console.error(err);
      }
    })
  }

  addCart(vin:string){
    this.cartService.add({"vehicle_vin":vin,"cuantity":1});
    this.carrito.set(true);
    setTimeout(()=>{
      this.carrito.set(false);
    },2000);
    this.borrar(vin);
  }

  caraTriste = faSadCry;

}

export default WishlistPage;
