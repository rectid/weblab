import { Directive, ElementRef, Input, OnChanges, Renderer2, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  standalone: true
})
export class HighlightDirective implements OnChanges {
  @Input('appHighlight') isHighlighted = false;

  constructor(private readonly el: ElementRef<HTMLElement>, private readonly renderer: Renderer2) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('isHighlighted' in changes) {
      if (this.isHighlighted) {
        this.renderer.addClass(this.el.nativeElement, 'highlighted');
        setTimeout(() => this.renderer.removeClass(this.el.nativeElement, 'highlighted'), 2000);
      }
    }
  }
}
