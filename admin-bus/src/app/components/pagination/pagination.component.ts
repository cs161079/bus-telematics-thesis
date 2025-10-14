import { CommonModule } from "@angular/common";
import { Component, computed, EventEmitter, Input, Output } from "@angular/core";

type PageItem =
  | { kind: 'num'; value: number; active: boolean }
  | { kind: 'ellipsis' };

@Component({
  selector: "app-pagination",
  templateUrl: "pagination.component.html",
  styleUrl: "pagination.component.scss",
  imports: [CommonModule],
  standalone: true
})
export class PaginationComponent {
  /** Total number of items */
  @Input({ required: true }) total = 0;
  /** Items per page */
  @Input({ required: true }) pageSize = 50;
  /** 1-based current page */
  @Input() page = 1;
  /** How many page numbers to show on each side of current */
  @Input() window = 2;

  @Output() pageChange = new EventEmitter<number>();

  pagesCount = computed(() => Math.max(1, Math.ceil(this.total / this.pageSize)));

  startIndex = computed(() =>
    this.total === 0 ? 0 : (this.page - 1) * this.pageSize + 1
  );

  endIndex = computed(() =>
    this.total === 0 ? 0 : Math.min(this.page * this.pageSize, this.total)
  );

  /** Build the windowed page list with ellipses placeholders */
  pageItems = computed(() => {
    const items: Array<{ kind: 'num' | 'ellipsis'; value?: number; active?: boolean }> = [];
    const pages = this.pagesCount();
    const cur = this.page;
    const win = this.window;

    const addNum = (p: number) => items.push({ kind: 'num', value: p, active: p === cur });
    const addEllipsis = () => items.push({ kind: 'ellipsis' });

    if (pages <= 1) return [{ kind: 'num', value: 1, active: true }];

    // Always show first
    addNum(1);

    const start = Math.max(2, cur - win);
    const end = Math.min(pages - 1, cur + win);

    if (start > 2) addEllipsis();

    for (let p = start; p <= end; p++) addNum(p);

    if (end < pages - 1) addEllipsis();

    if (pages > 1) addNum(pages);

    return items;
  });

  goFirst() { if (this.page > 1) this.setPage(1); }
  goPrev()  { if (this.page > 1) this.setPage(this.page - 1); }
  goNext()  { if (this.page < this.pagesCount()) this.setPage(this.page + 1); }
  goLast()  { const last = this.pagesCount(); if (this.page < last) this.setPage(last); }

  setPage(p: number) {
    const last = this.pagesCount();
    const clamped = Math.min(last, Math.max(1, p));
    if (clamped !== this.page) {
      this.page = clamped;
      this.pageChange.emit(this.page);
    }
  }

  // optional: helps with DOM perf
  trackByPageItem = (_: number, it: PageItem) =>
    it.kind === 'num' ? `n${it.value}` : 'e';

}
