import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { AutoListing } from '../../core/interfaces/Autolisting.interface';
import { PixabayService } from '../../core/services/pixabay.service';
import { SwiperCarousel } from '../../shared/components/swiperCarousel/swiperCarousel';

@Component({
  selector: 'app-vehicle-page',
  imports: [SwiperCarousel],
  templateUrl: './vehicle-page.html',
})
export class VehiclePage implements OnInit {

  activatedRoute = inject(ActivatedRoute);
  http = inject(HttpClient);
  pixabay = inject(PixabayService);

  vehicleVin = signal<string>("");
  vehicleData:WritableSignal<AutoListing|null> = signal<AutoListing|null>(null) ;
  vehicleImages = signal<any>("");

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
        const autoLimpio:AutoListing = {
          vin: data[0].vin,
          make: data[0].make ?? 'Sin datos',
          model: data[0].model ?? 'Sin datos',
          transmission: data[0].transmission ?? 'Sin datos',
          fuel: data[0].fuel ?? 'Sin datos',
          engine: data[0].engine ?? 'Sin datos',
          drivetrain: data[0].drivetrain ?? 'Sin datos',
          doors: data[0].doors ?? 'Sin datos',
          seats: data[0].seats ?? 'Sin datos',
          location: data[0].location
        }
        return autoLimpio;
      })
    )
    .subscribe(finalyData=>{
      this.vehicleData.set(finalyData);
      this.pixabay.searchImages(`${finalyData.make} ${finalyData.model} car`).pipe(
        map(valoresIniciales=>{
          return valoresIniciales["largeImageURL"];
        })
      )
      .subscribe(valoresFinales=>{
        this.vehicleImages.set(valoresFinales);
      })
    });
  }
}
