import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {faSun, faMoon} from '@fortawesome/free-solid-svg-icons';
import { EnlaceHover } from '../../../shared/components/enlaceHover/enlaceHover';

@Component({
  selector: 'app-navbar',
  imports: [FontAwesomeModule,EnlaceHover],
  templateUrl: './navbar.html'
})
export class Navbar {
  constructor() {
    this.loadTheme();
  }

  private loadTheme() {
    const theme = localStorage.getItem("theme") || "luxury";
    document.documentElement.setAttribute("data-theme", theme);
  }

  toggleTheme() {
    const theme = localStorage.getItem("theme") || "luxury";
    const newTheme = theme === "luxury" ? "corporate" : "luxury";
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  }

  //FontAwesome
  faSun = faSun;
  faMoon = faMoon;
}
