import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { AutoListing } from '../../core/interfaces/Autolisting.interface';
import { PixabayService } from '../../core/services/pixabay.service';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ValorationService } from '../../core/services/valoration.service';
import { map } from 'rxjs';
import { Valoration } from '../../shared/components/valoration/valoration';

const purchasesURL = 'http://localhost:5000/api/purchase/show';
const valorationURL = 'http://localhost:5000/api/valoration/create';

@Component({
  selector: 'app-purchases-page',
  imports: [DatePipe, ReactiveFormsModule,Valoration],
  templateUrl: './purchases-page.html',
})
export class PurchasesPage {
  http = inject(HttpClient);
  authService = inject(AuthService);
  pixabay = inject(PixabayService);
  fb = inject(FormBuilder);
  valorationService = inject(ValorationService);

  ventas = signal<any>([]);
  purchases = signal<{ vehicle: AutoListing; rated: boolean }[]>([]);
  imageList = signal<string[]>([]);
  user_id = signal(this.authService.user()?.user._id);

  constructor() {

    const token = localStorage.getItem('token');
    if (!token) {
      this.authService.logout();
      this.authService.isAuthenticated.set(false);
      return;
    }

    effect(() => {
      const lista = this.purchases();
      if (lista.length > 0) {
        this.cargarImagenes(lista.map(v => v.vehicle));
      }
      console.log(this.purchases().map(p => p.vehicle.vin));
    });

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: token,
      }),
    };

    this.http.get<{ purchases: { ref_vehicle_vin: string }[] }>(purchasesURL, httpOptions)
      .subscribe({
        next: resp => {
          this.ventas.set(resp.purchases);
          for (const venta of resp.purchases) {
            this.getVehicleByVin(venta.ref_vehicle_vin).subscribe({
              next: vehicleResp => {
                this.getValorationByUser(vehicleResp[0]).subscribe({
                  next: result => {
                    this.purchases.update(list => [...list, result]);
                  },
                });
              },
            });
          }
        },
        error: err => {
          console.error('Hubo un error en la peticion http: ', err);
        },
      });
  }

  getVehicleByVin(vin: string) {
    const url = 'http://localhost:5000/api/auto/listings/filter';
    return this.http.get<AutoListing[]>(url, { params: { vin } });
  }

  cargarImagenes(listaCoches: AutoListing[]) {
    const listaTemporal: string[] = [];
    for (const coche of listaCoches) {
      this.pixabay.searchImages(`${coche.make} ${coche.model} car`, 1)
        .subscribe(resp => {
          listaTemporal.push(resp);
        });
    }
    this.imageList.set(listaTemporal);
  }

  getValorationByUser(vehicle: AutoListing) {
    return this.valorationService
    .getValorationVehicle(
      vehicle.vin!
    )
    .pipe(
      map(resp => ({
        vehicle,
        rated: resp.valorations.some(
          v => String(v.user_id) == String(this.user_id())
        ),
      }))
    );
  }
}

export default PurchasesPage;
