import { Component, input } from '@angular/core';

@Component({
  selector: 'cars-table-component',
  imports: [],
  templateUrl: './carsTable.html',
})
export class CarsTable {
  dataList = input.required<any[]>();
}
