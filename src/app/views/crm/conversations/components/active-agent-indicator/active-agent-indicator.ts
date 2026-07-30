import { Component, input } from '@angular/core';

@Component({
  selector: 'app-active-agent-indicator',
  templateUrl: './active-agent-indicator.html',
})
export class ActiveAgentIndicator {
  readonly advisorId = input<number | null>(null);
}
