import { Component, computed, input, OnInit, signal } from '@angular/core';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'cars-table-component',
  imports: [RouterLink],
  templateUrl: './carsTable.html',
})
export class CarsTable {
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
