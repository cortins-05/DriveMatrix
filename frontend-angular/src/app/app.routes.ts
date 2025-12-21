import { Routes } from '@angular/router';
import { MainPage } from './pages/main-page/main-page';
import { AboutPage } from './pages/about-page/about-page';
import { AuthPage } from './auth/auth-page/auth-page';
import { NotAuthenticatedGuard } from './auth/guards/not-autenticated.guard';

export const routes: Routes = [
  {
    path:'',
    component:MainPage
  },
  {
    path:'login',
    component:AuthPage
  },
  {
    path:'profile',
    loadComponent: ()=>import("./pages/profile-page/profile-page")
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
    loadComponent: ()=>import("./pages/vehicle-page/vehicle-page"),
    canMatch:[
      NotAuthenticatedGuard
    ]
  },
  {
    path:'purchases',
    loadComponent: ()=>import("./pages/purchases-page/purchases-page"),
    canMatch:[
      NotAuthenticatedGuard
    ]
  },
  {
    path:'cart',
    loadComponent: ()=>import("./pages/cart-page/cart-page"),
    canMatch:[
      NotAuthenticatedGuard
    ]
  },
  {
    path:'about',
    component:AboutPage
  },
  {
    path:'**',
    redirectTo:''
  }
];
