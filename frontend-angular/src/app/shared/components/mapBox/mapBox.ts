import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { MapBoxService } from '../../../core/services/mapBox.service';

@Component({
  selector: 'app-map-box',
  imports: [],
  standalone: true,
  templateUrl: './mapBox.html',
  styleUrls: ['./mapBox.css']
})
export class MapBox implements OnInit, OnDestroy{
  mapBoxService = inject(MapBoxService);
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  map: any;
  private platformId = inject(PLATFORM_ID);

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const mapboxgl = (await import('mapbox-gl')).default


      this.map = new mapboxgl.Map({
        accessToken: this.mapBoxService.accessToken,
        container: this.mapContainer.nativeElement,
        center: [-98.54818, 40.00811],
        zoom: 4,
      });
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}
