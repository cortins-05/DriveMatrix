import { Component, computed, inject, input, OnInit, signal, effect } from '@angular/core';
import { RouterLink } from "@angular/router";
import { AuthService } from '../../../auth/auth.service';
import { PixabayService } from '../../../core/services/pixabay.service';
import { QueryParamService } from '../../../core/services/queryParam.service';

@Component({
  selector: 'cars-table-component',
  imports: [RouterLink],
  templateUrl: './carsTable.html',
})
export class CarsTable {

  authService = inject(AuthService);
  pixabay = inject(PixabayService);

  dataList = input.required<any[]>();
  imageList = signal<any[]>([]);
  pagination = input(false);

  page = input(0);

  paginatedData:any = computed(() => {
    const data = this.dataList();

    if (!this.pagination()) {
      return data;
    }

    const size = 10;
    const result: any[][] = [];

    for (let i = 0; i < data.length; i += size) {
      result.push(data.slice(i, i + size));
    }

    return result[this.page()];
  });


  constructor(){
    effect(() => {
      const data = this.paginatedData();

      if (!data || data.length === 0) {
        this.imageList.set([]);
        return;
      }

      this.cargarImagenes(data);
      console.log(this.imageList());
    });
  }

  cargarImagenes(listaCoches:any[]){
    console.log(listaCoches);
    let lista_temporal:any[]=[];
    for(let coche of listaCoches){
      this.pixabay.searchImages(`${coche.make} ${coche.model} car`,1)
      .subscribe(resp=>{
        lista_temporal.push(resp);
      })
    }
    this.imageList.set(lista_temporal);
  }

}
