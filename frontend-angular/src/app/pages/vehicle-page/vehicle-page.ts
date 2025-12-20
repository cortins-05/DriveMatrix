import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { AutoListing } from '../../core/interfaces/Autolisting.interface';
import { PixabayService } from '../../core/services/pixabay.service';
import { SwiperCarousel } from '../../shared/components/swiperCarousel/swiperCarousel';
import { MapBox } from '../../shared/components/mapBox/mapBox';

@Component({
  selector: 'app-vehicle-page',
  imports: [SwiperCarousel,MapBox],
  templateUrl: './vehicle-page.html',
})
export class VehiclePage implements OnInit {

  activatedRoute = inject(ActivatedRoute);
  http = inject(HttpClient);
  pixabay = inject(PixabayService);

  vehicleVin = signal<string>("");
  vehicleData:WritableSignal<Partial<AutoListing>|null> = signal(null) ;
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
        const item = data[0];

        const isUsable = (value: any) => value && value !== "none";

        const autoBase: Partial<AutoListing> = {
          vin: item.vin,
          make: item.make,
          model: item.model,
          location: item.location
        }

        const optionalProps = {
          ...(isUsable(item.transmission) && { transmission: item.transmission }),
          ...(isUsable(item.fuel) && { fuel: item.fuel }),
          ...(isUsable(item.engine) && { engine: item.engine }),
          ...(isUsable(item.drivetrain) && { drivetrain: item.drivetrain }),
          ...(isUsable(item.doors) && { doors: item.doors }),
          ...(isUsable(item.seats) && { seats: item.seats })
        }

        const autoLimpio: Partial<AutoListing> = {
          ...autoBase,
          ...optionalProps
        } as Partial<AutoListing>;

        return autoLimpio;
      })
    )
    .subscribe(finalyData=>{
      this.vehicleData.set(finalyData);
      let longitud = Object.keys(finalyData).length;
      console.log(finalyData);
      this.pixabay.searchImages(`${finalyData.make} ${finalyData.model} car`,longitud).pipe(
        map((valoresIniciales:any[])=>{
          return valoresIniciales.map(item=>item.largeImageURL);
        })
      )
      .subscribe(valoresFinales=>{
        this.vehicleImages.set(valoresFinales);
        console.log(valoresFinales);
      })
    });
  }
}

export default  VehiclePage;
