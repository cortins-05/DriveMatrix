import { Component, ElementRef, inject, signal, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { CarsTable } from '../../shared/components/carsTable/carsTable';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, map, switchMap } from 'rxjs';
import { AutoListing } from '../../core/interfaces/Autolisting.interface';
import { QueryParamService } from '../../core/services/queryParam.service';
import { MapBoxService } from '../../core/services/mapBox.service';

@Component({
  selector: 'app-search-page',
  imports: [FontAwesomeModule, CarsTable],
  templateUrl: './search-page.html',
})
export class SearchPage {
  mapbox = inject(MapBoxService);
  queryParam = inject(QueryParamService);
  http = inject(HttpClient);

  dataList = signal<AutoListing[]>([]);
  paginaActual = signal(0);

  filtroValor = signal<any>(["make"]);
  textInputValue = ["make","model","engine"];
  numberInputValue = ["doors","seats"];
  valorFiltro = signal<any>("");

  setearSelect(e:Event){
    this.valorFiltro.set((e.target as HTMLSelectElement).value);
  }

  setearValorInput(e:Event){
    this.valorFiltro.set((e.target as HTMLInputElement).value);
  }

  buscado = signal(false);

  lupa = faMagnifyingGlass;

  onChange(e:Event){
    let valorEvento = (e.target as HTMLSelectElement).value;
    let añadidos;
    switch (valorEvento){
      case "transmission":
        añadidos=[
          "Automated Manual",
          "Manual",
          "Automatic"
        ]
        break;
      case "fuel":
        añadidos=[
          "Premium Unleaded (Recommended)",
          "Diesel",
          "Electric"
        ]
        break;
      case "drivetrain":
        añadidos=[
          "FWD",
          "AWD"
        ]
        break;
    }
    this.filtroValor.set([valorEvento, añadidos]);
  }

  buscar(): void {
    this.loadData();
    this.buscado.set(true);
  }

  nextPage(){
    if(this.paginaActual()>(this.dataList().length/10)-1) return;
    this.paginaActual.set(this.paginaActual()+1);
  }

  previousPage(){
    if(this.paginaActual()<=0) return;
    this.paginaActual.set(this.paginaActual()-1);
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
    const apiURL = "http://localhost:5000/api/auto/listings/filter";
    const params = new HttpParams()
    .set(this.filtroValor()[0], this.valorFiltro());
    this.http.get<any>(apiURL, { params }).pipe(
      map(response => {
        const lista = response || [];
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
            direction: direccion,
            price: item.price
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
}

export default SearchPage;
