import { AfterViewInit, Component, inject, input, OnChanges, SimpleChanges, WritableSignal, signal } from '@angular/core';
import { MapBoxService } from '../../../core/services/mapBox.service';
// 💡 Importar from '@angular/core'
import { take } from 'rxjs';

declare var $:any;

@Component({
  selector: 'table-data',
  imports: [],
  standalone: true, // Asumiendo que es standalone
  templateUrl: './tableData.html',
  styles: `/* ... tus estilos ... */`
})
export class TableData implements AfterViewInit, OnChanges {

  private mapBoxService = inject(MapBoxService);

  // 💡 CAMBIO CLAVE: Usaremos una Señal para almacenar la caché de direcciones.
  // Esto no se usa para el renderizado directo, sino para monitorear y disparar.
  private locationCache: WritableSignal<{[key:string]:string}> = signal({});

  encabezados = input.required<string[]>();
  datos = input.required<any[]>();

  datatableInstance:any;

  ngOnChanges(changes: SimpleChanges): void {
    // Si los datos cambian, debemos limpiar la caché y re-renderizar.
    if(changes['datos'] && this.datos() && this.datos().length > 0){
      this.locationCache.set({}); // Limpiar caché al recibir nuevos datos
      this.fetchLocations(this.datos()); // Iniciar la carga de direcciones
    }
  }

  ngAfterViewInit(): void {
    // Si hay datos, renderiza la tabla inicialmente con placeholders.
    if(this.datos().length > 0) {
        this.renderTable(false);
    }
  }

  // 💡 NUEVO MÉTODO: Precarga todas las ubicaciones y actualiza la señal.
  private fetchLocations(data: any[]): void {
    // Aquí puedes optimizar para solo hacer peticiones por coordenadas únicas
    const coordinatesToFetch: string[] = [];

    data.forEach(item => {
        if (Array.isArray(item.location) && item.location.length >= 2) {
            const key = `${item.location[0]},${item.location[1]}`;
            if (!this.locationCache()[key]) {
                coordinatesToFetch.push(key);
            }
        }
    });

    coordinatesToFetch.forEach(key => {
        const [lngStr, latStr] = key.split(',');
        const lng = parseFloat(lngStr);
        const lat = parseFloat(latStr);

        // Usamos take(1) porque solo necesitamos la primera respuesta
        this.mapBoxService.reverseGeocode(lng, lat)
            .pipe(take(1))
            .subscribe({
                next: (res) => {
                    let address = 'Dirección no encontrada';
                    if (res.features && res.features.length > 0) {
                        address = res.features[0].place_name;
                    }

                    // 💡 Actualizamos la señal de caché (Gatillando un cambio)
                    this.locationCache.update(cache => ({
                        ...cache,
                        [key]: address
                    }));

                    // 💡 Disparar la actualización del DOM de DataTables.
                    // Esto es necesario porque DataTables no es nativo de Angular.
                    this.updateDataTableCell(key, address);
                },
                error: (err) => {
                    console.error('Error al geocodificar:', err);
                    this.locationCache.update(cache => ({
                        ...cache,
                        [key]: 'Error de API'
                    }));
                     this.updateDataTableCell(key, 'Error de API');
                }
            });
    });

    // Renderizar la tabla justo después de empezar las peticiones
    this.renderTable(false);
  }

  // 💡 NUEVO MÉTODO: Función auxiliar para actualizar la celda por ID
  private updateDataTableCell(key: string, address: string): void {
      // DataTables puede haber movido los elementos, pero el placeholder ID sigue siendo único.
      // Usamos jQuery para buscar y actualizar el texto.
      const sanitizedKey = key.replace(/[^a-zA-Z0-9]/g, '-');
      // Buscamos TODOS los spans que tengan esta clave (podrían ser varias páginas si se redibuja)
      $(`span[data-key="${sanitizedKey}"]`).text(address);
  }

  renderTable(destroy: boolean) {
    if ($ && $.fn.DataTable) {
      if (destroy && this.datatableInstance) {
        this.datatableInstance.destroy();
        // Nota: la caché se limpia en ngOnChanges/fetchLocations
      }

      const component = this;

      const columnConfig = this.encabezados().map(header => ({
        data: header,
        render: function(data: any, type: any, row: any) {
          if (type === "display") {
            // Manejo de valores nulos para otras columnas
            if (data == null) {
              return (header === "doors" || header === "seats") ? 0 : 'Sin datos';
            }

            // Lógica para la columna 'location'
            if (header === "location") {
              if (Array.isArray(data) && data.length >= 2) {
                const lng = data[0];
                const lat = data[1];
                const key = `${lng},${lat}`;

                // Buscar en la caché de la señal (síncrono)
                const cachedAddress = component.locationCache()[key];

                if (cachedAddress) {
                  // Si ya está en la caché (cargado), devolver la dirección
                  return cachedAddress;
                }

                // Si aún no está en caché, devolver el placeholder con una clave de datos única
                // para que updateDataTableCell pueda encontrarlo
                const sanitizedKey = key.replace(/[^a-zA-Z0-9]/g, '-');
                return `<span data-key="${sanitizedKey}">Cargando...</span>`;
              }
              return 'Coordenadas Inválidas';
            }
          }
          return data;
        }
      }));

      this.datatableInstance = $('#tabla').DataTable({
        // ... configuración del DataTable ...
        data: this.datos(),
        columns: columnConfig,
        ordering: true,
        info: false,
        stateSave: true,
        language:{
          search: "Buscar: ",
          emptyTable: "No hay registros disponibles."
        }
      });
    }
  }
}
