import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Valoration } from '../../auth/interfaces/valoration.interface';
import { Observable } from 'rxjs';

const URLallValorationsByVin = "http://localhost:5000/api/valorations/";

@Injectable({providedIn: 'root'})
export class ValorationService {

  http = inject(HttpClient);

  getValorationVehicleUser(vin:string):Observable<Valoration>{
    return this.http.get<Valoration>(URLallValorationsByVin+vin);
  }

}
