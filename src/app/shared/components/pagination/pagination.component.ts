import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-pagination',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './pagination.component.html'
})
export class PaginationComponent {
    @Input() totalItems: number = 0;
    @Input() currentPage: number = 1;
    @Input() pageSize: number = 15;
    @Input() pageSizeOptions: number[] = [15, 25, 50, 100];

    @Output() pageChange = new EventEmitter<number>();
    @Output() pageSizeChange = new EventEmitter<number>();

    get totalPages(): number {
        return Math.ceil(this.totalItems / this.pageSize);
    }

    get startItem(): number {
        return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
    }

    get endItem(): number {
        const end = this.currentPage * this.pageSize;
        return end > this.totalItems ? this.totalItems : end;
    }

    get isFirstPage(): boolean {
        return this.currentPage === 1;
    }

    get isLastPage(): boolean {
        return this.currentPage >= this.totalPages;
    }

    goToFirstPage(): void {
        if (!this.isFirstPage) {
            this.pageChange.emit(1);
        }
    }

    goToPreviousPage(): void {
        if (!this.isFirstPage) {
            this.pageChange.emit(this.currentPage - 1);
        }
    }

    goToNextPage(): void {
        if (!this.isLastPage) {
            this.pageChange.emit(this.currentPage + 1);
        }
    }

    goToLastPage(): void {
        if (!this.isLastPage) {
            this.pageChange.emit(this.totalPages);
        }
    }

    onPageSizeChange(event: any): void {
        const newSize = parseInt(event.target.value, 10);
        this.pageSizeChange.emit(newSize);
    }
}