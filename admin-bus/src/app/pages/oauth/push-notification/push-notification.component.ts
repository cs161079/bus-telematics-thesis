import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormsModule, NgForm, ReactiveFormsModule } from "@angular/forms";
import { AlertType, NotificationRec } from "../../../models/models.interface";
import { BackendService } from "../../../service/backend.service";
import { GeneralSerivce } from "../../../service/general.service";
import { MatButtonModule } from '@angular/material/button';
import { ThemeService } from "../../../service/theme.service";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";


@Component({
  selector: "app-pushnotification",
  templateUrl: "push-notification.component.html",
  imports: [FormsModule, MatButtonModule, CommonModule],
  standalone: true,
  styleUrl: "push-notification.component.scss"
})
export class PushNotificationComponent implements OnInit {
  dt: NotificationRec = {
    alertType: AlertType.INFO,
    title: "",
    message: ""
  };

  constructor(
    private formBuilder: FormBuilder,
    private backendService: BackendService,
    private generalService: GeneralSerivce,
    public themeSrv: ThemeService,
    private router: Router
  ) {

  }

  ngOnInit(): void {

  }

  onSubmit(form: NgForm) {
    if(form.valid) {
      console.log(form.value);
      this.backendService.pushNotification(form.value).subscribe(
        (results) => {

        },
        (error) => {
          this.generalService.showDangerAlert(error.error);
        },
        () => {
          this.generalService.showInfoAlert("Notification Pushed succefully!")
          form.reset({
            alertType: AlertType.INFO
          });
        }
      );
    } else {
      this.generalService.showDangerAlert("Form is not valid!");
      console.log("Form is not valid!!!");
    }


  }

  onModeChange(ev: any) {
    console.log("Checkbox changed ", ev);
    this.themeSrv.toggleTheme(ev.target.checked);
  }

  goToJobs(ev: any) {
    this.router.navigate(["/jobs"]);
  }
}
