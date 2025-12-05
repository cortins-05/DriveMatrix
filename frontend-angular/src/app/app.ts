import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  setTheme() {
    let theme = localStorage.getItem("theme") ? localStorage.getItem("theme") : document.documentElement.getAttribute("data-theme");
    document.documentElement.setAttribute('data-theme', theme!);
    localStorage.setItem('theme', theme!);
  }

}
