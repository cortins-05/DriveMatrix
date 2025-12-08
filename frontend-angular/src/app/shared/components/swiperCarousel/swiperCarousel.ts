import Swiper from 'swiper';
import { Autoplay, EffectCoverflow, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { AfterViewInit, Component, ElementRef, input, viewChild } from '@angular/core';
import { faL } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'swiper-carousel',
  imports: [],
  templateUrl: './swiperCarousel.html',
  styles: `
    :host {
      display: block;
      position: relative;
    }
    .swiper {
      width: 100%;
      height: 100%;
    }
  `
})
export class SwiperCarousel implements AfterViewInit {
  images_path = input.required<string[]>();
  direction = input.required<'horizontal'|'vertical'>();
  speed = input.required<number>();
  pagination = input.required<boolean>();

  swiperDiv = viewChild.required<ElementRef>("swiperDiv");

  ngAfterViewInit(): void {
    const element = this.swiperDiv().nativeElement;
    if (!element) return;

    const config: any = {
      modules: [Autoplay, EffectCoverflow],
      direction: this.direction(),
      loop: true,
      speed: 700,
      effect: 'coverflow',
      coverflowEffect: {
        rotate: 50,
        stretch: 0,
        depth: 100,
        modifier: 1,
        slideShadows: false,
      },
      autoplay: {
        delay: this.speed(),
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      }
    };

    if (this.pagination()) {
      config.modules.push(Pagination);
      config.pagination = {
        el: '.swiper-pagination',
        clickable: true
      };
    }

    new Swiper(element,config);
  }
}
