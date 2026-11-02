import { Routes } from '@angular/router';
import { CatalogComponent } from './components/catalog/catalog.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CirculationComponent } from './components/circulation/circulation.component';
import { MyLoansComponent } from './components/my-loans/my-loans.component';
import { CategoriesManageComponent } from './components/categories-manage/categories-manage.component';

export const routes: Routes = [
  { path: '', redirectTo: 'catalog', pathMatch: 'full' },
  { path: 'catalog', component: CatalogComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'circulation', component: CirculationComponent },
  { path: 'my-loans', component: MyLoansComponent },
  { path: 'manage', component: CategoriesManageComponent },
  { path: '**', redirectTo: 'catalog' }
];
