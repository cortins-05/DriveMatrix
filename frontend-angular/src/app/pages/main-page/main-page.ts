import { Component, inject } from '@angular/core';
import { SwiperCarousel } from '../../shared/components/swiperCarousel/swiperCarousel';
import { AuthService } from '../../auth/auth.service';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-main-page',
  imports: [SwiperCarousel,TitleCasePipe],
  templateUrl: './main-page.html',
})
export class MainPage {
  authService = inject(AuthService);
}
