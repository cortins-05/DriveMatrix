import { Component, effect, inject, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMoon,faMagnifyingGlass, faPerson } from '@fortawesome/free-solid-svg-icons';
import { EnlaceHover } from '../../../shared/components/enlaceHover/enlaceHover';
import { RouterLink } from "@angular/router";
import { QueryParamService } from '../../services/queryParam.service';
import { AuthService } from '../../../auth/auth.service';
import { AuthPage } from '../../../auth/auth-page/auth-page';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [FontAwesomeModule, EnlaceHover, RouterLink,TitleCasePipe],
  templateUrl: './navbar.html'
})
export class Navbar {
  current_theme = signal<"luxury"|"corporate">("luxury");
  queryParam = inject(QueryParamService);
  valorCatalogPage = this.queryParam.paginaActual;

  authService = inject(AuthService);

  isAutenticated = this.authService.isAuthenticated;

  catalogPage = signal(localStorage.getItem("catalog_current_page") ?? this.valorCatalogPage() ?? 1);

  constructor() {
    this.current_theme.set(this.loadTheme());
    this.authService.checkStatus();
    effect(()=>{
      this.catalogPage.set(localStorage.getItem("catalog_current_page") ?? this.valorCatalogPage() ?? 1);
    })
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

  faMoon = faMoon;
  lupa = faMagnifyingGlass;
  userIcon = faPerson;
}
