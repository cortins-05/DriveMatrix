import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from "@angular/router";
import { AuthService } from '../../../auth/auth.service';
import { PixabayService } from '../../../core/services/pixabay.service';
import { map } from 'rxjs';

@Component({
  selector: 'cars-table-component',
  imports: [RouterLink],
  templateUrl: './carsTable.html',
})
export class CarsTable {

  authService = inject(AuthService);
  pixabay = inject(PixabayService);

  dataList = input.required<any[]>();
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

}
