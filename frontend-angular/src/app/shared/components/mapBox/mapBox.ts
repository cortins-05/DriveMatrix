import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, inject, input, OnDestroy, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { MapBoxService } from '../../../core/services/mapBox.service';

@Component({
  selector: 'app-map-box',
  imports: [],
  standalone: true,
  templateUrl: './mapBox.html'
})
export class MapBox implements OnInit, OnDestroy{
  mapBoxService = inject(MapBoxService);
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  map: any;
  private platformId = inject(PLATFORM_ID);

  coords = input.required<number[]>();

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const mapboxgl = (await import('mapbox-gl')).default
      this.map = new mapboxgl.Map({
        accessToken: this.mapBoxService.accessToken,
        container: this.mapContainer.nativeElement,
        center: [this.coords()[0], this.coords()[1]],
        zoom: 10,
      });

      const lng = this.coords()[0];
      const lat = this.coords()[1];

      new mapboxgl.Marker({
        color: '#FF0000',
      })
      .setLngLat([lng,lat])
      .addTo(this.map);
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}
