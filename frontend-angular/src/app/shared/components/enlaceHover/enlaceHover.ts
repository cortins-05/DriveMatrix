import { Component, input } from '@angular/core';

@Component({
  selector: 'enlace-hover',
  imports: [],
  templateUrl: './enlaceHover.html',
})
export class EnlaceHover {
  nombre = input.required<string>();
}
