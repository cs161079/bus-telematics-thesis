import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { KeycloakService } from "keycloak-angular";
import { OAuthService } from "./oauth.service";
import { Observable } from "rxjs";

// export class AuthInterceptor implements HttpInterceptor {
//   constructor(
//     private oatuhSrv: OAuthService
//   ) {}

//   intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
//     const headers = req.headers.set('Authorization', 'Bearer ' + this.oatuhSrv.getToken());
//     return next.handle(req.clone({ headers }));
//   }
// }
