import { Routes } from '@angular/router';
import { Templates } from './templates';
import { TemplateEditor } from './components/template-editor/template-editor';

export const templatesRoutes: Routes = [
  { path: 'crm/templates', component: Templates },
  { path: 'crm/templates/new', component: TemplateEditor },
  { path: 'crm/templates/:id', component: TemplateEditor },
];
