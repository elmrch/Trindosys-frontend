import { Component, computed, input, output } from '@angular/core';
import { Advisor } from '../../../../../shared/models/advisor.model';

@Component({
  selector: 'app-active-agent-indicator',
  templateUrl: './active-agent-indicator.html',
})
export class ActiveAgentIndicator {
  readonly advisorId = input<number | null>(null);
  readonly advisors = input<Advisor[]>([]);
  readonly canAssign = input(false);

  readonly assign = output<number | null>();

  protected readonly advisorName = computed(() => {
    const id = this.advisorId();
    if (id === null) {
      return null;
    }
    const advisor = this.advisors().find((a) => a.id === id);
    return advisor ? advisor.fullName : `Asesor #${id}`;
  });

  protected onSelectChange(value: string): void {
    this.assign.emit(value ? Number(value) : null);
  }
}
