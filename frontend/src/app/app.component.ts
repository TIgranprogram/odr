import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Корневой компонент. Вся «обвязка» (sidebar/header) — в ShellComponent,
 * который грузится лениво внутри маршрутов; здесь только точка входа роутера.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
})
export class AppComponent {}
