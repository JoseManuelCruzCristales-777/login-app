import { NgModule, importProvidersFrom } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
// ...otros imports...

@NgModule({
  declarations: [
    // ...tus componentes...
  ],
  imports: [
    BrowserModule,
    // ...otros módulos...
  ],
  providers: [
    provideHttpClient(),
    // ...otros providers...
  ],
  bootstrap: [/* tu componente raíz */]
})
export class AppModule { }
