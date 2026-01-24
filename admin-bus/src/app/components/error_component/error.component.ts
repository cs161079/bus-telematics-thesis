import { Component } from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";

@Component({
  selector: "app-error",
  templateUrl: "error.component.html",
  styleUrl: "error.component.scss",
})
export class ErrorComponent {
  errorDescr?: string;
  constructor(
    public bsModalRef: BsModalRef
  ) {

  }

  closeModal() {
    this.bsModalRef.hide();
  }
}
