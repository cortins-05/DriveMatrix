import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, map, switchMap } from 'rxjs';
import { AutoListing } from '../../core/interfaces/Autolisting.interface';
import { MapBoxService } from '../../core/services/mapBox.service';
import { QueryParamService } from '../../core/services/queryParam.service';
import { ActivatedRoute } from '@angular/router';
import { CarsTable } from '../../shared/components/carsTable/carsTable';

@Component({
  selector: 'app-catalog-page',
  imports: [CarsTable],
  templateUrl: './catalog-page.html',
})
export class CatalogPage implements OnInit, OnDestroy {
  http = inject(HttpClient);
  mapbox = inject(MapBoxService);
  queryParam = inject(QueryParamService);
  activatedRoute = inject(ActivatedRoute);

  paginaActual = signal(1);
  dataList=signal<AutoListing[]>([]);

  ngOnInit(): void {
    this.activatedRoute.queryParamMap.pipe(
      map(params => {
        const pageParam = params.get("page");
        const page = Number(pageParam);

        return (!pageParam || isNaN(page) || page < 1) ? 1 : page;
      })
    ).subscribe(pageNumber => {
      this.paginaActual.set(pageNumber);
      this.loadData();
    });
  }

  nextPage(){
    this.queryParam.nextPage();
    this.queryParam.guardarRuta();
  }

  previousPage(){
    this.queryParam.previousPage();
    this.queryParam.guardarRuta();
  }

  async ResolverCoordenadas(lat: number, lon: number): Promise<string> {
    try {
      const data = await firstValueFrom(this.mapbox.reverseGeocode(lat, lon));
      return data?.features?.[0]?.place_name ?? "Dirección no encontrada";

    } catch (err) {
      console.error("Error en Mapbox:", err);
      return "Error al obtener dirección";
    }
  }

  loadData() {
    const apiURL = "http://localhost:5000/api/auto/listings";
    const params = new HttpParams()
    .set("per_page", 10)
    .set("page",this.paginaActual());

    this.http.get<any>(apiURL, { params }).pipe(

      map(response => {
        const lista = response?.data || [];
        return lista.filter((item: any) => item !== null);
      }),

      switchMap(async (lista) => {

        const promesas = lista.map(async (item:any) => {
          const direccion = Array.isArray(item.location)
            ? await this.ResolverCoordenadas(item.location[0], item.location[1])
            : 'Ubicación desconocida';
          const autoLimpio: AutoListing = {
            vin: item.vin,
            make: item.make ?? 'Sin datos',
            model: item.model ?? 'Sin datos',
            transmission: item.transmission ?? 'Sin datos',
            fuel: item.fuel ?? 'Sin datos',
            engine: item.engine ?? 'Sin datos',
            drivetrain: item.drivetrain ?? 'Sin datos',
            doors: item.doors ?? '0',
            seats: item.seats ?? '0',
            direction: direccion
          };

          return autoLimpio;
        });

        return Promise.all(promesas);
      })
    )
    .subscribe({
      next: (data) => {
        this.dataList.set(data);
      },
      error: (err) => console.error("Error al cargar:", err)
    });
  }

  ngOnDestroy(): void {
    this.queryParam.guardarRuta();
    ("Guardando ruta");
  }

}

export default CatalogPage;



