import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

const loginURL = "http://localhost:5000/api/user/login";

const registerURL = "http://localhost:5000/api/user/create";

@Injectable({providedIn: 'root'})
export class AuthService {
  private http = inject(HttpClient);

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
}
