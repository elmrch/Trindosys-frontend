import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon, SweetAlertResult } from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class SweetAlertService {
  private swalWithBootstrapButtons = Swal.mixin({
    customClass: {
      confirmButton:
        '!bg-slate-900 dark:!bg-blue-600 !text-white !px-4 !py-2 !rounded-md !mx-2 hover:!bg-slate-800 dark:hover:!bg-blue-700',
      cancelButton:
        '!bg-slate-100 dark:!bg-slate-700 !text-slate-900 dark:!text-white !px-4 !py-2 !rounded-md !mx-2 hover:!bg-slate-200 dark:hover:!bg-slate-600',
      actions: '!gap-2',
    },
    buttonsStyling: false,
  });

  confirm(title: string, text: string, confirmButtonText: string = 'Sí, confirmar'): Promise<SweetAlertResult> {
    return this.swalWithBootstrapButtons.fire({
      title: title,
      text: text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: confirmButtonText,
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });
  }

  success(title: string) {
    return this.swalWithBootstrapButtons.fire({
      icon: 'success',
      title: title,
      showConfirmButton: false,
      timer: 1500,
    });
  }

  error(title: string, text?: string) {
    return this.swalWithBootstrapButtons.fire({
      icon: 'error',
      title: title,
      text: text,
    });
  }

  info(title: string) {
    return this.swalWithBootstrapButtons.fire({
      icon: 'info',
      title: title,
      showConfirmButton: false,
      timer: 1500,
    });
  }

  toast(title: string, icon: SweetAlertIcon = 'success') {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
    });

    Toast.fire({
      icon: icon,
      title: title,
    });
  }
}
