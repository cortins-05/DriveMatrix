import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, map, switchMap } from 'rxjs';
import { AutoListing } from '../../core/interfaces/Autolisting.interface';
import { MapBoxService } from '../../core/services/mapBox.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-catalog-page',
  imports: [],
  templateUrl: './catalog-page.html',
})
export class CatalogPage implements OnInit {
  http = inject(HttpClient);
  mapbox = inject(MapBoxService);
  activatedRoute = inject(ActivatedRoute);

  paginaActual = signal<number>(1);

  ngOnInit(): void {
    this.activatedRoute.queryParamMap.subscribe(params => {
      const pageParam = params.get("page");
      const page = Number(pageParam);

      if (!pageParam || isNaN(page) || page < 1) {
        this.paginaActual.set(1);
      } else {
        this.paginaActual.set(page);
      }

      console.log('Página actual desde URL:', this.paginaActual());

      this.loadData();
    });
  }

  dataList=signal<AutoListing[]>([]);

  async ResolverCoordenadas(lat: number, lon: number): Promise<string> {
    try {
    // Convertimos el Observable a Promesa y esperamos el primer valor
      const data = await firstValueFrom(this.mapbox.reverseGeocode(lat, lon));

      // Asumiendo que Mapbox devuelve el formato estándar (features[0].place_name)
      // Ajusta esto según lo que devuelva exactamente tu servicio mapbox.reverseGeocode
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

    // 1. Tipamos el GET como 'any' porque la API devuelve location como array,
    // pero nosotros queremos devolver 'AutoListing[]' al final.
    this.http.get<any>(apiURL, { params }).pipe(

      // Paso 1: Limpieza básica (síncrona)
      map(response => {
        const lista = response?.data || [];
        return lista.filter((item: any) => item !== null);
      }),

      // Paso 2: Transformación asíncrona (Coordenadas -> Texto)
      // Le decimos a switchMap: "Entra un array cualquiera, sale una Promesa de AutoListing[]"
      switchMap(async (lista) => {

        const promesas = lista.map(async (item:any) => {
          // Resolvemos la ubicación
          const direccion = Array.isArray(item.location)
            ? await this.ResolverCoordenadas(item.location[0], item.location[1])
            : 'Ubicación desconocida';

          // Construimos el objeto final LIMPIO usando la interfaz
          const autoLimpio: AutoListing = {
            make: item.make ?? 'Sin datos',
            model: item.model ?? 'Sin datos',
            transmission: item.transmission ?? 'Sin datos',
            fuel: item.fuel ?? 'Sin datos',
            engine: item.engine ?? 'Sin datos',
            drivetrain: item.drivetrain ?? 'Sin datos',
            doors: item.doors ?? '0',
            seats: item.seats ?? '0',
            location: direccion // Aquí asignamos el string resuelto
          };

          return autoLimpio;
        });

        return Promise.all(promesas);
      })
    )
    .subscribe({
      next: (data) => {
        this.dataList.set(data);
        console.log("Datos listos:", this.dataList());
      },
      error: (err) => console.error("Error al cargar:", err)
    });
  }
}

export default CatalogPage;



