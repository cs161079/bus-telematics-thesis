export enum AlertType {
  INFO= "info",
  WARNING="warning",
  DANGER="danger"
}

export interface NotificationRec {
  alertType: AlertType;
  title?: string;
  message?: string;
}

export interface AlertRec {
  message: string;
  type: AlertType;
}

export interface CronjobRec {
  id: number;
  start: Date | undefined;
  finish: Date | undefined  ;
  status: string;
  error: string;
}

export interface PagingData {
  data: any;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
