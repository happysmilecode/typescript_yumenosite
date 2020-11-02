import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanDeactivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { User } from '../models/user.model';
import { UserService } from '../services/user.service';
import { Observable } from 'rxjs';

export interface CanComponentDeactivate {
  canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
}

@Injectable({
  providedIn: 'root',
})

export class AuthGuard implements CanActivate , CanDeactivate<CanComponentDeactivate>{
  constructor(private userService: UserService, private router: Router) {}

  userDb : User;
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const user: User = this.userService.getCurrentUser();
    if (!user || !user._id) {
      this.router.navigateByUrl('/signup');
      return false;
    }
    return true;
  }

  canDeactivate(
    component: CanComponentDeactivate,
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
    ){
    return component.canDeactivate() ? 
      true:
      true
  }
}
