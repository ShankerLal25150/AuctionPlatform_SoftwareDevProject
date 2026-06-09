import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Chart, registerables, ChartConfiguration, ChartTypeRegistry, TooltipItem } from 'chart.js';
import { Bid } from '../../../models/bid.model';

Chart.register(...registerables);

/**
 * A component that displays a line chart showing the price history of bids over time.
 * Uses Chart.js to render a responsive line chart with interactive tooltips.
 */
@Component({
  selector: 'app-price-history-chart',
  templateUrl: './price-history-chart.component.html',
  styleUrls: ['./price-history-chart.component.scss']
})
export class PriceHistoryChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  /** Array of bids to display in the chart */
  @Input() bids: Bid[] = [];

  /** Reference to the canvas element where the chart will be rendered */
  @ViewChild('priceChart') private chartRef!: ElementRef<HTMLCanvasElement>;
  
  /** The Chart.js instance */
  private chart: Chart | undefined;

  constructor() { }

  /**
   * Handles changes to the component's input properties.
   * Recreates the chart when the bids array changes and the canvas is ready.
   * @param changes SimpleChanges object containing current and previous property values
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bids']) {
      // If bids input changes, and the canvas is ready, recreate the chart.
      // createChart() handles destroying the old chart and drawing the new one (or clearing if bids are empty).
      if (this.chartRef?.nativeElement) {
        this.createChart();
      }
      // If chartRef is not ready yet, ngAfterViewInit will handle the initial chart creation.
    }
  }

  /**
   * Lifecycle hook that runs after the component's view is initialized.
   * Creates the initial chart if it hasn't been created by ngOnChanges.
   */
  ngAfterViewInit(): void {
    // Ensures the chart is created after the view is initialized,
    // if it hasn't been created by ngOnChanges (e.g. bids set before view init, or ngOnChanges ran before chartRef was available).
    if (!this.chart && this.chartRef?.nativeElement) {
      this.createChart();
    }
  }

  /**
   * Lifecycle hook that runs before the component is destroyed.
   * Cleans up by destroying the Chart.js instance to prevent memory leaks.
   */
  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
  }

  /**
   * Creates or recreates the price history chart.
   * Destroys any existing chart, processes the bid data, and renders a new chart.
   * If no bids are available, clears the canvas.
   * @private
   */
  private createChart(): void {
    if (!this.chartRef?.nativeElement) {
      // console.warn('PriceHistoryChartComponent: Canvas element not available yet for chart creation.');
      return;
    }

    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }

    if (!this.bids || this.bids.length === 0) {
      // console.log('PriceHistoryChartComponent: No bids to display. Chart cleared.');
      const context = this.chartRef.nativeElement.getContext('2d');
      if (context) {
        context.clearRect(0, 0, this.chartRef.nativeElement.width, this.chartRef.nativeElement.height);
      }
      return;
    }

    const context = this.chartRef.nativeElement.getContext('2d');
    if (!context) {
      console.error('PriceHistoryChartComponent: Failed to get 2D context from canvas element.');
      return;
    }

    const labels = this.bids.map(bid =>
      new Date(bid.bidTime).toLocaleString([], {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    );
    const dataPoints = this.bids.map(bid => bid.amount);

    const data: ChartConfiguration = {
      type: 'line' as keyof ChartTypeRegistry,
      data: {
        labels: labels,
        datasets: [{
          label: 'Bid Amount',
          data: dataPoints,
          fill: false, // Keep as line chart
          borderColor: 'rgb(75, 192, 192)',    // Line color (teal)
          tension: 0.1,                       // Line curve
          pointRadius: 5,                     // Point size
          pointHoverRadius: 8,                // Point size on hover
          pointBackgroundColor: 'rgb(75, 192, 192)', // Point fill color
          pointBorderColor: '#ffffff',          // Point border color (e.g., white for contrast)
          pointBorderWidth: 2,                // Point border width
          pointHoverBackgroundColor: '#ffffff', // Point fill on hover
          pointHoverBorderColor: 'rgb(75, 192, 192)', // Point border on hover
          pointHoverBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Amount ($)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Bid Time'
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (tooltipItem: TooltipItem<'line'>) {
                let label = tooltipItem.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (tooltipItem.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tooltipItem.parsed.y);
                }
                return label;
              }
            }
          }
        }
      }
    };

    this.chart = new Chart(context, data);
  }
}
