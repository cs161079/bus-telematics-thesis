import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private _isDarkMode!: BehaviorSubject<boolean>;
  private themeKey = 'app-theme';

  constructor() {
    this._isDarkMode = new BehaviorSubject<boolean>(false);
    const savedTheme = localStorage.getItem(this.themeKey);
    this.setTheme(savedTheme || 'light-theme');
  }

  get isDarkMode() {
    return this._isDarkMode;
  }

  setTheme(theme: 'light-theme' | 'dark-theme' | string) {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(theme);
    localStorage.setItem(this.themeKey, theme);
    this._isDarkMode.next(theme == 'dark-theme');
  }

  toggleTheme(darkMode: boolean) {
    const next = darkMode ? 'dark-theme' : 'light-theme';
    // const current = document.body.classList.contains('dark-theme') ? 'dark-theme' : 'light-theme';

    this.setTheme(next);
  }
}
