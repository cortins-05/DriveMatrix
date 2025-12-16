import { Routes } from '@angular/router';
import { MainPage } from './pages/main-page/main-page';
import { AboutPage } from './pages/about-page/about-page';
import { VehiclePage } from './pages/vehicle-page/vehicle-page';

export const routes: Routes = [
  {
    path:'',
    component:MainPage
  },
  {
    path:'catalog',
    loadComponent: ()=>import("./pages/catalog-page/catalog-page")
  },
  {
    path:'search',
    loadComponent: ()=>import("./pages/search-page/search-page")
  },
  {
    path:'vehicle',
    component: VehiclePage
  },
  {
    path:'about',
    component:AboutPage
  }
];
