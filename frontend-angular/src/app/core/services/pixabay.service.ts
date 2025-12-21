import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map } from 'rxjs';

const API_KEY = "53738006-e3a16a287bce2af1a189a48e1";

@Injectable({providedIn: 'root'})
export class PixabayService {
  http = inject(HttpClient);

  url = "https://pixabay.com/api/";

  images = signal<string|string[]|null>(null);

  searchImages(query: string, slice: number) {
    const parameters = new HttpParams()
      .set('key', API_KEY)
      .set('q', query)
      .set('orientation', 'horizontal')
      .set('image_type', 'photo');

    return this.http.get<any>(this.url, { params: parameters }).pipe(
      map(response => {
        if (!response?.hits || !Array.isArray(response.hits)) {
          return [];
        }

        const hits = response.totalHits > slice
          ? response.hits.slice(0, slice)
          : response.hits;

        return hits.map((hit: any) => hit.largeImageURL);
      })
    )
  }



}
