import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Component, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { AutoListing } from '../../core/interfaces/Autolisting.interface';
import { PixabayService } from '../../core/services/pixabay.service';
import { map } from 'rxjs';
import { DatePipe } from '@angular/common';
import { RouterLink } from "@angular/router";
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

const purchasesURL = "http://localhost:5000/api/purchase/show";
const valorationURL = "http://localhost:5000/api/valoration/create";

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

  ventas = signal<any[]>([]);
  purchases = signal<(AutoListing | null)[]>([]);
  imageList = signal<string[]>([]);

  form:FormGroup;
  valoracion = signal<boolean|null>(null);

  constructor(){

    this.form = this.fb.group({
      rating: [null],
      comment: ['']
    })

    const token = localStorage.getItem('token');
    if (!token) {
      this.authService.logout();
      this.authService.isAuthenticated.set(false);
      return;
    }

    effect(() => {
      const lista = this.purchases();

      if (lista.length > 0) {
        this.cargarImagenes(lista.filter(v => v !== null));
      }
    });

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Authorization': token
      })
    }
    this.http.get<any>(purchasesURL,httpOptions)
    .subscribe({
      next: exito=>{
        let ventas = exito['purchases'];
        this.ventas.set(ventas);
        for(let venta of ventas){
          this.getVehicleByVin(venta['ref_vehicle_vin'])
          .subscribe({
            next: exito=>{
              this.purchases.update(list => [...list, exito[0]]);
            },
            error: () => {
              this.purchases.update(list => [...list, null]);
            }
          });
        }
      },
      error: error=>{
        console.error("Hubo un error en la peticion http: ",error);
      }
    })
  }

  submit(vin:string){
    const { rating, comment } = this.form.value;
    const token = localStorage.getItem('token');

    if (!token) {
      this.authService.logout();
      this.authService.isAuthenticated.set(false);
      return;
    }

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Authorization': token
      })
    }

    const body={
      "vehicle_vin": vin,
      "rating": rating,
      "comment": comment
    }

    console.log(body);

    this.http.post(valorationURL,body,httpOptions)
    .subscribe({
      next: exito=>{
        console.log("Valoracion publicada: ", exito);
        this.valoracion.set(true);
        setTimeout(()=>{
          this.valoracion.set(null);
        },2000);
      },
      error: err=>{
        console.error("Error inesperado: ",err);
        this.valoracion.set(false);
        setTimeout(()=>{
          this.valoracion.set(null);
        },2000);
      }
    })

  }

  getVehicleByVin(vin: string) {
    const url = 'http://localhost:5000/api/auto/listings/filter';
    return this.http.get<any>(url, { params: { vin } });
  }

  cargarImagenes(listaCoches:any[]){
    let lista_temporal:any[]=[];
    for(let coche of listaCoches){
      this.pixabay.searchImages(`${coche.make} ${coche.model} car`,1)
      .subscribe(resp=>{
        lista_temporal.push(resp);
      })
    }
    this.imageList.set(lista_temporal);
  }

  arrowDown = faArrowDown;

}

export default PurchasesPage;
