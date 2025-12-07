import Swiper from 'swiper';
import { Autoplay, EffectCoverflow, EffectCreative, Pagination } from 'swiper/modules';
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

  swiperDiv = viewChild.required<ElementRef>("swiperDiv");

  ngAfterViewInit(): void {
    const element = this.swiperDiv().nativeElement;
    if (!element) return;

    // 1. Inicializar Swiper
    const swiper = new Swiper(element, {
      modules: [Autoplay, Pagination, EffectCoverflow], // 👈 Nuevo módulo

      direction: this.direction(),
      loop: true,
      speed: 800, // Transición rápida

      // LA MAGIA: Coverflow Effect
      effect: 'coverflow',
      coverflowEffect: {
        rotate: 50,    // Grados de rotación (inclinación) de las cartas
        stretch: 0,    // Distancia entre cartas (0 para que se toquen visualmente)
        depth: 100,    // Cuán lejos se mueven del observador
        modifier: 1,   // Multiplicador general de los valores
        slideShadows: false, // Añade sombra para mejorar la sensación 3D
      },

      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },

      autoplay: {
        delay: 3500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      }
    });
  }

}
