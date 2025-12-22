import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { tokenInterface, User, UserResponse } from './interfaces/auth.interfaces';
import { CartService } from '../core/services/cart.service';

const loginURL = "http://localhost:5000/api/user/login";

const registerURL = "http://localhost:5000/api/user/create";

const updateURL = "http://localhost:5000/api/user/update/";

const checkURL = "http://localhost:5000/api/user/checkToken";

type AuthStatus = 'checking'|'authenticated'|'not-authenticated';

@Injectable({providedIn: 'root'})
export class AuthService {
  private http = inject(HttpClient);

  private _authStatus = signal<AuthStatus>('checking');
  user = signal<UserResponse|null>(null)
  private _token = signal<string|null>(localStorage.getItem('token'));

  router = inject(Router);
  cartService = inject(CartService);

  isAuthenticated = signal(false);

  login(email:string,pass:string){
    const body = {
      "email": email,
      "password": pass
    }
    return this.http.post<tokenInterface>(loginURL,body);
  }

  register(nombre:string,email:string,pass:string){
    const body = {
      "nombre": nombre,
      "email": email,
      "password": pass
    }
    return this.http.post(registerURL,body);
  }

  updateProfile(id:string,nombre:string,email:string,newPass:string|null){

    const token = localStorage.getItem('token');

    if (!token) {
      this.logout();
      this.isAuthenticated.set(false);
      return of(false);
    }

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Authorization': token
      })
    }

    if(id=='') return;
    if(nombre=='') nombre==this.user()?.user.nombre;
    if(email=='') email==this.user()?.user.email;

    let body;

    if(newPass){
      body = {
        "nombre": nombre,
        "email": email,
        "password": newPass
      }
    }else{
      body = {
        "nombre": nombre,
        "email": email
      }
    }

    return this.http.patch(updateURL.concat(id),body,httpOptions);
  }

  checkStatus(){
    const token = localStorage.getItem('token');

    if (!token) {
      this.logout();
      this.isAuthenticated.set(false);
      return of(false);
    }

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Authorization': token
      })
    }

    return this.http.get<UserResponse>(checkURL, httpOptions)
    .subscribe({
      next: resp=>{
        this.isAuthenticated.set(true);
        this.user.set(resp);
      },
      error: err=>{
        this.isAuthenticated.set(false);
      }
    });
  }

  showUser(idOrEmail:string){
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    }
    return this.http.post<User>('http://localhost:5000/api/user/show',{ "emailOrId": idOrEmail },httpOptions);
  }

  logout(){
    this._authStatus.set('not-authenticated');
    this.user.set(null);
    this._token.set(null);
    this.isAuthenticated.set(false);
    localStorage.removeItem('token');
    this.cartService.clear();
    this.router.navigateByUrl('/');
  }
}
