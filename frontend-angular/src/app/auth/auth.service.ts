import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

const loginURL = "http://localhost:5000/api/user/login";

const registerURL = "http://localhost:5000/api/user/create";

const checkURL = "http://localhost:5000/api/user/checkToken";

type AuthStatus = 'checking'|'authenticated'|'not-authenticated';

@Injectable({providedIn: 'root'})
export class AuthService {
  private http = inject(HttpClient);

  private _authStatus = signal<AuthStatus>('checking');
  private _user = signal<User|null>(null)
  private _token = signal<string|null>(localStorage.getItem('token'));

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

    return this.http.get(checkURL, httpOptions)
    .subscribe({
      next: resp=>{
        console.log(resp);
        this.isAuthenticated.set(true);
      },
      error: err=>{
        console.error(err);
        this.isAuthenticated.set(false);
      }
    });
  }


  logout(){
    this._authStatus.set('not-authenticated');
    this._user.set(null);
    this._token.set(null);
    this.isAuthenticated.set(false);
    localStorage.removeItem('token');
  }
}
