import { Component, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {faSun, faMoon} from '@fortawesome/free-solid-svg-icons';
import { EnlaceHover } from '../../../shared/components/enlaceHover/enlaceHover';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-navbar',
  imports: [FontAwesomeModule, EnlaceHover, RouterLink],
  templateUrl: './navbar.html'
})
export class Navbar {
  current_theme = signal<"luxury"|"corporate">("luxury");

  constructor() {
    this.current_theme.set(this.loadTheme());
  }

  private loadTheme():"luxury"|"corporate" {
    const saved = localStorage.getItem("theme");
    const theme = saved === "luxury" || saved === "corporate" ? saved : "luxury";
    document.documentElement.setAttribute("data-theme", theme);
    return theme;
  }

  toggleTheme() {
    const theme = localStorage.getItem("theme") || "luxury";
    const newTheme = theme === "luxury" ? "corporate" : "luxury";
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    this.current_theme.set(newTheme);
  }

  //FontAwesome
  faSun = faSun;
  faMoon = faMoon;
}
