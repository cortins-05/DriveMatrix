import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { AutoListing } from '../../core/interfaces/Autolisting.interface';
import { PixabayService } from '../../core/services/pixabay.service';
import { DatePipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ValorationService } from '../../core/services/valoration.service';
import { map } from 'rxjs';

const purchasesURL = 'http://localhost:5000/api/purchase/show';
const valorationURL = 'http://localhost:5000/api/valoration/create';

@Component({
  selector: 'app-purchases-page',
  imports: [DatePipe, FontAwesomeModule, ReactiveFormsModule],
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

  form: FormGroup;
  valoracion = signal<boolean | null>(null);

  constructor() {
    this.form = this.fb.group({
      rating: [null],
      comment: [''],
    });

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

  submit(vin: string) {
    const { rating, comment } = this.form.value;
    const token = localStorage.getItem('token');

    if (!token) {
      this.authService.logout();
      this.authService.isAuthenticated.set(false);
      return;
    }

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: token,
      }),
    };

    const body = {
      vehicle_vin: vin,
      rating,
      comment,
    };

    this.http.post(valorationURL, body, httpOptions).subscribe({
      next: () => {
        this.valoracion.set(true);
        this.purchases.update(list =>
          list.map(item =>
            item.vehicle.vin === vin
              ? { ...item, rated: true }
              : item
          )
        );
        setTimeout(() => this.valoracion.set(null), 2000);
      },
      error: () => {
        this.valoracion.set(false);
        setTimeout(() => this.valoracion.set(null), 2000);
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
    .getValorationVehicleUser(
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

  arrowDown = faArrowDown;
}

export default PurchasesPage;
