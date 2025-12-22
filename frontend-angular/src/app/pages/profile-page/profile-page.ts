import { Component, effect, inject, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faAddressCard, faKey, faPerson } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../auth/auth.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Valoration } from '../../shared/components/valoration/valoration';

@Component({
  selector: 'app-profile-page',
  imports: [FontAwesomeModule,ReactiveFormsModule,Valoration],
  templateUrl: './profile-page.html',
})
export class ProfilePage {
  authService = inject(AuthService);
  fb = inject(FormBuilder);

  user = signal(this.authService.user()?.user);

  constructor(){
    effect(()=>{
      this.user.set(this.authService.user()?.user);
    })
  }

  formHasError = signal(false);

  profileUpdated = signal<boolean>(false);

  updateForm = this.fb.group({
    nombre: [this.user()!.nombre,[Validators.required]],
    email: [this.user()!.email,[Validators.required,Validators.email]],
    pass: ['',[Validators.minLength(6)]]
  });


  onUpdateSubmit(){
    if(this.updateForm.invalid){
      this.formHasError.set(true);
      setTimeout(()=>{
        this.formHasError.set(false);
      },2000);
      return;
    }
    let nombre = this.updateForm.value.nombre!;
    let email = this.updateForm.value.email!;
    let pass = this.updateForm.value.pass!;
    let actualizar;
    if(pass==''){
      actualizar = this.authService.updateProfile(this.user()!._id!,nombre,email,null);
    }else{
      actualizar = this.authService.updateProfile(this.user()!._id!,nombre,email,pass);
    }
    actualizar?.subscribe({
      next: (resp)=>{
        this.authService.checkStatus();
        this.profileUpdated.set(true);
        setTimeout(()=>{
          this.profileUpdated.set(false);
        },2000);
      },
      error: (err)=>{
        (err);
      }
    })
  }

  /* FontAwesome */
  userIcon = faPerson;
  emailIcon = faAddressCard;
  passwordIcon = faKey;
}

export default ProfilePage;
