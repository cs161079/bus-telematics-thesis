import { Component, ElementRef, ViewChild } from "@angular/core";
import { Chart, BarController, BarElement, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Colors } from "chart.js";
import zoomPlugin from 'chartjs-plugin-zoom';
import { BackendService } from "../../../service/backend.service";
import { CommonModule, DatePipe } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatButtonModule } from "@angular/material/button";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MAT_DATE_LOCALE, MatOptionSelectionChange, provideNativeDateAdapter } from "@angular/material/core";

export interface KPIBucket {
  slot_start: string;   // "HH:MM:SS"
  slot_end: string;
  pass_sum: number;
  cap_sum: number;
  load_factor: number;  // 0..1
  max_inst_lf: number;
  propose?: boolean;    // αν το enrichment το κάνεις στο backend
  reason?: string;
  action?: string;
  bucket_min?: number;
  service_date?: string;
  route_id?: number;
}

Chart.register(
  BarController, BarElement, LineController, LineElement, PointElement,
  CategoryScale, LinearScale, Tooltip, Legend, Colors, zoomPlugin
);

@Component({
  selector: "app-capacity-page",
  templateUrl: "capacity.page.html",
  styleUrl: "capacity.page.scss",
  standalone: true,
  providers: [
    DatePipe,
    provideNativeDateAdapter(),
    {provide: MAT_DATE_LOCALE, useValue: 'el-GR'}
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule,
    MatFormFieldModule,
    MatIconModule, MatButtonModule,
    MatInputModule, MatDatepickerModule,
    MatAutocompleteModule,
  ]
})
export class CapacityPage {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  filteredLine: any[] = [];
  routeObservable!: any[];

  date = new Date();
  lineId!: number;
  routeId!: number;
  bucketMin = 15;
  lf = 0.45;
  hf = 0.85;
  mult = 1.0;

  loading = false;
  message = '';
  chart?: Chart;

  constructor(
    private backSrv: BackendService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  async load() {
    this.message = '';
    this.loading = true;
    this.destroyChart();

    const dateStr = this.datePipe.transform(this.date, "YYYY-MM-dd");
    if(dateStr) {
      try {
        const rows = await this.backSrv.getKpis({
          date: dateStr,
          route_id: this.routeId,
          bucket_min: this.bucketMin,
          lf: this.lf,
          hf: this.hf,
          mult: this.mult
        }).toPromise();

        this.render(rows ?? []);
      } catch (e: any) {
        this.message = `Σφάλμα: ${e?.message || e}`;
      } finally {
        this.loading = false;
      }
    }

  }

  resetZoom() {
    this.chart?.resetZoom();
  }

  private destroyChart() {
    if (this.chart) { this.chart.destroy(); this.chart = undefined; }
  }

  private render(rows: KPIBucket[]) {
    if (!rows?.length) {
      this.message = 'Δεν βρέθηκαν δεδομένα.';
      return;
    }

    const labels = rows.map(r => (r.slot_start || '').slice(0, 5));
    const passengers = rows.map(r => r.pass_sum || 0);
    const capacity   = rows.map(r => r.cap_sum || 0);
    const lfSeries   = rows.map(r => +(r.load_factor || 0).toFixed(3));
    const flags = rows.map(r => ({
      propose: Boolean(r.propose),
      action:  r.action || null
    }));

    // Plugin: σκίαση slots με propose=true
    const shadePlugin = {
      id: 'proposeShade',
      beforeDatasetsDraw: (c: Chart) => {
        const { ctx, chartArea, scales } = c as any;
        const x = scales.x;
        ctx.save();
        ctx.globalAlpha = 0.10;
        flags.forEach((f, i) => {
          if (!f.propose) return;
          const left  = x.getPixelForValue(i - 0.5);
          const right = x.getPixelForValue(i + 0.5);
          ctx.fillRect(left, chartArea.top, right - left, chartArea.bottom - chartArea.top);
        });
        ctx.restore();
      }
    } as any;

    const proposeLabelPlugin = {
      id: 'proposeLabels',
      afterDatasetsDraw: (chart: any) => {
        const { ctx } = chart;
        const dataset = chart.data.datasets[0]; // υποθέτουμε ότι οι μπάρες "Passengers" είναι το πρώτο dataset
        const meta = chart.getDatasetMeta(0);

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.font = 'bold 12px sans-serif';

        // flags[i] -> true/false για κάθε slot
        flags.forEach((flag, i) => {
          if (!flag.propose) return;
          const element = meta.data[i];
          if (!element) return;
          const pos = element.tooltipPosition();

          // ⚠️ εικονίδιο
          ctx.fillStyle = '#e53935'; // κόκκινο
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText('⚠️', pos.x, pos.y - 10);

          // "+trip" label λίγο πιο πάνω
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(`${flag.action} trip`, pos.x, pos.y - 28);
        });

        ctx.restore();
      }
    };

    this.chart = new Chart(this.canvasRef.nativeElement.getContext('2d')!, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Passengers', data: passengers, yAxisID: 'y' },
          { label: 'Capacity',   data: capacity,   yAxisID: 'y' },
          { type: 'line', label: 'Load Factor', data: lfSeries, yAxisID: 'y1',
            tension: 0.3, borderWidth: 2, pointRadius: 2 },
          { type: 'line', label: `LF Low Threshold ${this.lf}`,
            data: lfSeries.map(_ => this.lf), yAxisID: 'y1', borderDash: [6,4], pointRadius: 0 },
          { type: 'line', label: `LF High Threshold ${this.hf}`,
            data: lfSeries.map(_ => this.hf), yAxisID: 'y1', borderDash: [6,4], pointRadius: 0 }
        ]
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        animation: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              afterBody: (items) => {
                const i = items?.[0]?.dataIndex ?? -1;
                return i >= 0 && flags[i].propose ? `→ Propose ${flags[i].action} Trip` : '';
              }
            }
          },
          colors: { forceOverride: true },
          zoom: {
            zoom:  { wheel: { enabled: true }, pinch: { enabled: true }, drag: { enabled: true }, mode: 'x' },
            pan:   { enabled: true, mode: 'x' }
          }
        },
        scales: {
          x:  { title: { display: true, text: 'Time slots' } },
          y:  { beginAtZero: true, title: { display: true, text: 'Passengers / Capacity' } },
          y1: { beginAtZero: true, max: 1, position: 'right', title: { display: true, text: 'Load Factor' } }
        }
      },
      plugins: [shadePlugin, proposeLabelPlugin]
    });
  }

  displayLine = (code: string | null): string => {
    if (!code) return '';
    const l = this.filteredLine.find(x => x.line_code===code);
    return l ? `${l.line_id} | ${l.line_descr}` : code; // fallback to code
  };

  displayRoute = (code: string | null): string => {
    if (!code) return '';
    const l = this.routeObservable?.find(x => x.code===code);
    return l ? `${l.code} | ${l.descr}` : code; // fallback to code
  };

  onLineSelect(ev: MatOptionSelectionChange) {
    this.backSrv.routeByLineCode(ev.source.value).subscribe(
      (vals) => {
        this.routeObservable = vals;
      }
    );
  }

  onLineInputChange(ev: any) {
    // console.log("Evnet ", ev.data);
    this.backSrv.lineSearch(this.lineId.toString()).subscribe(
      (values) => {
        this.filteredLine = values.data;
      }
    );
  }
}
