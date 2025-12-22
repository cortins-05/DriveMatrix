import { inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

const PAGE_STORAGE_KEY = 'catalog_current_page';

@Injectable({providedIn: 'root'})
export class QueryParamService {
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);

  paginaActual = signal<number>(Number(localStorage.getItem(PAGE_STORAGE_KEY)) ?? 1);
  constructor() {
    this.activatedRoute.queryParamMap.pipe(
      map(params => {
        const pageParam = params.get("page");
        const page = Number(pageParam);
        return (!pageParam || isNaN(page) || page <= 1) ? 1 : page;
      })
    ).subscribe(pageNumber => {
      this.paginaActual.set(pageNumber);
    });
  }

  nextPage(){
    const currentPage = this.paginaActual();
    if(currentPage > 50) return;
    const newPage = currentPage + 1;
    this.paginaActual.set(this.paginaActual()+1);

    this.router.navigate(
      [],
      {
        relativeTo: this.activatedRoute,
        queryParams:{ page: newPage },
        queryParamsHandling: 'merge'
      }
    );
  }

  previousPage(){
    const currentPage = this.paginaActual()-1;

    if (currentPage < 1){
      return;
    }
    this.paginaActual.set(this.paginaActual()-1);

    this.router.navigate(
      [],
      {
        relativeTo: this.activatedRoute,
        queryParams:{ page: currentPage },
        queryParamsHandling: 'merge'
      }
    );
  }

  guardarRuta(){
    localStorage.setItem(PAGE_STORAGE_KEY,String(this.paginaActual()));
  }
}
