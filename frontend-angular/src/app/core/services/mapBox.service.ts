import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({providedIn: 'root'})
export class MapBoxService {
  private http = inject(HttpClient);
  public accessToken = 'pk.eyJ1IjoiY29ydGlucyIsImEiOiJjbWlmNXZsYncwNGF5M2VxdTlpcDZrbDZzIn0.4AqoIaQOuhjd0iqhx4biZQ';
  private baseUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

  reverseGeocode(lng: number, lat: number): Observable<any> {
    // El formato de la query para la geocodificación inversa es LONGITUD,LATITUD
    const coordinates = `${lng},${lat}`;

    // Construye la URL de la API
    const url = `${this.baseUrl}/${coordinates}.json?access_token=${this.accessToken}&language=es&limit=1`;

    // 💡 Uso del HttpClient de Angular
    return this.http.get<any>(url);
  }
}
