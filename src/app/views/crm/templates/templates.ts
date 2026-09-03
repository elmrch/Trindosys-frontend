import { Component } from '@angular/core';
import { TemplateList } from './components/template-list/template-list';

@Component({
  selector: 'app-templates',
  imports: [TemplateList],
  template: '<app-template-list />',
})
export class Templates {}
