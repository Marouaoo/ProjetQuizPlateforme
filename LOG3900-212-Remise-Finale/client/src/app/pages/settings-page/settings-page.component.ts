import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AccountSettingsComponent } from '@app/components/account-settings/account-settings.component';
import { HistorySettingsComponent } from '@app/components/history-settings/history-settings.component';
import { StatsSettingsComponent } from '@app/components/stats-settings/stats-settings.component';
import { TopbarComponent } from '@app/components/topbar/topbar.component';
import { UserService } from '@app/services/account/user.service';
import {TranslateModule, TranslateService} from "@ngx-translate/core"; 

@Component({
  standalone: true,
  imports: [ StatsSettingsComponent, HistorySettingsComponent, AccountSettingsComponent, TopbarComponent, TranslateModule ],
  selector: 'app-settings-page',
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.scss']
})

export class SettingsPageComponent {
  constructor( 
    private readonly translate: TranslateService,
    private readonly router: Router,
    private readonly userService: UserService)
    {
      this.translate.setDefaultLang('fr');
	    this.translate.use(this.userService.user.language);
    }

    goBack(): void {
      this.router.navigate(['/home']);
    }
}
