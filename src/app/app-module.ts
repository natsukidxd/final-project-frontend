import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { AlertComponent } from '@app/_components';
import { JwtInterceptor, ErrorInterceptor, fakeBackendProvider, appInitializer } from '@app/_helpers';
import { AccountService } from '@app/_services';
import { environment } from '@environments/environment';

@NgModule({
  declarations: [
    App,
    AlertComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [
    { provide: APP_INITIALIZER, useFactory: appInitializer, multi: true, deps: [AccountService] },
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    // Fake backend provider disabled for live backend testing
    // To re-enable: ...(environment.production ? [] : [fakeBackendProvider])
  ],
  bootstrap: [App]
})
export class AppModule { }