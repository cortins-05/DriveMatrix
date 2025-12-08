import { Component, inject, OnInit, signal } from '@angular/core';
import { TableData } from '../../shared/components/tableData/tableData';
import { HttpClient, HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-catalog-page',
  imports: [TableData],
  templateUrl: './catalog-page.html',
})
export class CatalogPage implements OnInit {
  http = inject(HttpClient);

  ngOnInit(): void {
    this.loadData();
  }

  dataList=signal([]);

  loadData(){
    const apiURL = "http://localhost:5000/api/auto/listings";
    const params = new HttpParams()
    .set("per_page",20);
    this.http.get<any>(apiURL,{params:params}).subscribe({
      next: (data)=>{
        this.dataList.set(data["data"]);
        console.log(this.dataList());
      },
      error: (err)=>{
        console.error("Error al cargar los datos:", err);
      }
    })
  }
}

export default CatalogPage;
