import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '@app/services/account/user.service';

export const authGuard: CanActivateFn = (route, state) => {
    const userService = inject(UserService);
    const router = inject(Router);

    if (userService.userId !== '') {
        return true;
    } else {
        router.navigate(['/home']);
        return false;
    }
};
