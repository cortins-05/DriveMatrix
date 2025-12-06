import Swiper from 'swiper';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { AfterViewInit, Component, ElementRef, input, viewChild, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'swiper-carousel',
  imports: [],
  templateUrl: './swiperCarousel.html',
})
export class SwiperCarousel implements AfterViewInit {
  images_path = input.required<string[]>();
  direction = input.required<'horizontal'|'vertical'>();
  height = input.required<string>();
  width = input.required<string>();

  swiperDiv = viewChild.required<ElementRef>("swiperDiv");

  ngAfterViewInit(): void {
    const element = this.swiperDiv().nativeElement;
    element.style.width = this.width();
    element.style.height = this.height();
    if (!element) return;

    // 1. Inicializar Swiper
    const swiper = new Swiper(".swiper", {
      modules: [Pagination],
      direction: this.direction(),
      rewind: true,
      pagination: {
        el: '.swiper-pagination',
        clickable: true
      }
    });

    // 2. Esperar a que Angular pinte el DOM (microtarea)
    Promise.resolve()
      .then(() => this.waitForRenderedImages(element))
      .then((maxHeight) => {
        if (maxHeight > 0) {
          element.style.setProperty('--swiper-pagination-top', `${maxHeight + 1}px`);
        }
      });
  }


  // *********************************************************
  // PROMESA: Espera a que se rendericen las imágenes del DOM
  // y a que cada imagen haya terminado de cargar.
  // *********************************************************

  private waitForRenderedImages(container: HTMLElement): Promise<number> {
    return new Promise((resolve) => {

      const images: HTMLImageElement[] =
        Array.from(container.querySelectorAll('img'));

      if (images.length === 0) {
        resolve(0);
        return;
      }

      // Promesas individuales por cada imagen
      const imageLoadPromises = images.map(img =>
        new Promise<void>((res) => {

          // Si ya está cargada → resolver
          if (img.complete && img.naturalHeight !== 0) {
            res();
            return;
          }

          // Esperar evento load
          img.onload = () => res();

          // En caso de error, también resolver para no bloquear
          img.onerror = () => res();
        })
      );

      // Cuando TODAS las imágenes han terminado de cargarse…
      Promise.all(imageLoadPromises).then(() => {
        // ... ahora sí medir alturas renderizadas
        const heights = images.map(img => img.clientHeight || 0);
        resolve(Math.max(...heights));
      });

    });
  }

}
