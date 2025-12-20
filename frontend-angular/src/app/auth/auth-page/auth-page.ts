import { Component, inject, signal } from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faAddressCard, faKey, faPerson } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'auth-page',
  imports: [ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './auth-page.html',
})
export class AuthPage{

  fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);

  loginHasError = signal(false);
  registerHasError = signal(false);

  /* Toggle Del CheckBox */
  openSection: 'login' | 'register' | null = null;

  toggleSection(section: 'login' | 'register') {
    this.openSection = this.openSection === section ? null : section;
  }

  loginForm = this.fb.group({
    email: ['', [Validators.required,Validators.email] ],
    password: ['', [Validators.required,Validators.minLength(6)] ]
  })

  registerForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required,Validators.email] ],
    password: ['', [Validators.required,Validators.minLength(6)]]
  })


  onLoginSubmit(){
    if(this.loginForm.invalid){
      this.loginHasError.set(true);
      setTimeout(()=>{
        this.loginHasError.set(false);
      },2000);
      return;
    }
    let email = this.loginForm.value.email!;
    let pass = this.loginForm.value.password!;
    this.authService.login(email,pass).subscribe({
      next: (response)=>{
        localStorage.setItem('token',response.token);
        this.authService.checkStatus();
        this.router.navigateByUrl('/');
      },
      error: (err)=>{
        console.error('Error en el login');
        this.loginHasError.set(true);
        setTimeout(()=>{
          this.loginHasError.set(false);
        },2000);
      }
    })
  }

  onRegisterSubmit(){
    if(this.registerForm.invalid){
      this.registerHasError.set(true);
      setTimeout(()=>{
        this.registerHasError.set(false);
      },2000);
      return;
    }else{
      let name = this.registerForm.value.name!;
      let email = this.registerForm.value.email!;
      let pass = this.registerForm.value.password!;
      this.authService.register(name,email,pass).subscribe({
        next: (response)=>{
          this.authService.login(email,pass).subscribe({
            next: (response)=>{
              localStorage.setItem('token',response.token);
              this.router.navigateByUrl('/');
            }
          })
        },
        error: (err)=>{
          console.error('Error en el registro');
          this.registerHasError.set(true);
          setTimeout(()=>{
            this.registerHasError.set(false);
          },2000);
        }
      })
    }
  }


  /* FontAwesome */
  userIcon = faPerson;
  emailIcon = faAddressCard;
  passwordIcon = faKey;
}
