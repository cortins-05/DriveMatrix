import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map, of } from 'rxjs';
import { AutoListing } from '../../core/interfaces/Autolisting.interface';
import { PixabayService } from '../../core/services/pixabay.service';
import { SwiperCarousel } from '../../shared/components/swiperCarousel/swiperCarousel';
import { MapBox } from '../../shared/components/mapBox/mapBox';
import { AuthService } from '../../auth/auth.service';
import { CartService } from '../../core/services/cart.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import {faHeart as faHeart2} from '@fortawesome/free-regular-svg-icons';
import { WishListService } from '../../core/services/wishList.service';
import { ValorationService } from '../../core/services/valoration.service';
import { Valoration } from '../../shared/components/valoration/valoration';
import { ValorationElement } from '../../auth/interfaces/valoration.interface';

@Component({
  selector: 'app-vehicle-page',
  imports: [SwiperCarousel,MapBox,FontAwesomeModule,Valoration],
  templateUrl: './vehicle-page.html',
})
export class VehiclePage implements OnInit {

  activatedRoute = inject(ActivatedRoute);
  http = inject(HttpClient);
  pixabay = inject(PixabayService);
  authService = inject(AuthService);
  cartService = inject(CartService);
  wishListService = inject(WishListService);
  valorationService = inject(ValorationService);
  router = inject(Router);

  vehicleVin = signal<string>("");
  vehicleData: WritableSignal<AutoListing | null> = signal(null);
  vehicleImages = signal<any>(null);

  venta = signal<boolean|null>(null);
  carrito = signal<boolean|null>(null);

  inWishlist = signal<boolean>(false);

  valorations = signal<ValorationElement[]|null>(null);

  addCart(){
    this.cartService.add({"vehicle_vin":this.vehicleVin(),"cuantity":1});
    this.carrito.set(true);
    setTimeout(()=>{
      this.carrito.set(null);
    },2000);
  }

  ngOnInit(): void {
    this.activatedRoute.queryParamMap.pipe(
      map(params=>{
        const vehicle_vin = params.get("vin");
        return vehicle_vin;
      })
    ).subscribe(vehicle_vin=>{
      this.vehicleVin.set(String(vehicle_vin));
      this.loadData();
    })
  }

  loadData(){
    let url = "http://localhost:5000/api/auto/listings/filter";
    this.http.get<AutoListing[]>(url,{"params":{"vin":this.vehicleVin()}}).pipe(
      map(data=>{
        const item = data[0];

        const isUsable = (value: any) => value && value !== "none";

        const autoBase: Partial<AutoListing> = {
          vin: item.vin,
          make: item.make,
          model: item.model,
          location: item.location
        }

        const autoLimpio: AutoListing = {
          vin: item.vin,
          make: item.make,
          model: item.model,
          location: item.location,
          transmission: item.transmission,
          fuel: item.fuel,
          engine: item.engine,
          drivetrain: item.drivetrain,
          doors: item.doors,
          seats: item.seats,
          price: item.price
        };

        return autoLimpio;
      })
    )
    .subscribe(finalyData=>{
      this.vehicleData.set(finalyData);
      let longitud = Object.keys(finalyData).length;
      (finalyData);
      this.pixabay.searchImages(`${finalyData.make} ${finalyData.model} car`,longitud)
      .subscribe(resp=>{
        this.vehicleImages.set(resp);
      })
      this.checkeoWishList();
      this.getAllValoration();
    });
  }

  comprarVehiculo() {
    const data = this.vehicleData();

    if (!data) return;

    this.cartService.vehiclesRapidPurchase.set([data]);
    this.router.navigateByUrl("/payment");
  }

  async checkeoWishList() {
    let checkar = await this.wishListService.checkeoWishList(this.vehicleVin());
    if(checkar){
      this.inWishlist.set(true);
    }
  }

  anadirWishList(){
    this.wishListService.añadirWishList(this.vehicleVin())
    .subscribe({
      next: exito=>{
        this.inWishlist.set(true);
      },
      error: err=>{
        console.error(err);
      }
    })
  }

  eliminarWishList(){
    this.wishListService.eliminarWishList(this.vehicleVin())
    .subscribe({
      next: exito=>{
        this.inWishlist.set(false);
      },
      error: err=>{
        console.error(err);
      }
    })
  }

  getAllValoration(){
    this.valorationService.getValorationVehicle(this.vehicleVin())
    .subscribe({
      next: valoraciones => {
        this.valorations.set(valoraciones.valorations);
      },
      error: err => {
        console.error('Error al obtener valoraciones:', err);
      }
    })
  }

  fullHeart = faHeart;
  emptyHeart = faHeart2;

}

export default  VehiclePage;
