import { Component, computed, inject, input, OnInit, signal, effect } from '@angular/core';
import { RouterLink } from "@angular/router";
import { AuthService } from '../../../auth/auth.service';
import { PixabayService } from '../../../core/services/pixabay.service';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeart2 } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { WishListService } from '../../../core/services/wishList.service';
import { ValorationService } from '../../../core/services/valoration.service';
import { AutoListing } from '../../../core/interfaces/Autolisting.interface';

interface ValorationShowing{
  puntuacion:number;
  users:number;
}

@Component({
  selector: 'cars-table-component',
  imports: [RouterLink,FontAwesomeModule],
  templateUrl: './carsTable.html',
})
export class CarsTable {

  authService = inject(AuthService);
  pixabay = inject(PixabayService);
  wishListService = inject(WishListService);
  valorationService = inject(ValorationService);

  dataList = input.required<any[]>();
  imageList = signal<any[]>([]);
  pagination = input(false);
  valorations = signal<ValorationShowing[]>([]);

  inWishlist = signal<boolean[]>([]);

  page = input(0);

  paginatedData:any = computed(() => {
    const data = this.dataList();

    if (!this.pagination()) {
      return data;
    }

    const size = 10;
    const result: any[][] = [];

    for (let i = 0; i < data.length; i += size) {
      result.push(data.slice(i, i + size));
    }

    return result[this.page()];
  });

  constructor(){
    effect(() => {
      const data = this.paginatedData();
      console.log(data);
      if (!data || data.length === 0) {
        this.imageList.set([]);
        return;
      }
      this.cargarImagenes(data);
      this.checkeoWishList();
      this.cargarValoraciones(data);
    });
  }

  cargarImagenes(listaCoches:any[]){
    (listaCoches);
    let lista_temporal:any[]=[];
    for(let coche of listaCoches){
      this.pixabay.searchImages(`${coche.make} ${coche.model} car`,1)
      .subscribe(resp=>{
        lista_temporal.push(resp);
      })
    }
    this.imageList.set(lista_temporal);
  }

  anadirWishList(vehicleVin:string){
    this.wishListService.añadirWishList(vehicleVin)
    .subscribe({
      next: exito=>{
        this.checkeoWishList();
      },
      error: err=>{
        console.error(err);
      }
    })
  }

  eliminarWishList(vehicleVin:string){
    this.wishListService.eliminarWishList(vehicleVin)
    .subscribe({
      next: exito=>{
        this.checkeoWishList();
      },
      error: err=>{
        console.error(err);
      }
    })
  }

  cargarValoraciones(listaCoches:AutoListing[]){
    const listaTemporal:ValorationShowing[] = [];
    for(let coche of listaCoches){
      const vehicleVin = coche.vin!;
      this.valorationService.getValorationVehicle(vehicleVin)
        .subscribe({
          next: valoraciones => {
            if(valoraciones.valorations.length<=0) listaTemporal.push({
              puntuacion: 0,
              users:0
            });
            else{
              let sum = 0;
              for(let num of valoraciones.valorations){
                sum += +num.rating;
              }
              listaTemporal.push({puntuacion:Math.round(sum/valoraciones.valorations.length),users:valoraciones.valorations.length});
            }
          },
          error: err => {
            console.error('Error al obtener valoraciones:', err);
          }
        })
    }
    this.valorations.set(listaTemporal);
  }

  async checkeoWishList() {
    this.inWishlist.set([]);
    for(let vehicle of this.dataList()){
      let checkar = await this.wishListService.checkeoWishList(vehicle['vin']);
      if(checkar){
        this.inWishlist().push(true);
      }else{
        this.inWishlist().push(false);
      }
    }
  }

  fullHeart = faHeart;
  emptyHeart = faHeart2;

}
