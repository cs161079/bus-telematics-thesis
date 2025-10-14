import { GeneralSerivce } from './../../../service/general.service';
import { BackendService } from '../../../service/backend.service';
import { CronjobRec } from '../../../models/models.interface';
import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { Router } from '@angular/router';
import { PaginationComponent } from '../../../components/pagination/pagination.component';
import { MatPaginatorModule } from '@angular/material/paginator';

@Component({
  selector: "app-jobs-page",
  templateUrl: "jobs.page.html",
  styleUrl: "jobs.page.scss",
  imports: [FormsModule, MatButtonModule, CommonModule, MatPaginatorModule],
  standalone: true,
})
export class JobPage implements OnInit{
  cronJobs: CronjobRec[] = [];
  totalPages : number[] = [];
  currentPage: number = 1;
  totalRec: number = 0;
  pageSize: number = 0;
  constructor(
    private backSrv: BackendService,
    private router: Router,
    private generalSrv: GeneralSerivce
  ) {

  }
  ngOnInit(): void {
    this.totalPages = Array.from({ length: 1 }, (_, i) => i + 1);
    this.getDataFromPage();
    // this.backSrv.getJobsPaging(1).subscribe(
    //   (data) => {
    //     debugger;
    //     this.totalPages = Array.from({ length: data.totalPages }, (_, i) => i + 1);
    //     this.cronJobs = data.data;
    //     this.currentPage = data.page;
    //     this.totalRec = data.total;
    //     this.pageSize = data.pageSize;
    //   },
    //   (error) => {
    //     console.log("Http Error occured ", error);
    //   }
    // );
  }

  getDataFromPage() {
    this.backSrv.getJobsPaging(this.currentPage).subscribe(
      (data) => {
        // debugger;
        this.totalPages = Array.from({ length: data.totalPages }, (_, i) => i + 1);
        this.cronJobs = data.data;
        this.currentPage = data.page;
        this.totalRec = data.total;
        this.pageSize = data.pageSize;
      },
      (error) => {
        // debugger;
        console.log("Http Error occured ", error);
        if(error.status === 0) {
          this.generalSrv.showDangerAlert("Server is unavailable!");
        } else {
          this.generalSrv.showDangerAlert(error.error.error);
        }

      }
    );
  }

  onPageClick(ev: any, i: number) {
    this.currentPage = i;
    this.getDataFromPage();
  }

  onPreviousPage(ev: any) {
    if(this.currentPage == 1) {
      return;
    }
    this.currentPage = this.currentPage - 1;
    this.getDataFromPage();

  }

  onNextPage(ev: any) {
    if(this.currentPage === this.totalPages.length) {
      return;
    }
    this.currentPage = this.currentPage + 1;
    this.getDataFromPage();
  }

  onPage(e: any) {
    this.currentPage = e.pageIndex + 1;   // MatPaginator is 0-based
    this.pageSize = e.pageSize;
    this.getDataFromPage();               // fetch or slice data for new page
  }

  get start() {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get end() {
    return Math.min(this.currentPage * this.pageSize, this.totalRec);
  }

  returnHome(ev: any) {
    this.router.navigate(["/"]);
  }
}
