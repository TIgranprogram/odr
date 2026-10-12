import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <h1>Login</h1>
      <form (submit)="onLogin()">
        <input type="text" [(ngModel)]="username" name="username" placeholder="Username" required><br>
        <input type="password" [(ngModel)]="password" name="password" placeholder="Password" required><br>
        <button type="submit">Login</button>
      </form>
    </div>
  `,
  styles: [`
    .login-container { max-width: 400px; margin: 100px auto; padding: 20px; border: 1px solid #ccc; border-radius: 8px; }
    input { width: 100%; margin-bottom: 10px; padding: 8px; }
    button { width: 100%; padding: 10px; background: #007bff; color: white; border: none; cursor: pointer; }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  onLogin() {
    console.log('Login attempt:', this.username);
  }
}
