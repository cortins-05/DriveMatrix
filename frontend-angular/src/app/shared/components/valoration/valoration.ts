import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AfterViewInit, Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { ValorationElement } from '../../../auth/interfaces/valoration.interface';
import { CartService } from '../../../core/services/cart.service';
import { AutoListing } from '../../../core/interfaces/Autolisting.interface';
import { User } from '../../../auth/interfaces/auth.interfaces';

const valorationURL = 'http://localhost:5000/api/valoration/create';

@Component({
  selector: 'app-valoration',
  imports: [ReactiveFormsModule,FontAwesomeModule],
  templateUrl: './valoration.html',
})
export class Valoration {

  http = inject(HttpClient);
  authService = inject(AuthService);
  fb = inject(FormBuilder);
  cartService = inject(CartService);

  form: FormGroup;
  valoracion = signal<boolean | null>(null);

  vehicle_vin = input.required<string>();
  tipe = input.required<number>();
  user_valoration = input<ValorationElement | null>();

  vehicle_info = signal<AutoListing|null>(null);

  user = signal<User|null>(null);

  constructor() {
    this.form = this.fb.group({
      rating: [null],
      comment: [''],
    });

    effect(() => {
      const val = this.user_valoration();

      if (this.tipe() === 2 && !val) {
        throw new Error('user_valoration es obligatorio cuando tipe === 2');
      }

      if(this.tipe()==3){

        this.authService.showUser(this.user_valoration()?.user_id!)
        .subscribe({
          next: resp =>{
            this.user.set(resp);
          }
        })
      }

      if (val) {
        this.form.patchValue({
          rating: String(val.rating),
          comment: val.comment,
        });
        this.cartService.getVehicleByVin(this.user_valoration()?.vehicle_vin!)
        .subscribe({
          next: resp=>{
            this.vehicle_info.set(resp[0]);
          },
          error: err=>{
            console.error(err);
          }
        })
      }
    });

    // Deshabilitar el rating si tipe === 3 (valor fijo, no editable)
    effect(() => {
      const t = this.tipe();
      const ratingCtrl = this.form.get('rating');
      if (t === 3) {
        ratingCtrl?.disable({ emitEvent: false });
      } else {
        ratingCtrl?.enable({ emitEvent: false });
      }
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

    if(this.tipe()==1){
      const body = {
        vehicle_vin: vin,
        rating,
        comment
      };
      this.http.post(valorationURL, body, httpOptions).subscribe({
        next: () => {
          this.valoracion.set(true);
          setTimeout(() => this.valoracion.set(null), 2000);
        },
        error: () => {
          this.valoracion.set(false);
          setTimeout(() => this.valoracion.set(null), 2000);
        },
      });
    }else if(this.tipe()==2){
      const body = {
        rating,
        comment
      };
      this.http.patch("http://localhost:5000/api/valoration/update/"+this.user_valoration()?.valoration_id,body,httpOptions).subscribe({
        next: () => {
          this.valoracion.set(true);
          this.authService.checkStatus();
          setTimeout(() => this.valoracion.set(null), 2000);
        },
        error: err => {
          this.valoracion.set(false);
          console.log(this.user_valoration());
          console.log(err);
          setTimeout(() => this.valoracion.set(null), 2000);
        },
      });
    }
  }

  arrowDown = faArrowDown;
}
